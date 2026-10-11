import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT' | 'LECTURER' | 'SPACE_MANAGER';
  avatar?: string;
  organization?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  category: 'system' | 'booking' | 'presence';
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  // Theme State
  private themeSubject = new BehaviorSubject<'light' | 'dark'>('light');
  public theme$: Observable<'light' | 'dark'> = this.themeSubject.asObservable();

  // Language State
  private languageSubject = new BehaviorSubject<'vi' | 'en'>('vi');
  public language$: Observable<'vi' | 'en'> = this.languageSubject.asObservable();

  // Desktop Notifications State
  private desktopNotifSubject = new BehaviorSubject<boolean>(false);
  public desktopNotif$: Observable<boolean> = this.desktopNotifSubject.asObservable();

  // User Auth State
  private isLoggedInSubject = new BehaviorSubject<boolean>(true);
  public isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$: Observable<UserProfile | null> = this.currentUserSubject.asObservable();

  // Auth Required Prompt Modal (Chế độ chỉ xem)
  private authModalOpenSubject = new BehaviorSubject<boolean>(false);
  public isAuthModalOpen$: Observable<boolean> = this.authModalOpenSubject.asObservable();

  private authModalMessageSubject = new BehaviorSubject<string>(
    'Bạn đang ở chế độ chỉ xem. Vui lòng đăng nhập với tài khoản Google UEL để thực hiện thao tác này.'
  );
  public authModalMessage$: Observable<string> = this.authModalMessageSubject.asObservable();

  // Settings Modal State
  private settingsModalOpenSubject = new BehaviorSubject<boolean>(false);
  public isSettingsModalOpen$: Observable<boolean> = this.settingsModalOpenSubject.asObservable();

  // Notifications State
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$: Observable<AppNotification[]> = this.notificationsSubject.asObservable();

  // Default Users
  public readonly defaultAdminUser: UserProfile = {
    id: 'ADMIN-001',
    name: 'Admin UEL',
    email: 'admin@uel.edu.vn',
    role: 'ADMIN',
    organization: 'Phòng QTTTS & Quản trị Không gian'
  };

  public readonly defaultStudentUser: UserProfile = {
    id: 'K24411',
    name: 'Nguyễn Trần Kim Giang',
    email: 'giangnntk24411@st.uel.edu.vn',
    role: 'STUDENT',
    organization: 'CLB ITB UEL'
  };

  constructor() {
    this.initTheme();
    this.initLanguage();
    this.initDesktopNotif();
    this.initAuth();
    this.initNotifications();
  }

  // --- Theme Management ---
  private initTheme(): void {
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('uel_theme') as 'light' | 'dark') || 'light';
      this.setTheme(savedTheme);
    }
  }

  public setTheme(theme: 'light' | 'dark'): void {
    this.themeSubject.next(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uel_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    }
  }

  public toggleTheme(): void {
    const nextTheme = this.themeSubject.value === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme);
  }

  public get currentTheme(): 'light' | 'dark' {
    return this.themeSubject.value;
  }

  // --- Language Management ---
  private initLanguage(): void {
    if (typeof window !== 'undefined') {
      const savedLang = (localStorage.getItem('uel_lang') as 'vi' | 'en') || 'vi';
      this.setLanguage(savedLang);
    }
  }

  public setLanguage(lang: 'vi' | 'en'): void {
    this.languageSubject.next(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uel_lang', lang);
    }
  }

  public toggleLanguage(): void {
    const nextLang = this.languageSubject.value === 'vi' ? 'en' : 'vi';
    this.setLanguage(nextLang);
  }

  public get currentLanguage(): 'vi' | 'en' {
    return this.languageSubject.value;
  }

  // --- Desktop Notifications ---
  private initDesktopNotif(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uel_desktop_notifications') === 'true';
      const isGranted = 'Notification' in window && Notification.permission === 'granted';
      this.desktopNotifSubject.next(saved && isGranted);
    }
  }

  public async toggleDesktopNotifications(): Promise<{ success: boolean; message: string }> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { success: false, message: 'Trình duyệt không hỗ trợ Web Notifications API.' };
    }

    const current = this.desktopNotifSubject.value;
    if (current) {
      // Turn off
      this.desktopNotifSubject.next(false);
      localStorage.setItem('uel_desktop_notifications', 'false');
      return { success: true, message: 'Đã tắt thông báo Desktop.' };
    } else {
      // Request permission
      let perm = Notification.permission;
      if (perm === 'default') {
        perm = await Notification.requestPermission();
      }

      if (perm === 'granted') {
        this.desktopNotifSubject.next(true);
        localStorage.setItem('uel_desktop_notifications', 'true');
        
        try {
          new Notification('UEL SPACE', {
            body: 'Đã kích hoạt thông báo màn hình Desktop thành công!',
            icon: '/images/logo.png',
            badge: '/images/logo.png'
          });
        } catch {
          // Fallback if system restricts custom icon
        }

        return { success: true, message: 'Đã bật thông báo Desktop thành công!' };
      } else {
        this.desktopNotifSubject.next(false);
        localStorage.setItem('uel_desktop_notifications', 'false');
        return { success: false, message: 'Quyền thông báo bị từ chối trong cài đặt trình duyệt.' };
      }
    }
  }

  public sendDesktopNotification(title: string, body: string): void {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && this.desktopNotifSubject.value) {
      try {
        new Notification(title, { body, icon: '/images/logo.png' });
      } catch (e) {
        console.warn('Could not trigger notification', e);
      }
    }
  }

  // --- Auth Management ---
  private initAuth(): void {
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem('uel_is_logged_in');
      const savedUserStr = localStorage.getItem('uel_current_user');
      
      let user: UserProfile | null = null;
      if (savedUserStr) {
        try {
          user = JSON.parse(savedUserStr);
        } catch {
          user = null;
        }
      }

      // Khởi tạo trạng thái đăng nhập
      const isLoggedIn = savedAuth === 'true' && user !== null;
      this.isLoggedInSubject.next(isLoggedIn);
      this.currentUserSubject.next(isLoggedIn ? user : null);
    }
  }

  public login(user: UserProfile = this.defaultStudentUser): void {
    this.isLoggedInSubject.next(true);
    this.currentUserSubject.next(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uel_is_logged_in', 'true');
      localStorage.setItem('uel_current_user', JSON.stringify(user));
    }
  }

  public logout(): void {
    this.isLoggedInSubject.next(false);
    this.currentUserSubject.next(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uel_is_logged_in', 'false');
      localStorage.removeItem('uel_current_user');
    }
  }

  public get isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  public get currentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  // --- Auth Prompt Modal (Yêu cầu đăng nhập ở chế độ xem) ---
  public promptLogin(customMessage?: string): void {
    if (customMessage) {
      this.authModalMessageSubject.next(customMessage);
    } else {
      this.authModalMessageSubject.next(
        this.currentLanguage === 'vi'
          ? 'Bạn đang ở chế độ chỉ xem. Vui lòng đăng nhập với tài khoản Google UEL để thực hiện thao tác này.'
          : 'You are in view-only mode. Please sign in with your UEL Google account to perform this action.'
      );
    }
    this.authModalOpenSubject.next(true);
  }

  public closeAuthModal(): void {
    this.authModalOpenSubject.next(false);
  }

  public get isAuthModalOpen(): boolean {
    return this.authModalOpenSubject.value;
  }

  public checkAuthOrPrompt(actionName: string = 'thực hiện thao tác này'): boolean {
    if (!this.isLoggedIn) {
      this.promptLogin(
        this.currentLanguage === 'vi'
          ? `Bạn cần đăng nhập tài khoản UEL để ${actionName}. Hiện tại bạn đang ở chế độ chỉ xem thông tin.`
          : `You need to sign in to a UEL account to ${actionName}. You are currently in view-only mode.`
      );
      return false;
    }
    return true;
  }

  // --- Settings Modal ---
  public openSettings(): void {
    this.settingsModalOpenSubject.next(true);
  }

  public closeSettings(): void {
    this.settingsModalOpenSubject.next(false);
  }

  // --- Notifications Management ---
  private initNotifications(): void {
    const initialList: AppNotification[] = [
      {
        id: 'notif-1',
        title: 'Phê duyệt đặt phòng thành công',
        message: 'Đơn mượn Phòng Họp A2.1 (UEL-BK-2026-083) cho NCKH đã được Quản trị viên duyệt.',
        timeAgo: '5 phút trước',
        timestamp: '11/10/2026 09:28',
        type: 'success',
        read: false,
        category: 'booking'
      },
      {
        id: 'notif-2',
        title: 'Nhắc nhở quét QR xác thực hiện diện (F09)',
        message: 'Bạn còn 10 phút để quét mã QR check-in tại Khu tự học Thư viện (Tầng 2) trước khi bị giải phóng chỗ.',
        timeAgo: '20 phút trước',
        timestamp: '11/10/2026 09:12',
        type: 'warning',
        read: false,
        category: 'presence'
      },
      {
        id: 'notif-3',
        title: 'Bảo trì Chòi tự học 1 đã hoàn tất',
        message: 'Không gian Chòi tự học 1 (Đường Thanh Niên) đã mở lại phục vụ sinh viên sinh hoạt và học tập.',
        timeAgo: '1 giờ trước',
        timestamp: '11/10/2026 08:30',
        type: 'info',
        read: true,
        category: 'system'
      },
      {
        id: 'notif-4',
        title: 'Phân quyền tài khoản ThS. Lê Hoàng Long',
        message: 'Tài khoản giảng viên đã được kích hoạt chế độ ưu tiên đặt phòng hội thảo.',
        timeAgo: 'Hôm qua',
        timestamp: '10/10/2026 17:45',
        type: 'info',
        read: true,
        category: 'system'
      }
    ];
    this.notificationsSubject.next(initialList);
  }

  public get unreadCount(): number {
    return this.notificationsSubject.value.filter(n => !n.read).length;
  }

  public markAsRead(id: string): void {
    const list = this.notificationsSubject.value.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(list);
  }

  public markAllAsRead(): void {
    const list = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(list);
  }

  public clearAllNotifications(): void {
    this.notificationsSubject.next([]);
  }
}
