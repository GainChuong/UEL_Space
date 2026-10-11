import { Component, OnInit, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AUTH_GOOGLE_URL, GOOGLE_CLIENT_ID, SERVER_IMAGES_LINK } from '../../services/api-config';
import { SettingsService, UserProfile } from '../../services/settings.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit, OnDestroy, AfterViewInit {
  server_images_link = SERVER_IMAGES_LINK;

  // Carousel Images
  carouselImages: string[] = [
    SERVER_IMAGES_LINK + 'login/carousel_1.jpg',
    SERVER_IMAGES_LINK + 'login/carousel_2.jpg'
  ];
  currentImageIndex: number = 0;
  private autoSlideInterval: any;

  // Form State
  portalRole: 'student' | 'lecturer' = 'student';
  username: string = 'giangnntk24411@st.uel.edu.vn';
  password: string = '••••••••••••';
  rememberMe: boolean = true;
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Google OAuth Configuration
  googleClientId: string = GOOGLE_CLIENT_ID;
  showClientIdModal: boolean = false;
  customClientIdInput: string = '';
  showDevTestModal: boolean = false;
  testCustomEmail: string = '';

  private settingsService = inject(SettingsService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private i18n = inject(I18nService);

  ngOnInit(): void {
    this.startCarousel();
    if (typeof window !== 'undefined') {
      const savedClientId = localStorage.getItem('uel_google_client_id');
      if (savedClientId) {
        this.googleClientId = savedClientId;
      }
      this.customClientIdInput = this.googleClientId;
    }
  }

  ngAfterViewInit(): void {
    this.initGoogleIdentityServices();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  // --- Google Identity Services (GSI) ---
  private initGoogleIdentityServices(): void {
    if (typeof window === 'undefined') return;

    // Chờ script Google tải hoàn tất
    const checkGoogleInterval = setInterval(() => {
      const google = (window as any).google;
      if (google && google.accounts && google.accounts.id) {
        clearInterval(checkGoogleInterval);
        try {
          google.accounts.id.initialize({
            client_id: this.googleClientId,
            callback: (res: any) => this.handleGoogleCredentialResponse(res),
            auto_select: false,
            cancel_on_tap_outside: true
          });

          const btnContainer = document.getElementById('googleSignInBtnContainer');
          if (btnContainer) {
            google.accounts.id.renderButton(btnContainer, {
              theme: 'outline',
              size: 'large',
              width: 360,
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            });
          }
        } catch (e) {
          console.warn('GSI init note:', e);
        }
      }
    }, 300);

    // Timeout dừng check sau 10s
    setTimeout(() => clearInterval(checkGoogleInterval), 10000);
  }

  // Kích hoạt Đăng nhập Google thực tế từ nút đồng nhất
  triggerGoogleLogin(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const google = (window as any).google;

    // 1. Thử dùng Google OAuth 2.0 Token Client (Chuẩn của Google cho Custom Button)
    if (google && google.accounts && google.accounts.oauth2) {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: this.googleClientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
          callback: (response: any) => {
            if (response.error !== undefined) {
              if (response.error !== 'access_denied') {
                this.errorMessage = this.i18n.t('Đăng nhập Google bị gián đoạn:') + ' ' + (response.error_description || response.error);
              }
              return;
            }
            if (response.access_token) {
              this.authenticateWithGoogleAccessToken(response.access_token);
            }
          }
        });
        client.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('OAuth2 token client error:', err);
      }
    }

    // 2. Fallback sang Google One-Tap / GSI Prompt nếu có
    if (google && google.accounts && google.accounts.id) {
      google.accounts.id.prompt();
    } else {
      this.errorMessage = this.i18n.t('Thư viện Google đang được khởi tạo, vui lòng bấm lại sau giây lát!');
    }
  }

  // Helper giải mã Payload từ Google ID Token (JWT)
  private decodeJwtPayload(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  // Tạo Profile người dùng UEL chuẩn khi Backend Cloud offline
  private createSmartFallbackUser(email: string, name?: string, picture?: string): UserProfile | null {
    const cleanEmail = (email || '').trim().toLowerCase();
    const isLecturer = cleanEmail.endsWith('@uel.edu.vn');
    const isStudent = cleanEmail.endsWith('@st.uel.edu.vn');

    if (!isLecturer && !isStudent) {
      return null;
    }

    const isAdmin = cleanEmail.startsWith('admin') || cleanEmail.includes('admin@uel.edu.vn') || cleanEmail.includes('quantri@uel.edu.vn');
    const role: 'ADMIN' | 'LECTURER' | 'STUDENT' = isAdmin ? 'ADMIN' : (isLecturer ? 'LECTURER' : 'STUDENT');
    const organization = isAdmin 
      ? 'Ban Quản trị Cơ sở vật chất UEL' 
      : (isLecturer ? 'Giảng viên - Trường ĐH Kinh tế - Luật' : 'Sinh viên UEL');

    return {
      id: cleanEmail.split('@')[0].toUpperCase(),
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: role,
      organization: organization,
      avatar: picture || ''
    };
  }

  // Xác thực Access Token từ Google với Backend
  authenticateWithGoogleAccessToken(accessToken: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.post<any>(AUTH_GOOGLE_URL, { accessToken }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.user) {
          this.handleAuthSuccess(res.user);
        } else {
          this.errorMessage = res.error || this.i18n.t('Đăng nhập không thành công.');
        }
      },
      error: (err) => {
        // Fallback: Khi Backend Cloud chưa online hoặc mạng offline, lấy profile từ Google API
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
          .then((r) => r.json())
          .then((googleUser) => {
            this.isLoading = false;
            const fallbackUser = this.createSmartFallbackUser(googleUser.email, googleUser.name, googleUser.picture);
            if (fallbackUser) {
              this.handleAuthSuccess(fallbackUser);
            } else {
              this.errorMessage = this.i18n.t(
                `Tài khoản (${googleUser.email}) bị từ chối! Hệ thống chỉ chấp nhận tài khoản Google thuộc Trường ĐH Kinh tế - Luật (@uel.edu.vn hoặc @st.uel.edu.vn).`
              );
            }
          })
          .catch(() => {
            this.isLoading = false;
            this.errorMessage = err.error?.error || this.i18n.t('Tài khoản bị từ chối! Hệ thống chỉ chấp nhận tài khoản Google thuộc Trường ĐH Kinh tế - Luật (@uel.edu.vn hoặc @st.uel.edu.vn).');
          });
      }
    });
  }

  // Xử lý phản hồi Token ID từ Google Pop-up
  handleGoogleCredentialResponse(response: any): void {
    if (!response || !response.credential) {
      this.errorMessage = this.i18n.t('Không nhận được mã xác thực từ Google. Vui lòng thử lại!');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Gửi token xác thực lên Express Backend
    this.http.post<any>(AUTH_GOOGLE_URL, { idToken: response.credential }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.user) {
          this.handleAuthSuccess(res.user);
        } else {
          this.errorMessage = res.error || this.i18n.t('Đăng nhập không thành công.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        // Smart Fallback: Giải mã Token Google trực tiếp
        const payload = this.decodeJwtPayload(response.credential);
        if (payload && payload.email) {
          const fallbackUser = this.createSmartFallbackUser(payload.email, payload.name, payload.picture);
          if (fallbackUser) {
            this.handleAuthSuccess(fallbackUser);
            return;
          } else {
            this.errorMessage = this.i18n.t(
              `Tài khoản (${payload.email}) bị từ chối! Hệ thống chỉ chấp nhận tài khoản Google thuộc Trường ĐH Kinh tế - Luật (@uel.edu.vn hoặc @st.uel.edu.vn).`
            );
            return;
          }
        }
        this.errorMessage = err.error?.error || this.i18n.t('Đăng nhập thất bại: Tài khoản không thỏa điều kiện của Trường ĐH Kinh tế - Luật!');
      }
    });
  }

  // Kiểm thử gửi qua Backend (Chế độ Test Server)
  authenticateViaServer(email: string, name: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.showDevTestModal = false;

    this.http.post<any>(AUTH_GOOGLE_URL, {
      isDevMock: true,
      email: email,
      name: name
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.user) {
          this.handleAuthSuccess(res.user);
        } else {
          this.errorMessage = res.error || this.i18n.t('Đăng nhập thất bại!');
        }
      },
      error: (err) => {
        this.isLoading = false;
        const fallback = this.createSmartFallbackUser(email, name);
        if (fallback) {
          this.handleAuthSuccess(fallback);
        } else {
          this.errorMessage = err.error?.error || this.i18n.t('Đăng nhập bị từ chối! Email không thuộc Trường ĐH Kinh tế - Luật.');
        }
      }
    });
  }

  // Xử lý sau khi Backend xác nhận hợp lệ
  private handleAuthSuccess(user: UserProfile): void {
    this.successMessage = this.i18n.t('Xin chào') + ' ' + user.name + '! ' + this.i18n.t('Đang chuyển hướng...');
    this.settingsService.login(user);

    setTimeout(() => {
      if (user.role === 'ADMIN') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/']);
      }
    }, 700);
  }

  // Đổi / Lưu Google Client ID
  saveCustomClientId(): void {
    if (this.customClientIdInput.trim()) {
      this.googleClientId = this.customClientIdInput.trim();
      if (typeof window !== 'undefined') {
        localStorage.setItem('uel_google_client_id', this.googleClientId);
      }
      this.showClientIdModal = false;
      this.initGoogleIdentityServices();
      alert(this.i18n.t('Đã cập nhật Google Client ID thành công!'));
    }
  }

  // Submit Form Truyền thống
  handleLogin(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    let enteredEmail = this.username.trim().toLowerCase();
    if (!enteredEmail.includes('@')) {
      enteredEmail += this.portalRole === 'lecturer' ? '@uel.edu.vn' : '@st.uel.edu.vn';
    }

    const displayName = enteredEmail.includes('admin') ? 'Quản trị viên UEL' : (this.portalRole === 'lecturer' ? 'ThS. Giảng viên UEL' : 'Sinh viên UEL');

    // Gửi xác thực qua backend
    this.http.post<any>(AUTH_GOOGLE_URL, {
      isDevMock: true,
      email: enteredEmail,
      name: displayName
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.user) {
          this.handleAuthSuccess(res.user);
        } else {
          this.errorMessage = res.error || this.i18n.t('Đăng nhập thất bại!');
        }
      },
      error: (err) => {
        this.isLoading = false;
        // Fallback: Khi backend offline, kiểm tra domain hợp lệ để cho đăng nhập
        const fallback = this.createSmartFallbackUser(enteredEmail, displayName);
        if (fallback) {
          this.handleAuthSuccess(fallback);
        } else {
          this.errorMessage = err.error?.error || this.i18n.t('Tài khoản không hợp lệ! Vui lòng sử dụng email đuôi @uel.edu.vn hoặc @st.uel.edu.vn.');
        }
      }
    });
  }

  // Tiện ích Carousel
  startCarousel(): void {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 4500);
  }

  stopCarousel(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  nextSlide(): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.carouselImages.length;
  }

  prevSlide(): void {
    this.currentImageIndex = (this.currentImageIndex - 1 + this.carouselImages.length) % this.carouselImages.length;
  }

  setSlide(index: number): void {
    this.currentImageIndex = index;
    this.stopCarousel();
    this.startCarousel();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  fillAdminMockup(): void {
    this.username = 'admin@uel.edu.vn';
    this.password = 'Admin@UEL2026';
    this.handleLogin();
  }
}
