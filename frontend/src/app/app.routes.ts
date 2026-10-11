import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Map } from './components/map/map';
import { BookingHistory } from './components/booking-history/booking-history';
import { Login } from './components/login/login';
import { About } from './components/about/about';
import { Admin } from './components/admin/admin';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Home, canActivate: [authGuard] },
  { path: 'map', component: Map, canActivate: [authGuard] },
  { path: 'booking', component: BookingHistory, canActivate: [authGuard] },
  { path: 'about', component: About },
  { path: 'login', component: Login },
  { path: 'admin', component: Admin, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];