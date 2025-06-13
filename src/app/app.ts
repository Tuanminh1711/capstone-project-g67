import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthDialogService } from './auth/auth-dialog.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'fe_code';

  private router = inject(Router);
  private authDialog = inject(AuthDialogService);

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
