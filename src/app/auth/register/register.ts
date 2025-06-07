import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  closePopup() {
    // Đóng popup, ví dụ: emit event hoặc điều hướng về trang chính
    window.history.back();
  }
}
