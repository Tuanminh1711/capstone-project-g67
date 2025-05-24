import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resigter',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './resigter.component.html',
  styleUrl: './resigter.component.css'
})
export class ResigterComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  message = '';

  constructor(private http: HttpClient) {}

  onSubmit() {
    const registerData = {
      username: this.username,
      email: this.email,
      password: this.password
    };

    this.http
      .post<any>('http://localhost:8080/api/auth/register', registerData)
      .subscribe({
        next: (res) => {
          this.message = res.message || 'Register successful!';
        },
        error: (err) => {
          this.message = err.error?.message || 'Register failed!';
        },
      });
  }
}
