import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../../services/settings.service';
import { TranslatePipe } from '../../../services/translate.pipe';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './settings-modal.html',
  styleUrl: './settings-modal.scss'
})
export class SettingsModalComponent {
  public settingsService = inject(SettingsService);

  feedbackMessage: string = '';
  feedbackType: 'success' | 'warning' | 'info' = 'info';

  async handleToggleDesktopNotif(): Promise<void> {
    const res = await this.settingsService.toggleDesktopNotifications();
    this.showFeedback(res.message, res.success ? 'success' : 'warning');
  }

  handleTestNotification(): void {
    const lang = this.settingsService.currentLanguage;
    const title = lang === 'vi' ? 'UEL SPACE - Thông báo thử nghiệm' : 'UEL SPACE - Test Notification';
    const body = lang === 'vi' 
      ? 'Hệ thống thông báo đẩy Desktop đang hoạt động hoàn hảo!'
      : 'Desktop Push Notification is working perfectly!';
    this.settingsService.sendDesktopNotification(title, body);
    this.showFeedback(lang === 'vi' ? 'Đã gửi thông báo thử nghiệm ra màn hình!' : 'Sent test notification to desktop!', 'success');
  }

  showFeedback(msg: string, type: 'success' | 'warning' | 'info'): void {
    this.feedbackMessage = msg;
    this.feedbackType = type;
    setTimeout(() => {
      this.feedbackMessage = '';
    }, 4000);
  }

  close(): void {
    this.settingsService.closeSettings();
  }
}
