import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../shared/url.service';
import { ChatService } from '../../../shared/services/chat.service';
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

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private urlService: UrlService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.loadRecentUsers();
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

  logout() {
    // Sử dụng AuthService logout dành riêng cho expert
    this.authService.logoutExpert();
  }
}
