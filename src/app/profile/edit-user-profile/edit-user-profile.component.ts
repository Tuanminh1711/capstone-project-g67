import { Component } from '@angular/core';
import { TopNavigatorComponent } from '../../shared/top-navigator/index';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-user-profile',
  standalone: true,
  imports: [TopNavigatorComponent, FormsModule],
  templateUrl: './edit-user-profile.html',
  styleUrl: './edit-user-profile.scss'
})
export class EditUserProfileComponent {
  user = {
    name: '',
    email: '',
    phone: '',
    address: ''
  };
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';

  save() {
    // TODO: Gọi API lưu thông tin user
    console.log('Save user', this.user);
  }

  changePassword() {
    // TODO: Gọi API đổi mật khẩu
    console.log('Change password', this.oldPassword, this.newPassword, this.confirmPassword);
  }
}
