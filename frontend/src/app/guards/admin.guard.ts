import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SettingsService } from '../services/settings.service';

export const adminGuard: CanActivateFn = () => {
  const settingsService = inject(SettingsService);
  const router = inject(Router);

  if (settingsService.isLoggedIn && settingsService.currentUser?.role === 'ADMIN') {
    return true;
  }

  // Not authenticated or not ADMIN
  settingsService.promptLogin('Khu vực dành riêng cho Quản trị viên Sàn UEL Space. Vui lòng đăng nhập đúng tài khoản Admin!');
  return router.createUrlTree(['/login']);
};

