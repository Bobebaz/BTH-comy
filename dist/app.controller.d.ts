import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getOverviewReport(): Promise<{
        generatedAt: Date;
        summary: import("./app.service").ReportSummary;
        products: import("./app.service").ProductReportItem[];
    }>;
    getReportByProducts(): Promise<import("./app.service").ProductReportItem[]>;
    getReportByOrders(): Promise<import("./app.service").OrderReportItem[]>;
    createSnapshot(): Promise<import("./entities/report-snapshot.entity").ReportSnapshot>;
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
