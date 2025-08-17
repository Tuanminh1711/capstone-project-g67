import { Component, inject, ViewChild, AfterViewInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthDialogService } from './auth/auth-dialog.service';
import { FooterComponent } from './shared/footer/footer.component';
import { ToastComponent } from './shared/toast/toast.component';
import { filter } from 'rxjs';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog/confirmation-dialog.component';
import { ChatAiFabComponent } from './feature/user/chat-ai/chat-ai-fab.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, 
    FooterComponent, 
    ToastComponent, 
    ConfirmationDialogComponent,
    ChatAiFabComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'fe_code';

  private router = inject(Router);
  private authDialog = inject(AuthDialogService);

  isAdminPage(): boolean {
    // Kiểm tra url có chứa '/admin', '/expert', hoặc '/login-admin' không
    const url = this.router.url;
    return url.startsWith('/admin') || 
           url.startsWith('/expert') || 
           url.startsWith('/login-admin');
  }

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      let route = this.router.routerState.root;
      while (route.firstChild) route = route.firstChild;
      const data = route.snapshot.data;
      if (data['showLogin']) {
        this.authDialog.openLoginDialog();
      } else if (data['showRegister']) {
        this.authDialog.openRegisterDialog();
      }
    });
  }
}
