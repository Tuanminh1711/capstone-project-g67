import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { Home } from './main/home/home';
import { PlantInfo } from './main/plant-info/plant-info';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'login', component: Home, data: { showLogin: true } },
  { path: 'register', component: Home, data: { showRegister: true } },
  { path: 'plant-info', component: PlantInfo },
];
