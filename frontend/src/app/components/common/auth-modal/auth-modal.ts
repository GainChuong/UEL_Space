import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SettingsService } from '../../../services/settings.service';
import { SERVER_IMAGES_LINK } from '../../../services/api-config';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.scss'
})
export class AuthModalComponent implements OnDestroy {
  public settingsService = inject(SettingsService);
  private router = inject(Router);

  server_images_link = SERVER_IMAGES_LINK;

  private onViewOnlyClick = (event: Event): void => {
    if (this.settingsService.isLoggedIn) return;
    if (this.settingsService.isAuthModalOpen) return;
    if (this.router.url.startsWith('/login')) return;

    const target = event.target as HTMLElement | null;
    if (!target || typeof target.closest !== 'function') return;
    if (target.closest('app-auth-modal')) return;
    if (target.closest('[data-viewer-allowed]')) return;

    const interactive = target.closest(
      'button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"], a[href]'
    ) as HTMLElement | null;
    if (!interactive) return;

    if (interactive.tagName.toLowerCase() === 'a') {
      const href = (interactive as HTMLAnchorElement).getAttribute('href') ?? '';
      const targetPath = this.routePathFromHref(href);
      if (targetPath === null) return;
      if (targetPath === '/login' || targetPath === '/about') return;
      this.blockForLogin(event);
      return;
    }

    this.blockForLogin(event);
  };

  private blockForLogin(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.settingsService.promptLogin();
  }

  private routePathFromHref(href: string): string | null {
    let path = (href || '').trim();
    if (!path || path === '#') return null;
    if (path.startsWith('#')) path = path.slice(1);
    const queryIndex = path.indexOf('?');
    if (queryIndex >= 0) path = path.slice(0, queryIndex);
    if (!path.startsWith('/')) return null;
    return path;
  }

  constructor() {
    document.addEventListener('click', this.onViewOnlyClick, true);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onViewOnlyClick, true);
  }

  goToLogin(): void {
    this.settingsService.closeAuthModal();
    this.router.navigate(['/login']);
  }

  close(): void {
    this.settingsService.closeAuthModal();
  }
}