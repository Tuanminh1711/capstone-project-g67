import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  closePopup() {
    // Đóng popup, ví dụ: emit event hoặc điều hướng về trang chính
    window.history.back();
  }
}
