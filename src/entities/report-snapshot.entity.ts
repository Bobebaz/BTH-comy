import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('report_snapshots')
export class ReportSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 100 })
  reportType: string; // 'OVERVIEW' | 'BY_PRODUCT' | 'BY_ORDER'

  @Column('int')
  totalInventoryQuantity: number; // Tổng hàng tồn kho

  @Column('int')
  totalSoldQuantity: number; // Tổng hàng đã bán

  @Column('decimal', { precision: 18, scale: 2 })
  totalRevenue: number; // Tổng doanh thu

  @Column('decimal', { precision: 18, scale: 2 })
  totalCost: number; // Tổng chi phí

  @Column('decimal', { precision: 18, scale: 2 })
  totalProfit: number; // Tổng lợi nhuận

  @Column({ type: 'nvarchar', length: 'MAX' })
  detailsJson: string; // Lưu chi tiết báo cáo dạng JSON

  @CreateDateColumn()
  createdAt: Date;
}