import { Component } from '@angular/core';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';

@Component({
  selector: 'app-plant-info',
  standalone: true,
  imports: [TopNavigatorComponent],
  templateUrl: './plant-info.html',
  styleUrl: './plant-info.scss'
})
export class PlantInfoComponent {}
