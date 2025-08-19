
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../../shared/services/url.service';
import { ChatService } from '../../../../shared/services/chat.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-expert-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './expert-sidebar.component.html',
  styleUrls: ['./expert-sidebar.component.scss']
})
export class ExpertSidebarComponent implements OnInit {
  isChatDropdownOpen = false;
  recentUsers$ = new BehaviorSubject<{ username: string, userId: number, conversationId?: string }[]>([]);
  currentUserName: string = 'Expert'; // Giá trị mặc định
  fullUserName: string = 'Expert'; // Lưu tên đầy đủ cho tooltip

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private urlService: UrlService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadRecentUsers();
  }

  loadCurrentUser() {
    // Lấy tên người dùng từ AuthService
    const username = this.authService.getCurrentUsername();
    if (username && username.trim()) {
      this.fullUserName = username;
      this.currentUserName = this.formatDisplayName(username);
    } else {
      // Nếu không có username trong AuthService, thử lấy từ API
      this.loadUserProfile();
    }
  }

  formatDisplayName(name: string): string {
    // Cắt tên nếu quá dài (giới hạn 15 ký tự)
    if (name.length > 15) {
      return name.substring(0, 15) + '...';
    }
    return name;
  }

  loadUserProfile() {
    // Gọi API để lấy thông tin profile người dùng
    const apiUrl = `${this.urlService.getApiUrl('experts')}/profile`;
    this.http.get<any>(apiUrl).subscribe({
      next: (profile) => {
        let displayName = 'Expert'; // Fallback mặc định
        
        if (profile && profile.username) {
          displayName = profile.username;
        } else if (profile && profile.fullName) {
          displayName = profile.fullName;
        } else if (profile && profile.name) {
          displayName = profile.name;
        }
        
        this.fullUserName = displayName;
        this.currentUserName = this.formatDisplayName(displayName);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.fullUserName = 'Expert';
        this.currentUserName = 'Expert'; // Giữ giá trị mặc định
      }
    });
  }

  loadRecentUsers() {
    // Lấy danh sách các cuộc trò chuyện giống trang tin nhắn riêng tư
    this.chatService.getConversations().subscribe({
      next: (conversations) => {
        const users = conversations.map(c => ({
          username: c.otherUsername,
          userId: c.otherUserId,
          conversationId: c.conversationId
        }));
        this.recentUsers$.next(users);
        this.cdr.detectChanges();
      },
      error: () => {
        this.recentUsers$.next([]);
        this.cdr.detectChanges();
      }
    });
  }

  toggleChatDropdown() {
    this.isChatDropdownOpen = !this.isChatDropdownOpen;
  }

  navigateToCommunityChat() {
    this.router.navigate(['/expert/chat']);
    // Dropdown luôn mở
  }

  navigateToUserChat(user: any) {
    this.router.navigate(['/expert/private-chat'], { queryParams: { conversationId: user.conversationId } });
    // Dropdown luôn mở
  }

    isChatRoute(): boolean {
    const url = this.router.url;
    return url.startsWith('/expert/chat') || url.startsWith('/expert/private-chat');
  }

  logout() {
    // Sử dụng AuthService logout dành riêng cho expert
    this.authService.logoutExpert();
  }
}
