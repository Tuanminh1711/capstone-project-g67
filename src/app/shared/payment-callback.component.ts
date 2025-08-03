import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast/toast.service';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payment-callback-container">
      <div class="callback-content">
        @if (loading) {
          <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Đang xử lý kết quả thanh toán...</p>
          </div>
        }
        
        @if (!loading && success) {
          <div class="success">
            <i class="fas fa-check-circle"></i>
            <h2>Thanh toán thành công!</h2>
            <p>Cảm ơn bạn đã nâng cấp lên VIP. Bạn sẽ được chuyển hướng trong giây lát...</p>
          </div>
        }
        
        @if (!loading && !success) {
          <div class="error">
            <i class="fas fa-times-circle"></i>
            <h2>Thanh toán thất bại</h2>
            <p>{{ errorMessage }}</p>
            <button (click)="router.navigate(['/vip'])" class="retry-btn">
              Thử lại
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .payment-callback-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .callback-content {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 400px;
      width: 90%;
    }
    
    .loading i, .success i, .error i {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    .loading i { color: #007bff; }
    .success i { color: #28a745; }
    .error i { color: #dc3545; }
    
    .retry-btn {
      margin-top: 1rem;
      padding: 0.5rem 1.5rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    
    .retry-btn:hover {
      background: #0056b3;
    }
  `]
})
export class PaymentCallbackComponent implements OnInit {
  loading = true;
  success = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    // Xử lý query parameters từ VNPay callback
    this.route.queryParams.subscribe(params => {
      const responseCode = params['vnp_ResponseCode'];
      const transactionStatus = params['vnp_TransactionStatus'];
      
      setTimeout(() => {
        this.loading = false;
        
        if (responseCode === '00' && transactionStatus === '00') {
          // Thanh toán thành công
          this.success = true;
          this.toastService.success('Thanh toán VIP thành công!');
          
          // Chuyển hướng sau 3 giây
          setTimeout(() => {
            this.router.navigate(['/vip/welcome']);
          }, 3000);
        } else {
          // Thanh toán thất bại
          this.success = false;
          this.errorMessage = this.getErrorMessage(responseCode);
          this.toastService.error('Thanh toán thất bại: ' + this.errorMessage);
        }
      }, 2000);
    });
  }

  private getErrorMessage(code: string): string {
    const errorMap: { [key: string]: string } = {
      '01': 'Giao dịch chưa hoàn tất',
      '02': 'Giao dịch bị lỗi',
      '04': 'Giao dịch đảo (Khách hàng đã bị trừ tiền tại Ngân hàng nhưng GD chưa thành công ở VNPAY)',
      '05': 'VNPAY đang xử lý giao dịch này (GD hoàn tiền)',
      '06': 'VNPAY đã gửi yêu cầu hoàn tiền sang Ngân hàng (GD hoàn tiền)',
      '07': 'Giao dịch bị nghi ngờ gian lận',
      '09': 'GD Hoàn trả bị từ chối',
      '10': 'Đã giao hàng',
      '20': 'Đã thu tiền',
      '21': 'Giao dịch bị hủy',
      '22': 'Giao dịch bị từ chối do thẻ/tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
    };
    
    return errorMap[code] || 'Lỗi không xác định';
  }
}
