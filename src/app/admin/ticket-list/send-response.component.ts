import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminTopNavigatorComponent } from '../../shared/admin-top-navigator/admin-top-navigator.component';
import { AdminSidebarComponent } from '../../shared/admin-sidebar/admin-sidebar.component';
import { AdminFooterComponent } from '../../shared/admin-footer/admin-footer.component';

export interface TicketInfo {
  id: number;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdBy: string;
  createdAt: string;
}

export interface ResponseTemplate {
  id: number;
  name: string;
  content: string;
  category: string;
}

@Component({
  selector: 'app-send-response',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminTopNavigatorComponent, AdminSidebarComponent, AdminFooterComponent],
  templateUrl: './send-response.component.html',
  styleUrls: ['./send-response.component.scss']
})
export class SendResponseComponent implements OnInit {
  ticket: TicketInfo | null = null;
  loading = false;
  errorMsg = '';
  successMsg = '';
  ticketId: number = 0;
  
  // Form data
  responseContent: string = '';
  responseType: 'public' | 'internal' = 'public';
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  attachments: File[] = [];
  selectedTemplate: number = 0;
  
  // Response templates
  responseTemplates: ResponseTemplate[] = [
    {
      id: 1,
      name: 'Chào hỏi và xác nhận',
      content: 'Xin chào! Cảm ơn bạn đã liên hệ với chúng tôi. Tôi hiểu vấn đề bạn đang gặp phải và sẽ hỗ trợ bạn giải quyết.',
      category: 'general'
    },
    {
      id: 2,
      name: 'Yêu cầu thông tin thêm',
      content: 'Để có thể hỗ trợ bạn tốt hơn, bạn có thể cung cấp thêm thông tin về:\n- Trình duyệt và hệ điều hành đang sử dụng\n- Thời gian xảy ra vấn đề\n- Screenshot lỗi (nếu có)',
      category: 'technical'
    },
    {
      id: 3,
      name: 'Hướng dẫn giải quyết',
      content: 'Dựa trên mô tả của bạn, đây là các bước để giải quyết vấn đề:\n\n1. Bước 1: ...\n2. Bước 2: ...\n3. Bước 3: ...\n\nNếu vấn đề vẫn tiếp tục, vui lòng cho tôi biết.',
      category: 'solution'
    },
    {
      id: 4,
      name: 'Thông báo đã giải quyết',
      content: 'Vấn đề của bạn đã được giải quyết. Bạn có thể thử lại và cho tôi biết nếu còn gặp vấn đề gì khác.',
      category: 'resolution'
    },
    {
      id: 5,
      name: 'Chuyển tiếp cho team khác',
      content: 'Vấn đề này cần được xử lý bởi team chuyên môn. Tôi đã chuyển tiếp ticket này và sẽ cập nhật thông tin cho bạn sớm nhất.',
      category: 'escalation'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loading = true;
    this.ticketId = Number(this.route.snapshot.paramMap.get('id'));
    
    // TODO: Replace with real API call
    setTimeout(() => {
      // Mock data for demonstration
      this.ticket = {
        id: this.ticketId,
        title: 'Không thể đăng nhập vào tài khoản',
        status: 'open',
        priority: 'high',
        category: 'Technical Support',
        createdBy: 'user123',
        createdAt: '2024-01-15 10:30:00'
      };
      this.loading = false;
    }, 500);
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'open': return 'status-open';
      case 'in_progress': return 'status-in-progress';
      case 'resolved': return 'status-resolved';
      case 'closed': return 'status-closed';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'open': return 'Mở';
      case 'in_progress': return 'Đang xử lý';
      case 'resolved': return 'Đã giải quyết';
      case 'closed': return 'Đã đóng';
      default: return status;
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'low': return 'priority-low';
      case 'medium': return 'priority-medium';
      case 'high': return 'priority-high';
      case 'urgent': return 'priority-urgent';
      default: return '';
    }
  }

  getPriorityText(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'low': return 'Thấp';
      case 'medium': return 'Trung bình';
      case 'high': return 'Cao';
      case 'urgent': return 'Khẩn cấp';
      default: return priority;
    }
  }

  getCategoryText(category: string): string {
    switch (category) {
      case 'Technical Support': return 'Hỗ trợ kỹ thuật';
      case 'Feature Request': return 'Yêu cầu tính năng';
      case 'Bug Report': return 'Báo lỗi';
      case 'Payment Support': return 'Hỗ trợ thanh toán';
      default: return category;
    }
  }

  onTemplateChange() {
    if (this.selectedTemplate > 0) {
      const template = this.responseTemplates.find(t => t.id === this.selectedTemplate);
      if (template) {
        this.responseContent = template.content;
      }
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.attachments.push(files[i]);
      }
    }
  }

  removeAttachment(index: number) {
    this.attachments.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  validateForm(): boolean {
    if (!this.responseContent.trim()) {
      this.errorMsg = 'Vui lòng nhập nội dung phản hồi.';
      setTimeout(() => this.errorMsg = '', 3000);
      return false;
    }

    if (this.responseContent.length < 10) {
      this.errorMsg = 'Nội dung phản hồi phải có ít nhất 10 ký tự.';
      setTimeout(() => this.errorMsg = '', 3000);
      return false;
    }

    return true;
  }

  sendResponse() {
    if (!this.validateForm()) return;

    this.loading = true;
    
    // TODO: Call API to send response
    setTimeout(() => {
      this.loading = false;
      this.successMsg = 'Phản hồi đã được gửi thành công!';
      
      // Reset form
      this.responseContent = '';
      this.responseType = 'public';
      this.priority = 'medium';
      this.attachments = [];
      this.selectedTemplate = 0;
      
      setTimeout(() => {
        this.successMsg = '';
        // Navigate back to ticket detail
        this.router.navigate(['/admin/tickets', this.ticketId]);
      }, 2000);
    }, 1000);
  }

  saveAsDraft() {
    if (!this.responseContent.trim()) {
      this.errorMsg = 'Vui lòng nhập nội dung để lưu nháp.';
      setTimeout(() => this.errorMsg = '', 3000);
      return;
    }

    // TODO: Call API to save draft
    this.successMsg = 'Đã lưu nháp thành công!';
    setTimeout(() => this.successMsg = '', 3000);
  }

  goBack() {
    this.router.navigate(['/admin/tickets', this.ticketId]);
  }

  goToList() {
    this.router.navigate(['/admin/tickets']);
  }
} 