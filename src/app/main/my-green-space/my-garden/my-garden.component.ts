import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';

export interface Plant {
  id: string;
  name: string;
  image: string;
  description?: string;
  tags?: string[];
  [key: string]: any;
}

@Component({
  selector: 'app-my-garden',
  standalone: true,
  imports: [CommonModule, TopNavigatorComponent, HttpClientModule],
  templateUrl: './my-garden.component.html',
  styleUrls: ['./my-garden.component.scss']
})
export class MyGardenComponent implements OnInit {
  plants: Plant[] = [];
  apiError = false;
  layout: 'grid' | 'list' = 'grid';
  filter: 'all' | 'indoor' | 'outdoor' = 'all';

  constructor(private http: HttpClient) {}

  get filteredPlants(): Plant[] {
    if (this.filter === 'all') return this.plants;
    if (this.filter === 'indoor') return this.plants.filter(p => p.tags?.map(t => t.toLowerCase()).includes('indoor'));
    if (this.filter === 'outdoor') return this.plants.filter(p => p.tags?.map(t => t.toLowerCase()).includes('outdoor'));
    return this.plants;
  }

  ngOnInit() {
    this.loadAllPlants();
  }

  loadAllPlants() {
    this.apiError = false;
    this.http.get<any>('/api/plants/search?pageNo=0&pageSize=1000').subscribe({
      next: (res) => {
        const data = res?.data;
        if (!data || !Array.isArray(data.plants)) {
          this.plants = [];
          this.apiError = true;
          return;
        }
        // Map dữ liệu backend sang Plant[]
        this.plants = data.plants.map((p: any) => ({
          id: p.id?.toString() ?? '',
          name: p.commonName || p.name || '',
          image: p.imageUrls?.[0] || '',
          description: p.description || '',
          tags: [p.categoryName, p.lightRequirement, p.careDifficulty, p.status].filter(Boolean)
        }));
      },
      error: () => {
        this.apiError = true;
        this.plants = [];
      }
    });
  }
}
