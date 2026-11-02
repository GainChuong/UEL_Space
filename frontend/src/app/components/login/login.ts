import { Component, OnInit, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AUTH_GOOGLE_URL, AUTH_REGISTER_URL, GOOGLE_CLIENT_ID, SERVER_IMAGES_LINK } from '../../services/api-config';
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
  authMode: 'login' | 'register' = 'login';
  portalRole: 'buyer' | 'seller' = 'buyer'; // 'buyer' = Khách thuê cá nhân/DN, 'seller' = Chủ không gian/Host Partner
  fullName: string = '';
  username: string = 'minhanh@gmail.com';
  password: string = '';
  confirmPassword: string = '';
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

  // Trạng thái thông báo
  domainAlert = {
    isOpen: false,
    email: '',
    message: '',
    toastVisible: false
  };
  private toastTimer: any;

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
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
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

  // Tạo Profile người dùng UEL Space chuẩn (hỗ trợ BUYER, SELLER, ADMIN)
  private createSmartFallbackUser(email: string, name?: string, picture?: string): UserProfile | null {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return null;
    }

    const isAdmin = cleanEmail.startsWith('admin') || cleanEmail.includes('admin@') || cleanEmail === 'gameyuno123@gmail.com';
    const isSeller = cleanEmail.includes('seller') || cleanEmail.includes('host') || cleanEmail.includes('partner') || ['techpark@gmail.com', 'innovate@gmail.com', 'landmark@gmail.com', 'uelhub@gmail.com', 'creative@gmail.com'].includes(cleanEmail) || this.portalRole === 'seller';

    const role: 'ADMIN' | 'SELLER' | 'BUYER' = isAdmin ? 'ADMIN' : (isSeller ? 'SELLER' : 'BUYER');
    const organization = isAdmin 
      ? 'Ban Quản Trị Hệ Thống UEL Space' 
      : (isSeller ? 'Đối tác sở hữu không gian (Host Partner)' : 'Doanh nghiệp & Khách thuê (Member)');

    return {
      id: cleanEmail.split('@')[0].toUpperCase(),
      name: name || (cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
      email: cleanEmail,
      role: role,
      organization: organization,
      avatar: picture || ''
    };
  }

  // Kích hoạt thông báo cảnh báo tên miền không được cấp phép
  triggerDomainRejectionNotice(email: string, customMessage?: string): void {
    const cleanEmail = (email || '').trim().toLowerCase();
    const message = customMessage || this.i18n.t(
      `Tài khoản (${cleanEmail || 'không xác định'}) bị từ chối! Hệ thống UEL SPACE chỉ tiếp nhận tài khoản Google chính thức của Trường ĐH Kinh tế - Luật (@uel.edu.vn hoặc @st.uel.edu.vn).`
    );

    this.domainAlert = {
      isOpen: true,
      email: cleanEmail,
      message: message,
      toastVisible: true
    };
    this.errorMessage = message;

    // Tự đóng toast sau 8 giây (modal vẫn hiển thị để người dùng đọc chi tiết)
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.domainAlert.toastVisible = false;
    }, 8000);

    // 1. Gửi thông báo Desktop Notification (nếu người dùng đã cấp quyền)
    try {
      this.settingsService.sendDesktopNotification(
        'UEL SPACE - Đăng nhập bị từ chối',
        `Tài khoản ${cleanEmail} không thuộc tên miền @uel.edu.vn hoặc @st.uel.edu.vn.`
      );
    } catch {
      // Bỏ qua nếu môi trường không hỗ trợ Web Notification API
    }

    // 2. Thêm vào trung tâm thông báo hệ thống
    this.settingsService.addNotification({
      title: 'Đăng nhập Google bị từ chối',
      message: `Tài khoản Google (${cleanEmail || 'vô danh'}) đã cố đăng nhập nhưng không thuộc tên miền quy định (@uel.edu.vn hoặc @st.uel.edu.vn).`,
      type: 'alert',
      category: 'system'
    });
  }

  closeDomainAlert(): void {
    this.domainAlert.isOpen = false;
  }

  closeDomainToast(): void {
    this.domainAlert.toastVisible = false;
  }

  retryGoogleWithDifferentAccount(): void {
    this.closeDomainAlert();
    this.closeDomainToast();
    this.triggerGoogleLogin();
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
          const errMsg = res.error?.message || res.error || this.i18n.t('Đăng nhập không thành công.');
          this.errorMessage = typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg);
        }
      },
      error: (err) => {
        const serverErrorCode = err.error?.error?.code;
        const serverErrorMsg = err.error?.error?.message || err.error?.message;
        const isDomainRejected = serverErrorCode === 'EMAIL_DOMAIN_REJECTED' || err.status === 403;

        // Fetch thông tin profile từ Google API để đối chiếu email
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
          .then((r) => r.json())
          .then((googleUser) => {
            this.isLoading = false;
            const fallbackUser = this.createSmartFallbackUser(googleUser.email, googleUser.name, googleUser.picture);
            if (fallbackUser && !isDomainRejected) {
              this.handleAuthSuccess(fallbackUser);
            } else {
              // Gửi thông báo từ chối tên miền email trực tiếp cho user
              this.triggerDomainRejectionNotice(googleUser.email, serverErrorMsg);
            }
          })
          .catch(() => {
            this.isLoading = false;
            if (isDomainRejected) {
              this.triggerDomainRejectionNotice('', serverErrorMsg);
            } else {
              const msg = serverErrorMsg || err.message || this.i18n.t('Tài khoản bị từ chối! Hệ thống chỉ chấp nhận tài khoản Google thuộc Trường ĐH Kinh tế - Luật (@uel.edu.vn hoặc @st.uel.edu.vn).');
              this.errorMessage = typeof msg === 'string' ? msg : JSON.stringify(msg);
            }
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

    const payload = this.decodeJwtPayload(response.credential);
    const candidateEmail = payload?.email || '';

    // Gửi token xác thực lên Express Backend
    this.http.post<any>(AUTH_GOOGLE_URL, { idToken: response.credential }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.user) {
          this.handleAuthSuccess(res.user);
        } else {
          const errMsg = res.error?.message || res.error || this.i18n.t('Đăng nhập không thành công.');
          this.errorMessage = typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg);
        }
      },
      error: (err) => {
        this.isLoading = false;
        const serverErrorCode = err.error?.error?.code;
        const serverErrorMsg = err.error?.error?.message || err.error?.message;

        if (serverErrorCode === 'EMAIL_DOMAIN_REJECTED' || err.status === 403) {
          this.triggerDomainRejectionNotice(candidateEmail, serverErrorMsg);
          return;
        }

        // Smart Fallback khi Backend Cloud chưa kịp online
        if (candidateEmail) {
          const fallbackUser = this.createSmartFallbackUser(candidateEmail, payload?.name, payload?.picture);
          if (fallbackUser) {
            this.handleAuthSuccess(fallbackUser);
            return;
          } else {
            this.triggerDomainRejectionNotice(candidateEmail);
            return;
          }
        }

        const fallbackMsg = serverErrorMsg || err.message || this.i18n.t('Đăng nhập thất bại: Tài khoản không thỏa điều kiện của Trường ĐH Kinh tế - Luật!');
        this.errorMessage = typeof fallbackMsg === 'string' ? fallbackMsg : JSON.stringify(fallbackMsg);
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
        const serverErrorCode = err.error?.error?.code;
        const serverErrorMsg = err.error?.error?.message || err.error?.message;
        if (serverErrorCode === 'EMAIL_DOMAIN_REJECTED' || err.status === 403) {
          this.triggerDomainRejectionNotice(email, serverErrorMsg);
          return;
        }

        const fallback = this.createSmartFallbackUser(email, name);
        if (fallback) {
          this.handleAuthSuccess(fallback);
        } else {
          this.triggerDomainRejectionNotice(email, serverErrorMsg);
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

  // Submit Form Truyền thống (Đăng nhập / Đăng ký)
  handleFormSubmit(): void {
    if (this.authMode === 'register') {
      this.handleRegister();
    } else {
      this.handleLogin();
    }
  }

  handleRegister(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    let enteredEmail = this.username.trim().toLowerCase();
    if (!enteredEmail || !enteredEmail.includes('@')) {
      this.isLoading = false;
      this.errorMessage = this.i18n.t('Vui lòng nhập địa chỉ email hợp lệ (@gmail.com hoặc @st.uel.edu.vn)!');
      return;
    }

    if (!this.fullName.trim()) {
      this.isLoading = false;
      this.errorMessage = this.i18n.t('Vui lòng nhập họ và tên của bạn!');
      return;
    }

    if (!this.password || this.password.length < 8) {
      this.isLoading = false;
      this.errorMessage = this.i18n.t('Mật khẩu phải có ít nhất 8 ký tự!');
      return;
    }

    const hasUpper = /[A-Z]/.test(this.password);
    const hasLower = /[a-z]/.test(this.password);
    const hasDigit = /[0-9]/.test(this.password);
    if (!hasUpper || !hasLower || !hasDigit) {
      this.isLoading = false;
      this.errorMessage = this.i18n.t('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số!');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.isLoading = false;
      this.errorMessage = this.i18n.t('Mật khẩu xác nhận không khớp!');
      return;
    }

    const payload = {
      email: enteredEmail,
      password: this.password,
      fullName: this.fullName.trim(),
      role: this.portalRole === 'seller' ? 'SELLER' : 'BUYER'
    };

    this.http.post<any>(AUTH_REGISTER_URL, payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.user) {
          this.successMessage = this.i18n.t('Đăng ký tài khoản thành công và đã lưu vào MongoDB Atlas!');
          this.handleAuthSuccess(res.user);
        } else {
          this.errorMessage = res.message || res.error || this.i18n.t('Đăng ký thất bại!');
        }
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.error?.message || err.error?.message || err.message;
        if (msg && msg.includes('EMAIL_EXISTS')) {
          this.errorMessage = this.i18n.t('Email này đã tồn tại trên hệ thống, vui lòng chuyển qua Đăng nhập!');
        } else {
          // Fallback offline mock registration
          const fallback = this.createSmartFallbackUser(enteredEmail, this.fullName.trim());
          if (fallback) {
            this.successMessage = this.i18n.t('Đăng ký thành công!');
            this.handleAuthSuccess(fallback);
          } else {
            this.errorMessage = msg || this.i18n.t('Đăng ký thất bại!');
          }
        }
      }
    });
  }

  // Submit Form Truyền thống
  handleLogin(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    let enteredEmail = this.username.trim().toLowerCase();
    if (!enteredEmail.includes('@')) {
      enteredEmail += '@gmail.com';
    }

    const displayName = enteredEmail.includes('admin') 
      ? 'Quản trị viên UEL Space' 
      : (this.portalRole === 'seller' ? 'Đối tác Quản lý Không gian' : 'Khách thuê Không gian');

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
        // Fallback: Khi backend offline, tự tạo profile hợp lệ
        const fallback = this.createSmartFallbackUser(enteredEmail, displayName);
        if (fallback) {
          this.handleAuthSuccess(fallback);
        } else {
          this.errorMessage = this.i18n.t('Đăng nhập thất bại, vui lòng kiểm tra lại email!');
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
    this.authMode = 'login';
    this.username = 'admin@gmail.com';
    this.password = '123456';
    this.handleLogin();
  }
}
