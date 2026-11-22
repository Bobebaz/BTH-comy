import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('reports')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // GET /reports/overview: Thống kê tổng quan (Tồn kho, Đã bán, Doanh thu, Chi phí, Lợi nhuận)
  @Get('overview')
  getOverviewReport() {
    return this.appService.getOverviewReport();
  }

  // GET /reports/products: Thống kê chi tiết theo từng sản phẩm
  @Get('products')
  getReportByProducts() {
    return this.appService.getReportByProducts();
  }

  // GET /reports/orders: Thống kê chi tiết theo từng đơn hàng
  @Get('orders')
  getReportByOrders() {
    return this.appService.getReportByOrders();
  }

  // POST /reports/snapshots: Chốt và lưu báo cáo vào database riêng (report_db)
  @Post('snapshots')
  createSnapshot() {
    return this.appService.createSnapshot();
  }

  // GET /reports/snapshots: Xem lịch sử báo cáo đã lưu
  @Get('snapshots')
  getSnapshots() {
    return this.appService.getSnapshots();
  }

  // GET /reports/snapshots/:id: Xem chi tiết 1 bản báo cáo đã lưu
  @Get('snapshots/:id')
  getSnapshotById(@Param('id', ParseIntPipe) id: number) {
    return this.appService.getSnapshotById(id);
  }
}