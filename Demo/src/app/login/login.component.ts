import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
   standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})


export class LoginComponent {
username: string = '';
  password: string = '';
   errorMessage = '';

    constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        if(response.status === 202 ) {
          this.router.navigate(['/home'])
        } else {
          this.errorMessage = 'Invalid username or password'
        }
      },
      error: (error) => {
        this.errorMessage = 'login failed, please try again';
        console.error('Login error:', error);
      }
    });
  }
}
