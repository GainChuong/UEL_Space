import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GoogleCalendarService } from '../../services/google-calendar.service';

@Component({
  selector: 'app-calendar-callback',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './calendar-callback.html'
})
export class CalendarCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private calendarService = inject(GoogleCalendarService);

  isProcessing: boolean = true;
  isSuccess: boolean = false;
  errorMessage: string = '';
  connectedEmail: string = '';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        this.isProcessing = false;
        this.errorMessage = `Google từ chối ủy quyền: ${error}`;
        return;
      }

      if (!code) {
        this.isProcessing = false;
        this.errorMessage = 'Không tìm thấy mã xác thực Google (authorization code) trong URL.';
        return;
      }

      const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/calendar-callback` : undefined;

      this.calendarService.exchangeCode(code, redirectUri).subscribe({
        next: (res) => {
          this.isProcessing = false;
          this.isSuccess = true;
          this.connectedEmail = res?.email || '';

          // Gửi thông điệp về cửa sổ cha nếu mở qua popup
          if (typeof window !== 'undefined' && window.opener) {
            try {
              window.opener.postMessage({
                type: 'GOOGLE_CALENDAR_CONNECTED',
                success: true,
                email: this.connectedEmail
              }, '*');
            } catch (e) {
              console.warn('Cannot postMessage to opener:', e);
            }
            setTimeout(() => {
              window.close();
            }, 1200);
          } else {
            // Nếu mở toàn trang, tự chuyển hướng sau 1.5s
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 1500);
          }
        },
        error: (err) => {
          this.isProcessing = false;
          this.errorMessage = err?.error?.message || err?.message || 'Không thể trao đổi mã xác thực với máy chủ UEL Space.';
        }
      });
    });
  }

  closeWindow(): void {
    if (typeof window !== 'undefined') {
      window.close();
    }
  }
}
