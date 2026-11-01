import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Map } from './components/map/map';
import { BookingHistory } from './components/booking-history/booking-history';
import { Login } from './components/login/login';
import { About } from './components/about/about';
import { Admin } from './components/admin/admin';
import { SellerDashboard } from './components/seller-dashboard/seller-dashboard';
import { SpaceDetailComponent } from './components/space-detail/space-detail';
import { SellerDetailComponent } from './components/seller-detail/seller-detail';
import { CalendarCallbackComponent } from './components/calendar-callback/calendar-callback';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Home, canActivate: [authGuard] },
  { path: 'calendar-callback', component: CalendarCallbackComponent },
  { path: 'map', component: Map, canActivate: [authGuard] },
  { path: 'spaces/:id', component: SpaceDetailComponent, canActivate: [authGuard] },
  { path: 'sellers/:id', component: SellerDetailComponent, canActivate: [authGuard] },
  { path: 'seller/:id', redirectTo: 'sellers/:id' },
  { path: 'booking', component: BookingHistory, canActivate: [authGuard] },
  { path: 'about', component: About },
  { path: 'login', component: Login },
  { path: 'admin', component: Admin, canActivate: [authGuard] },
  { path: 'seller-dashboard', component: SellerDashboard, canActivate: [authGuard] },
  { path: 'seller-portal', redirectTo: 'seller-dashboard' },
  { path: '**', redirectTo: '' }
];