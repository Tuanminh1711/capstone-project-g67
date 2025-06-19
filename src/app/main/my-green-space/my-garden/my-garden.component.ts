import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopNavigatorComponent } from '../../../shared/top-navigator/top-navigator.component';

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
  imports: [CommonModule, TopNavigatorComponent],
  templateUrl: './my-garden.component.html',
  styleUrls: ['./my-garden.component.scss']
})
export class MyGardenComponent implements OnInit {
  plants: Plant[] = [];
  apiError = false;
  layout: 'grid' | 'list' = 'grid';
  filter: 'all' | 'indoor' | 'outdoor' = 'all';

  private samplePlants: Plant[] = [
    {
      id: '1',
      name: 'Bonsai Ficus',
      image: '',
      description: 'A classic Ficus bonsai, easy to care for and popular among beginners.',
      tags: ['Ficus', 'Indoor', 'Classic']
    },
    {
      id: '2',
      name: 'Juniper Bonsai',
      image: '',
      description: 'Juniper bonsai with beautiful needle-like foliage',
      tags: ['Juniper', 'Outdoor', 'Evergreen']
    },
    {
      id: '3',
      name: 'Japanese Maple Bonsai',
      image: '',
      description: 'Stunning Japanese Maple bonsai with vibrant red leaves in autumn.',
      tags: ['Maple', 'Seasonal', 'Colorful']
    }
  ];

  get filteredPlants(): Plant[] {
    if (this.filter === 'all') return this.plants;
    if (this.filter === 'indoor') return this.plants.filter(p => p.tags?.map(t => t.toLowerCase()).includes('indoor'));
    if (this.filter === 'outdoor') return this.plants.filter(p => p.tags?.map(t => t.toLowerCase()).includes('outdoor'));
    return this.plants;
  }

  ngOnInit() {
    this.plants = this.samplePlants;
  }
}
