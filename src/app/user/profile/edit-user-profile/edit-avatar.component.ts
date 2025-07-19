import { Component, ChangeDetectorRef, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-edit-avatar',
  templateUrl: './edit-avatar.component.html',
  styleUrls: ['./edit-avatar.component.scss']
})
export class EditAvatarComponent {
  @Input() userId: number | undefined;
  @Input() avatar: string | null = null;
  avatarPreview: string | null = null;
  selectedAvatarFile: File | null = null;
  avatarUploading = false;

  constructor(
    private http: HttpClient,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
        this.selectedAvatarFile = null;
        return;
      }
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
        this.toastService.error('Định dạng file không hỗ trợ. Vui lòng chọn file JPG, PNG hoặc GIF.');
        this.selectedAvatarFile = null;
        return;
      }
      this.selectedAvatarFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreview = e.target.result;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  uploadAvatar() {
    if (!this.selectedAvatarFile || !this.userId) {
      this.toastService.error('Vui lòng chọn ảnh và đảm bảo đã đăng nhập.');
      return;
    }
    this.avatarUploading = true;
    const formData = new FormData();
    formData.append('avatar', this.selectedAvatarFile);
    this.http.post(`/api/user/update-avatar`, formData, { withCredentials: true }).subscribe({
      next: () => {
        this.toastService.success('Cập nhật ảnh đại diện thành công!');
        this.avatarUploading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        let errorMessage = 'Có lỗi xảy ra khi cập nhật ảnh đại diện.';
        if (error.status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (error.status === 403) {
          errorMessage = 'Không có quyền cập nhật ảnh đại diện.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        this.toastService.error(errorMessage);
        this.avatarUploading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
