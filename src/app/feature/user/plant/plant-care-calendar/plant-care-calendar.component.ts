import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'environments/environment';
import { TopNavigatorComponent } from '../../../../shared/top-navigator/top-navigator.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule, MatChipListbox } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import moment from 'moment';
import 'moment/locale/vi';

interface CareHistoryItem {
  logId: number;
  careDate: number;
  notes: string;
  imageUrl: string | null;
  createdAt: number;
  careTypeName: string;
  plantName: string;
}

interface CareHistoryResponse {
  content: CareHistoryItem[];
  totalElements: number;
  totalPages: number;
}

interface CareStreak {
  typeId: number;
  typeName: string;
  typeIcon: string;
  typeColor: string;
  currentStreak: number;
  longestStreak: number;
  totalCares: number;
  lastCareDate: moment.Moment | null;
  streakDays: moment.Moment[];
}

@Component({
  selector: 'app-plant-care-calendar',
  standalone: true,
  imports: [
    CommonModule,
    TopNavigatorComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './plant-care-calendar.component.html',
  styleUrls: ['./plant-care-calendar.component.scss']
})
export class PlantCareCalendarComponent implements OnInit {
  userPlantId: string | null = null;
  loading = false;
  currentMonth = moment();
  selectedDate = moment();
  
  careTypes = [
    { id: 1, name: 'Tưới nước', icon: 'fas fa-tint', color: '#2196F3' },
    { id: 2, name: 'Bón phân', icon: 'fas fa-leaf', color: '#4CAF50' },
    { id: 3, name: 'Cắt tỉa', icon: 'fas fa-cut', color: '#FF9800' },
    { id: 4, name: 'Phun thuốc', icon: 'fas fa-spray-can', color: '#9C27B0' }
  ];

  careHistory: CareHistoryItem[] = [];
  careStreaks: CareStreak[] = [];
  calendarDays: moment.Moment[] = [];
  monthCareData: Map<string, number[]> = new Map(); // key: "YYYY-MM-DD", value: array of care type IDs

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Set locale cho moment
    moment.locale('vi');
    
    this.userPlantId = this.route.snapshot.paramMap.get('userPlantId');
    this.generateCalendarDays();
    this.loadCareHistory();
  }

  generateCalendarDays() {
    const startOfMonth = this.currentMonth.clone().startOf('month');
    const endOfMonth = this.currentMonth.clone().endOf('month');
    const startDate = startOfMonth.clone().startOf('week');
    const endDate = endOfMonth.clone().endOf('week');

    this.calendarDays = [];
    let current = startDate.clone();

    while (current.isSameOrBefore(endDate)) {
      this.calendarDays.push(current.clone());
      current.add(1, 'day');
    }
  }

  loadCareHistory() {
    if (!this.userPlantId) return;
    
    this.loading = true;
    this.http.get<CareHistoryResponse>(`${environment.apiUrl}/plant-care/${this.userPlantId}/care-history?page=0&size=100`).subscribe({
      next: (response) => {
        this.careHistory = response.content;
        this.processCareData();
        this.calculateStreaks();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading care history:', error);
        this.loading = false;
      }
    });
  }

  processCareData() {
    this.monthCareData.clear();
    
    this.careHistory.forEach(item => {
      const careDate = moment(item.careDate);
      const dateKey = careDate.format('YYYY-MM-DD');
      const careTypeId = this.getCareTypeIdByName(item.careTypeName);
      
      if (!this.monthCareData.has(dateKey)) {
        this.monthCareData.set(dateKey, []);
      }
      
      const existingTypes = this.monthCareData.get(dateKey) || [];
      if (!existingTypes.includes(careTypeId)) {
        existingTypes.push(careTypeId);
        this.monthCareData.set(dateKey, existingTypes);
      }
    });
  }

  getCareTypeIdByName(typeName: string): number {
    const careType = this.careTypes.find(type => type.name === typeName);
    return careType ? careType.id : 1;
  }

  calculateStreaks() {
    this.careStreaks = this.careTypes.map(type => {
      const typeHistory = this.careHistory.filter(item => 
        this.getCareTypeIdByName(item.careTypeName) === type.id
      );
      
      const sortedDates = typeHistory
        .map(item => moment(item.careDate))
        .sort((a, b) => b.valueOf() - a.valueOf());
      
      const currentStreak = this.calculateCurrentStreak(sortedDates);
      const longestStreak = this.calculateLongestStreak(sortedDates);
      const streakDays = this.getStreakDays(sortedDates);
      
      return {
        typeId: type.id,
        typeName: type.name,
        typeIcon: type.icon,
        typeColor: type.color,
        currentStreak,
        longestStreak,
        totalCares: typeHistory.length,
        lastCareDate: sortedDates.length > 0 ? sortedDates[0] : null,
        streakDays
      };
    });
  }

  calculateCurrentStreak(dates: moment.Moment[]): number {
    if (dates.length === 0) return 0;
    
    let streak = 0;
    let currentDate = moment().startOf('day');
    let lastCareDate = dates[0];
    
    // Nếu lần cuối chăm sóc không phải hôm nay hoặc hôm qua, streak = 0
    if (currentDate.diff(lastCareDate, 'days') > 1) {
      return 0;
    }
    
    // Tính streak từ ngày cuối cùng
    for (let i = 0; i < dates.length; i++) {
      const careDate = dates[i].startOf('day');
      const expectedDate = currentDate.clone().subtract(streak, 'days');
      
      if (careDate.isSame(expectedDate)) {
        streak++;
      } else if (careDate.isAfter(expectedDate)) {
        // Bỏ qua ngày trong tương lai
        continue;
      } else {
        // Gap trong streak, dừng lại
        break;
      }
    }
    
    return streak;
  }

  calculateLongestStreak(dates: moment.Moment[]): number {
    if (dates.length === 0) return 0;
    
    let longestStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < dates.length; i++) {
      const prevDate = dates[i - 1].startOf('day');
      const currDate = dates[i].startOf('day');
      
      if (prevDate.diff(currDate, 'days') === 1) {
        currentStreak++;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, currentStreak);
    return longestStreak;
  }

  getStreakDays(dates: moment.Moment[]): moment.Moment[] {
    return dates.slice(0, 30); // Lấy 30 ngày gần nhất
  }

  getCareTypesForDate(date: moment.Moment): number[] {
    const dateKey = date.format('YYYY-MM-DD');
    return this.monthCareData.get(dateKey) || [];
  }

  getCareTypeColor(typeId: number): string {
    const careType = this.careTypes.find(type => type.id === typeId);
    return careType ? careType.color : '#ccc';
  }

  isToday(date: moment.Moment): boolean {
    return date.isSame(moment(), 'day');
  }

  isCurrentMonth(date: moment.Moment): boolean {
    return date.isSame(this.currentMonth, 'month');
  }

  previousMonth() {
    this.currentMonth.subtract(1, 'month');
    this.generateCalendarDays();
  }

  nextMonth() {
    this.currentMonth.add(1, 'month');
    this.generateCalendarDays();
  }

  selectDate(date: moment.Moment) {
    this.selectedDate = date;
  }

  getSelectedDateCareTypes(): number[] {
    return this.getCareTypesForDate(this.selectedDate);
  }

  getSelectedDateInfo(): string {
    if (this.selectedDate.isSame(moment(), 'day')) {
      return 'Hôm nay';
    } else if (this.selectedDate.isSame(moment().subtract(1, 'day'), 'day')) {
      return 'Hôm qua';
    } else if (this.selectedDate.isSame(moment().add(1, 'day'), 'day')) {
      return 'Ngày mai';
    } else {
      return this.selectedDate.format('DD/MM/YYYY');
    }
  }

  getStreakPercentage(streak: CareStreak): number {
    if (streak.longestStreak === 0) return 0;
    return (streak.currentStreak / streak.longestStreak) * 100;
  }

  trackByDate(index: number, day: moment.Moment) {
    return day.format('YYYY-MM-DD');
  }

  getCareTypeName(id: number): string {
    const careType = this.careTypes.find(type => type.id === id);
    return careType ? careType.name : 'Lịch nhắc';
  }

  getCareTypeIcon(id: number): string {
    const careType = this.careTypes.find(type => type.id === id);
    return careType ? careType.icon : 'fas fa-bell';
  }

  getTimeAgo(timestamp: number): string {
    return moment(timestamp).fromNow();
  }
}
