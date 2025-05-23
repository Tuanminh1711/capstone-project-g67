import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomePageComponent } from './home-page/home-page.component';
import { ResigterComponent } from './resigter/resigter.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'home', component: HomePageComponent },
    { path: 'register', component: ResigterComponent },
    { path: '', redirectTo: '/login', pathMatch: 'full' }
];
