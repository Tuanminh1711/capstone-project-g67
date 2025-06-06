import { Component } from '@angular/core';
import { TopNavigator } from '../../shared/top-navigator/top-navigator';
import { Login } from '../../auth/login/login';
import { Register } from '../../auth/register/register';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [TopNavigator, Login, Register, NgIf],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  showLogin = false;
  showRegister = false;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.data.subscribe(data => {
      this.showLogin = !!data['showLogin'];
      this.showRegister = !!data['showRegister'];
    });
  }

  closePopup() {
    this.router.navigate(['/home']);
  }
}
