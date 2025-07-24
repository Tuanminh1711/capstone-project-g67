import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartType, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-total-users-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-card">
      <h3 class="chart-title">Biểu đồ đăng ký người dùng theo ngày</h3>
      <canvas baseChart
        [data]="chartData"
        [type]="chartType"
        [options]="chartOptions"
        [labels]="chartLabels"
        [plugins]="chartPlugins">
      </canvas>
    </div>
  `,
  styleUrls: ['./total-users-chart.component.scss']
})
export class TotalUsersChartComponent {
  @Input() dailyTotals: Array<{ date: string; totalRegistered: number }> = [];

  chartType: ChartType = 'bar';
  chartLabels: Array<string> = [];
  chartData: {
    labels: Array<string>;
    datasets: Array<{ data: Array<number>; label: string }>;
  } = {
    labels: [],
    datasets: [{ data: [], label: 'Số đăng ký' }]
  };
  chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      x: {},
      y: { beginAtZero: true }
    }
  };
  chartPlugins = [];

  ngOnChanges() {
    this.chartLabels = this.dailyTotals.map(item => item.date);
    this.chartData = {
      labels: this.chartLabels,
      datasets: [{ data: this.dailyTotals.map(item => item.totalRegistered), label: 'Số đăng ký' }]
    };
  }
}
