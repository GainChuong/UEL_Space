import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SettingsService } from '../services/settings.service';

export const authGuard: CanActivateFn = () => {
  const settingsService = inject(SettingsService);
  const router = inject(Router);

  if (settingsService.isLoggedIn) {
    return true;
  }

  settingsService.promptLogin();
  return router.createUrlTree(['/about']);
};