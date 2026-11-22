import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
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
export declare class AppService {
    private readonly reportRepository;
    private readonly httpService;
    private readonly PRODUCT_SERVICE_URL;
    private readonly ORDER_SERVICE_URL;
    constructor(reportRepository: Repository<ReportSnapshot>, httpService: HttpService);
    private fetchExternalData;
    getOverviewReport(): Promise<{
        generatedAt: Date;
        summary: ReportSummary;
        products: ProductReportItem[];
    }>;
    getReportByProducts(): Promise<ProductReportItem[]>;
    getReportByOrders(): Promise<OrderReportItem[]>;
    createSnapshot(): Promise<ReportSnapshot>;
    getSnapshots(): Promise<{
        details: any;
        detailsJson: undefined;
        id: number;
        reportType: string;
        totalInventoryQuantity: number;
        totalSoldQuantity: number;
        totalRevenue: number;
        totalCost: number;
        totalProfit: number;
        createdAt: Date;
    }[]>;
    getSnapshotById(id: number): Promise<{
        details: any;
        detailsJson: undefined;
        id: number;
        reportType: string;
        totalInventoryQuantity: number;
        totalSoldQuantity: number;
        totalRevenue: number;
        totalCost: number;
        totalProfit: number;
        createdAt: Date;
    }>;
}
