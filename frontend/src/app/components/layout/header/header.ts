import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SERVER_IMAGES_LINK } from '../../../services/api-config';
import { SettingsService } from '../../../services/settings.service';
import { TranslatePipe } from '../../../services/translate.pipe';
import { SettingsModalComponent } from '../../common/settings-modal/settings-modal';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe, SettingsModalComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  public settingsService = inject(SettingsService);
  private router = inject(Router);

  server_images_link = SERVER_IMAGES_LINK;

  // Dropdown states
  isNotificationOpen = false;
  isProfileOpen = false;
  activeNotifTab: 'all' | 'unread' | 'guide' = 'all';

  // Toggle notification popover
  toggleNotification(event: Event): void {
    event.stopPropagation();
    this.isNotificationOpen = !this.isNotificationOpen;
    this.isProfileOpen = false;
  }

  // Toggle profile popover
  toggleProfile(event: Event): void {
    event.stopPropagation();
    this.isProfileOpen = !this.isProfileOpen;
    this.isNotificationOpen = false;
  }

  // Open settings modal from profile menu
  openSettings(): void {
    this.isProfileOpen = false;
    this.settingsService.openSettings();
  }

  // Handle Logout
  handleLogout(): void {
    this.isProfileOpen = false;
    this.settingsService.logout();
  }

  // Handle Login button click
  handleLogin(): void {
    this.isProfileOpen = false;
    this.router.navigate(['/login']);
  }

  // Notification actions
  markAsRead(id: string, event: Event, link?: string): void {
    event.stopPropagation();
    this.settingsService.markAsRead(id);
    if (link) {
      this.isNotificationOpen = false;
      this.router.navigateByUrl(link);
    }
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.settingsService.markAllAsRead();
  }

  // Close dropdowns on outside click
  @HostListener('document:click')
  onDocumentClick(): void {
    this.isNotificationOpen = false;
    this.isProfileOpen = false;
  }
}
