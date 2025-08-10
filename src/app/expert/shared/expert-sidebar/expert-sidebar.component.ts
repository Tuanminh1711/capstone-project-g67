
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../shared/url.service';
import { ChatService } from '../../../shared/services/chat.service';

@Component({
  selector: 'app-expert-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './expert-sidebar.component.html',
  styleUrls: ['./expert-sidebar.component.scss']
})
export class ExpertSidebarComponent implements OnInit {
  isChatDropdownOpen = false;
  recentUsers: { username: string, userId: number, conversationId?: string }[] = [];

  constructor(
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
        this.recentUsers = conversations.map(c => ({
          username: c.otherUsername,
          userId: c.otherUserId,
          conversationId: c.conversationId
        }));
      },
      error: () => {
        this.recentUsers = [];
      }
    });
  }

  toggleChatDropdown() {
    this.isChatDropdownOpen = true;
  }

  navigateToCommunityChat() {
    this.router.navigate(['/expert/chat']);
    // Dropdown luôn mở
  }

  navigateToUserChat(user: any) {
    this.router.navigate(['/expert/private-chat'], { queryParams: { conversationId: user.conversationId } });
    // Dropdown luôn mở
  }
}
