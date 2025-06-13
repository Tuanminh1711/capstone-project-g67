import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-popup-holder',
  standalone: true,
  template: `<div style="display: flex; align-items: center; justify-content: center; min-height: 40vh; color: #178a4c; font-size: 1.2rem; font-weight: 600; text-align: center;">
    <span>Đang xử lý xác thực...<br/>Vui lòng chờ hoặc đóng popup để quay lại trang trước.</span>
  </div>`
})
export class AuthPopupHolderComponent {}
