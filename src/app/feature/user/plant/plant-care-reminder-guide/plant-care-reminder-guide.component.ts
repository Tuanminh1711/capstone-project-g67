import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TopNavigatorComponent } from '../../../../shared/top-navigator/top-navigator.component';

@Component({
  selector: 'app-plant-care-reminder-guide',
  standalone: true,
  imports: [TopNavigatorComponent],
  templateUrl: './plant-care-reminder-guide.component.html',
  styleUrls: ['./plant-care-reminder-guide.component.scss']
})
export class PlantCareReminderGuideComponent {
  constructor(private router: Router) {}

  goToGarden() {
    this.router.navigate(['/user/my-garden']);
  }
}
