import { Component } from '@angular/core';
import { TopNavigator } from '../../shared/top-navigator/top-navigator';

@Component({
  selector: 'app-plant-info',
  standalone: true,
  imports: [TopNavigator],
  templateUrl: './plant-info.html',
  styleUrl: './plant-info.css'
})
export class PlantInfo {}
