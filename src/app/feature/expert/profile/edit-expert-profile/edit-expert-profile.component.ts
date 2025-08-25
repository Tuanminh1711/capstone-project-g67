import { Component, OnInit, ChangeDetectorRef, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { ExpertProfileService, ExpertProfile, UpdateExpertProfileRequest } from '../expert-profile.service';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { JwtUserUtilService } from '../../../../auth/jwt-user-util.service';
import { AuthDialogService } from '../../../../auth/auth-dialog.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

// Dịch nhanh các lỗi backend trả về sang tiếng Việt
function translateErrorMessage(message: string): string {
  if (!message) return '';
  const map: { [key: string]: string } = {
    'Living environment cannot be null or empty': 'Vui lòng chọn môi trường sống cho hồ sơ của bạn.',
    'Full name cannot be null or empty': 'Họ tên không được để trống.',
    'Phone number is invalid': 'Số điện thoại không hợp lệ.',
    'Gender is invalid': 'Giới tính không hợp lệ.',
    // Thêm các lỗi khác nếu cần
  };
  for (const key in map) {
    if (message.includes(key)) return map[key];
  }
  return message; // fallback: giữ nguyên nếu không khớp
}

@Component({
  selector: 'app-edit-expert-profile',
  standalone: true,
  imports: [FormsModule, CommonModule, ImageCropperComponent],
  templateUrl: './edit-expert-profile.html',
  styleUrls: ['./edit-expert-profile.scss']
})
export class EditExpertProfileComponent implements OnInit {
  expert: Partial<ExpertProfile> = {};
  avatarPreview: string | null = null;
  selectedAvatarFile: File | null = null;
  loading = true;
  saving = false;
  saveMessage = '';
  saveError = '';
  avatarUploading = false;
  showCropper = false;
  imageChangedEvent: any = '';
  croppedImage: string | null = null;
  showAvatarFormatError = false;
  @ViewChild('imageCropper') imageCropper: any;

  constructor(
    private expertProfileService: ExpertProfileService,
    private jwtUserUtil: JwtUserUtilService,
    private authDialogService: AuthDialogService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.loadExpertProfile();
  }

  loadExpertProfile() {
    this.loading = true;
    this.saveError = '';
    const token = this.jwtUserUtil.getTokenInfo();
    if (!token) {
      this.saveError = 'Vui lòng đăng nhập để chỉnh sửa hồ sơ.';
      this.loading = false;
      return;
    }
    this.expertProfileService.getExpertProfile().subscribe({
      next: (profile) => {
        this.expert = { ...profile };
        this.avatarPreview = profile.avatar;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        if (error.status === 401) {
          this.saveError = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          this.toastService.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          this.showLoginDialog();
        } else if (error.status === 403) {
          this.saveError = 'Không có quyền truy cập thông tin này.';
          this.toastService.error('Không có quyền truy cập thông tin này.');
        } else if (error.status === 404) {
          this.saveError = 'Không tìm thấy thông tin chuyên gia.';
          this.toastService.error('Không tìm thấy thông tin chuyên gia.');
        } else {
          this.saveError = 'Có lỗi xảy ra khi tải thông tin. Vui lòng thử lại.';
          this.toastService.error('Có lỗi xảy ra khi tải thông tin. Vui lòng thử lại.');
        }
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.showAvatarFormatError = false;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const fileName = file.name;
      if (!/^[\w\-. ]{1,100}$/.test(fileName)) {
        this.showAvatarFormatError = true;
        this.toastService.error('Tên file ảnh không hợp lệ hoặc quá dài.');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        this.toastService.error('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 20MB.');
        this.selectedAvatarFile = null;
        this.showAvatarFormatError = true;
        this.cdr.detectChanges();
        return;
      }
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
        this.toastService.error('Định dạng file không hỗ trợ. Vui lòng chọn file JPG, PNG hoặc GIF.');
        this.selectedAvatarFile = null;
        this.showAvatarFormatError = true;
        this.cdr.detectChanges();
        return;
      }
      this.imageChangedEvent = event;
      this.showCropper = true;
      this.croppedImage = null;
      this.selectedAvatarFile = null;
      this.cdr.detectChanges();
    }
  }

  onImageCropped(event: ImageCroppedEvent) {
    if (event.base64) {
      this.croppedImage = event.base64;
      this.avatarPreview = this.croppedImage;
      this.cdr.detectChanges();
    } else if (event.blob) {
      const reader = new FileReader();
      reader.onload = () => {
        this.croppedImage = reader.result as string;
        this.avatarPreview = this.croppedImage;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(event.blob);
    } else {
      this.croppedImage = null;
      this.avatarPreview = null;
      this.cdr.detectChanges();
    }
  }

  confirmCroppedAvatar() {
    if (this.croppedImage) {
      const file = this.dataURLtoFile(this.croppedImage, 'avatar.png');
      this.selectedAvatarFile = file;
      this.avatarPreview = this.croppedImage;
      this.showCropper = false;
      this.cdr.detectChanges();
    }
  }

  cancelCropper() {
    this.showCropper = false;
    this.croppedImage = null;
    this.avatarPreview = this.expert.avatar || null;
    this.selectedAvatarFile = null;
    this.showAvatarFormatError = false;
    this.cdr.detectChanges();
  }

  dataURLtoFile(dataurl: string, filename: string) {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new File([u8arr], filename, { type: mime });
  }

  uploadAvatar() {
    if (!this.selectedAvatarFile) {
      this.toastService.error('Vui lòng chọn ảnh trước khi cập nhật.');
      return;
    }
    this.avatarUploading = true;
    const formData = new FormData();
    formData.append('avatar', this.selectedAvatarFile);
    this.expertProfileService.updateExpertAvatar(formData).subscribe({
      next: (res) => {
        if (res?.data?.avatar) {
          this.expert.avatar = res.data.avatar;
          this.selectedAvatarFile = null;
          this.avatarPreview = null;
        }
        this.toastService.success('Cập nhật ảnh đại diện thành công!');
        this.avatarUploading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/expert/profile/view']);
        }, 1000);
      },
      error: () => {
        this.toastService.error('Có lỗi xảy ra khi cập nhật ảnh đại diện.');
        this.avatarUploading = false;
        this.cdr.markForCheck();
      }
    });
  }

  save() {
    this.saveError = '';
    this.saveMessage = '';
    if (!this.expert.id || !this.expert.fullName || !this.expert.phoneNumber || !this.expert.livingEnvironment) {
      this.saveError = 'Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Số điện thoại, Môi trường sống)';
      this.toastService.error(this.saveError);
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      return;
    }
    if (typeof this.expert.fullName === 'string' && this.expert.fullName.trim().length < 2) {
      this.saveError = 'Họ tên phải có ít nhất 2 ký tự';
      this.toastService.error(this.saveError);
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      return;
    }
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(this.expert.phoneNumber.trim())) {
      this.saveError = 'Số điện thoại không hợp lệ (10-11 chữ số)';
      this.toastService.error(this.saveError);
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      return;
    }
    // Kiểm tra livingEnvironment không được để trống
    if (!this.expert.livingEnvironment.trim()) {
      this.saveError = 'Vui lòng nhập môi trường sống';
      this.toastService.error(this.saveError);
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      return;
    }
    const validGenders = ['MALE', 'FEMALE', 'OTHER'];
    let gender = this.expert.gender;
    if (!gender || !validGenders.includes(gender)) {
      gender = 'MALE';
    }
    this.saving = true;
    const updateData: UpdateExpertProfileRequest = {
      id: this.expert.id,
      fullName: this.expert.fullName.trim(),
      phoneNumber: this.expert.phoneNumber.trim(),
      avatar: this.expert.avatar || '',
      gender: gender,
      livingEnvironment: this.expert.livingEnvironment.trim()
    };
    this.expertProfileService.updateExpertProfile(updateData).pipe(
      tap(response => {
        if (response && (response.status === 200 || response.data)) {
          if (response.data) {
            this.expert = { ...this.expert, ...response.data };
            this.avatarPreview = response.data.avatar;
          }
          this.saveMessage = 'Cập nhật thông tin thành công!';
          this.toastService.success('Cập nhật thông tin thành công!');
          this.cdr.detectChanges();
          setTimeout(() => {
            this.router.navigate(['/expert/profile/view']);
          }, 1000);
        }
        this.cdr.markForCheck();
      }),
      catchError(error => {
        let errorMessage = '';
        if (error.status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          this.showLoginDialog();
        } else if (error.status === 403) {
          errorMessage = 'Không có quyền cập nhật thông tin này.';
        } else if (error.status === 404) {
          errorMessage = error.error?.message || 'Không tìm thấy chuyên gia.';
        } else if (error.status === 400) {
          errorMessage = translateErrorMessage(error.error?.message || 'Dữ liệu không hợp lệ.');
        } else if (error.status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
        } else if (error.error?.message) {
          errorMessage = translateErrorMessage(error.error.message);
        } else {
          errorMessage = 'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.';
        }
        this.saveError = errorMessage;
        this.toastService.error(errorMessage);
        this.cdr.markForCheck();
        return of(null);
      }),
      finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      })
    ).subscribe();
  }

  showLoginDialog() {
    this.authDialogService.openLoginDialog();
  }
}
