import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-resigter',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './resigter.component.html',
  styleUrl: './resigter.component.css'
})
export class ResigterComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';

      onSubmit() {
        
      }
}
