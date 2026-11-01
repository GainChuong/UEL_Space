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
  { 
    path: '', 
    component: Home, 
    title: 'UEL Space | Nền tảng Đặt & Quản trị Không gian Thông minh', 
    canActivate: [authGuard] 
  },
  { 
    path: 'calendar-callback', 
    component: CalendarCallbackComponent, 
    title: 'Đồng bộ Google Calendar | UEL Space' 
  },
  { 
    path: 'map', 
    component: Map, 
    title: 'Bản đồ Không gian Học tập & Làm việc | UEL Space', 
    canActivate: [authGuard] 
  },
  { 
    path: 'spaces/:id', 
    component: SpaceDetailComponent, 
    title: 'Chi tiết Không gian | UEL Space', 
    canActivate: [authGuard] 
  },
  { 
    path: 'sellers/:id', 
    component: SellerDetailComponent, 
    title: 'Hồ sơ Đối tác Không gian | UEL Space', 
    canActivate: [authGuard] 
  },
  { 
    path: 'seller/:id', 
    redirectTo: 'sellers/:id' 
  },
  { 
    path: 'booking', 
    component: BookingHistory, 
    title: 'Lịch sử Đặt chỗ & Quản lý | UEL Space', 
    canActivate: [authGuard] 
  },
  { 
    path: 'about', 
    component: About, 
    title: 'Về Chúng Tôi & Giải pháp Chuyển đổi số | UEL Space' 
  },
  { 
    path: 'login', 
    component: Login, 
    title: 'Đăng nhập & Xác thực Hệ thống | UEL Space' 
  },
  { 
    path: 'admin', 
    component: Admin, 
    title: 'Quản trị Sàn UEL Space | Platform Super Admin', 
    canActivate: [authGuard] 
  },
  { 
    path: 'seller-dashboard', 
    component: SellerDashboard, 
    title: 'Kênh Quản lý Đối tác & Kiosk Tiếp tân | UEL Space', 
    canActivate: [authGuard] 
  },
  { 
    path: 'seller-portal', 
    redirectTo: 'seller-dashboard' 
  },
  { 
    path: '**', 
    redirectTo: '' 
  }
];
