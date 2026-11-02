import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SettingsService } from '../services/settings.service';

export const sellerGuard: CanActivateFn = () => {
  const settingsService = inject(SettingsService);
  const router = inject(Router);

  const role = settingsService.currentUser?.role;
  if (settingsService.isLoggedIn && (role === 'SELLER' || role === 'ADMIN')) {
    return true;
  }

  // Not authenticated or not SELLER/ADMIN
  settingsService.promptLogin('Khu vực dành riêng cho Đối tác sở hữu Không gian (Host). Vui lòng đăng nhập đúng tài khoản Chủ không gian!');
  return router.createUrlTree(['/login']);
};

