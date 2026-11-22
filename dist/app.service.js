"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const report_snapshot_entity_1 = require("./entities/report-snapshot.entity");
let AppService = class AppService {
    reportRepository;
    httpService;
    PRODUCT_SERVICE_URL = 'http://localhost:3001/products';
    ORDER_SERVICE_URL = 'http://localhost:3002/orders';
    constructor(reportRepository, httpService) {
        this.reportRepository = reportRepository;
        this.httpService = httpService;
    }
    async fetchExternalData() {
        try {
            const [productsRes, ordersRes] = await Promise.all([
                (0, rxjs_1.firstValueFrom)(this.httpService.get(this.PRODUCT_SERVICE_URL)),
                (0, rxjs_1.firstValueFrom)(this.httpService.get(this.ORDER_SERVICE_URL)),
            ]);
            return {
                products: productsRes.data || [],
                orders: ordersRes.data || [],
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Không thể lấy dữ liệu từ Product Service (3001) hoặc Order Service (3002). Vui lòng kiểm tra kết nối.');
        }
    }
    async getOverviewReport() {
        const productReports = await this.getReportByProducts();
        const summary = productReports.reduce((acc, item) => {
            acc.totalInventoryQuantity += item.inventoryQuantity;
            acc.totalSoldQuantity += item.soldQuantity;
            acc.totalRevenue += item.revenue;
            acc.totalCost += item.cost;
            acc.totalProfit += item.profit;
            return acc;
        }, {
            totalInventoryQuantity: 0,
            totalSoldQuantity: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
        });
        return {
            generatedAt: new Date(),
            summary,
            products: productReports,
        };
    }
    async getReportByProducts() {
        const { products, orders } = await this.fetchExternalData();
        const validOrders = orders.filter((o) => o.status !== 'CANCELLED');
        return products.map((product) => {
            const productOrders = validOrders.filter((o) => o.productId === product.id);
            const inventoryQuantity = Number(product.quantity ?? product.stock ?? 0);
            const soldQuantity = productOrders.reduce((sum, o) => sum + Number(o.quantity), 0);
            const revenue = productOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
            const unitCost = product.costPrice !== undefined ? Number(product.costPrice) : Number(product.price) * 0.7;
            const cost = soldQuantity * unitCost;
            const profit = revenue - cost;
            return {
                productId: product.id,
                productName: product.name,
                unitPrice: Number(product.price),
                unitCost,
                inventoryQuantity,
                soldQuantity,
                revenue,
                cost,
                profit,
            };
        });
    }
    async getReportByOrders() {
        const { products, orders } = await this.fetchExternalData();
        const productMap = new Map();
        products.forEach((p) => productMap.set(p.id, p));
        return orders.map((order) => {
            const product = productMap.get(order.productId);
            const isCancelled = order.status === 'CANCELLED';
            const soldQuantity = isCancelled ? 0 : Number(order.quantity);
            const revenue = isCancelled ? 0 : Number(order.totalPrice);
            const unitPrice = product ? Number(product.price) : revenue / (Number(order.quantity) || 1);
            const unitCost = product && product.costPrice !== undefined ? Number(product.costPrice) : unitPrice * 0.7;
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
    async getSnapshots() {
        const snapshots = await this.reportRepository.find({ order: { createdAt: 'DESC' } });
        return snapshots.map((s) => ({
            ...s,
            details: JSON.parse(s.detailsJson),
            detailsJson: undefined,
        }));
    }
    async getSnapshotById(id) {
        const snapshot = await this.reportRepository.findOne({ where: { id } });
        if (!snapshot) {
            throw new common_1.NotFoundException(`Không tìm thấy bản lưu báo cáo với ID ${id}`);
        }
        return {
            ...snapshot,
            details: JSON.parse(snapshot.detailsJson),
            detailsJson: undefined,
        };
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(report_snapshot_entity_1.ReportSnapshot)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        axios_1.HttpService])
], AppService);
//# sourceMappingURL=app.service.js.map