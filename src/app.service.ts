import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ReportSnapshot } from './entities/report-snapshot.entity';

export interface ProductReportItem {
  productId: number;
  productName: string;
  unitPrice: number;
  unitCost: number;
  inventoryQuantity: number;
  soldQuantity: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface OrderReportItem {
  orderId: number;
  status: string;
  productId: number;
  productName: string;
  soldQuantity: number;
  revenue: number;
  cost: number;
  profit: number;
  createdAt: string;
}

export interface ReportSummary {
  totalInventoryQuantity: number;
  totalSoldQuantity: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
}

@Injectable()
export class AppService {
  private readonly PRODUCT_SERVICE_URL = 'http://localhost:3001/products';
  private readonly ORDER_SERVICE_URL = 'http://localhost:3002/orders';

  constructor(
    @InjectRepository(ReportSnapshot)
    private readonly reportRepository: Repository<ReportSnapshot>,
    private readonly httpService: HttpService,
  ) {}

  // Hàm phụ trợ lấy dữ liệu đồng thời từ Product Service và Order Service
  private async fetchExternalData(): Promise<{ products: any[]; orders: any[] }> {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        firstValueFrom(this.httpService.get(this.PRODUCT_SERVICE_URL)),
        firstValueFrom(this.httpService.get(this.ORDER_SERVICE_URL)),
      ]);
      return {
        products: productsRes.data || [],
        orders: ordersRes.data || [],
      };
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        'Không thể lấy dữ liệu từ Product Service (3001) hoặc Order Service (3002). Vui lòng kiểm tra kết nối.',
      );
    }
  }

  // 1. Báo cáo tổng hợp toàn hệ thống
  async getOverviewReport() {
    const productReports: ProductReportItem[] = await this.getReportByProducts();

    const summary = productReports.reduce<ReportSummary>(
      (acc: ReportSummary, item: ProductReportItem) => {
        acc.totalInventoryQuantity += item.inventoryQuantity;
        acc.totalSoldQuantity += item.soldQuantity;
        acc.totalRevenue += item.revenue;
        acc.totalCost += item.cost;
        acc.totalProfit += item.profit;
        return acc;
      },
      {
        totalInventoryQuantity: 0,
        totalSoldQuantity: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
      },
    );

    return {
      generatedAt: new Date(),
      summary,
      products: productReports,
    };
  }

  // 2. Báo cáo chi tiết theo từng Sản phẩm
  async getReportByProducts(): Promise<ProductReportItem[]> {
    const { products, orders } = await this.fetchExternalData();

    // Chỉ tính các đơn hàng không bị hủy
    const validOrders = orders.filter((o: any) => o.status !== 'CANCELLED');

    return products.map((product: any): ProductReportItem => {
      const productOrders = validOrders.filter((o: any) => o.productId === product.id);

      const inventoryQuantity = Number(product.quantity ?? product.stock ?? 0);
      const soldQuantity = productOrders.reduce((sum: number, o: any) => sum + Number(o.quantity), 0);
      const revenue = productOrders.reduce((sum: number, o: any) => sum + Number(o.totalPrice), 0);

      // Lấy giá vốn (costPrice) nếu có, nếu chưa có thì ước tính 70% giá bán
      const unitCost =
        product.costPrice !== undefined ? Number(product.costPrice) : Number(product.price) * 0.7;
      const cost = soldQuantity * unitCost;
      const profit = revenue - cost;

      return {
        productId: product.id,
        productName: product.name,
        unitPrice: Number(product.price),
        unitCost,
        inventoryQuantity, // Số lượng hàng tồn
        soldQuantity,      // Số lượng hàng bán được
        revenue,           // Doanh thu
        cost,              // Chi phí
        profit,            // Lợi nhuận
      };
    });
  }

  // 3. Báo cáo chi tiết theo từng Đơn hàng
  async getReportByOrders(): Promise<OrderReportItem[]> {
    const { products, orders } = await this.fetchExternalData();

    const productMap = new Map<number, any>();
    products.forEach((p: any) => productMap.set(p.id, p));

    return orders.map((order: any): OrderReportItem => {
      const product = productMap.get(order.productId);
      const isCancelled = order.status === 'CANCELLED';

      const soldQuantity = isCancelled ? 0 : Number(order.quantity);
      const revenue = isCancelled ? 0 : Number(order.totalPrice);

      const unitPrice = product ? Number(product.price) : revenue / (Number(order.quantity) || 1);
      const unitCost =
        product && product.costPrice !== undefined ? Number(product.costPrice) : unitPrice * 0.7;

      const cost = soldQuantity * unitCost;
      const profit = revenue - cost;

      return {
        orderId: order.id,
        status: order.status,
        productId: order.productId,
        productName: order.productName,
        soldQuantity,
        revenue,
        cost,
        profit,
        createdAt: order.createdAt,
      };
    });
  }

  // 4. Lưu bản chụp báo cáo vào database riêng (report_db)
  async createSnapshot() {
    const overview = await this.getOverviewReport();

    const snapshot = this.reportRepository.create({
      reportType: 'OVERVIEW',
      totalInventoryQuantity: overview.summary.totalInventoryQuantity,
      totalSoldQuantity: overview.summary.totalSoldQuantity,
      totalRevenue: overview.summary.totalRevenue,
      totalCost: overview.summary.totalCost,
      totalProfit: overview.summary.totalProfit,
      detailsJson: JSON.stringify(overview.products),
    });

    return this.reportRepository.save(snapshot);
  }

  // Lấy lịch sử các bản chụp báo cáo đã lưu
  async getSnapshots() {
    const snapshots = await this.reportRepository.find({ order: { createdAt: 'DESC' } });
    return snapshots.map((s) => ({
      ...s,
      details: JSON.parse(s.detailsJson),
      detailsJson: undefined,
    }));
  }

  // Xem chi tiết 1 bản chụp báo cáo theo ID
  async getSnapshotById(id: number) {
    const snapshot = await this.reportRepository.findOne({ where: { id } });
    if (!snapshot) {
      throw new NotFoundException(`Không tìm thấy bản lưu báo cáo với ID ${id}`);
    }
    return {
      ...snapshot,
      details: JSON.parse(snapshot.detailsJson),
      detailsJson: undefined,
    };
  }
}