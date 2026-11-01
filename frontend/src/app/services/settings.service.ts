import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SERVER_BASE_URL } from './api-config';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SELLER' | 'BUYER';
  avatar?: string;
  organization?: string;
}

export interface AppNotification {
  id: string;
  _id?: string;
  title: string;
  message: string;
  timeAgo: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  category: 'system' | 'booking' | 'presence' | 'space' | 'account';
  link?: string;
  role?: string;
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
    'Bạn đang ở chế độ xem thông tin. Vui lòng đăng nhập với tài khoản Google để thực hiện đặt chỗ và thanh toán.'
  );
  public authModalMessage$: Observable<string> = this.authModalMessageSubject.asObservable();

  // Settings Modal State
  private settingsModalOpenSubject = new BehaviorSubject<boolean>(false);
  public isSettingsModalOpen$: Observable<boolean> = this.settingsModalOpenSubject.asObservable();

  // Notifications State
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$: Observable<AppNotification[]> = this.notificationsSubject.asObservable();
  
  // Real-time SSE & Live Floating Toast
  private sseSource: EventSource | null = null;
  private toastAlertSubject = new BehaviorSubject<{ show: boolean; title: string; message: string; type: string; link?: string } | null>(null);
  public toastAlert$ = this.toastAlertSubject.asObservable();

  // Default Users
  public readonly defaultAdminUser: UserProfile = {
    id: 'ADMIN-001',
    name: 'Quản trị viên UEL Space',
    email: 'admin@gmail.com',
    role: 'ADMIN',
    organization: 'Ban Quản Trị Hệ Thống UEL Space'
  };

  public readonly defaultStudentUser: UserProfile = {
    id: 'BUYER-GIANG',
    name: 'Nguyễn Giang',
    email: 'giangnntk24411@st.uel.edu.vn',
    role: 'BUYER',
    organization: 'Khách thuê (Member)'
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

  // --- Notifications Management (Real-Time SSE + MongoDB Persistence) ---
  public detectCurrentRole(): 'ADMIN' | 'SELLER' | 'BUYER' {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('admin')) return 'ADMIN';
      if (path.includes('seller')) return 'SELLER';
    }
    const user = this.currentUserSubject.value;
    if (user?.role === 'ADMIN') return 'ADMIN';
    if (user?.role === 'SELLER') return 'SELLER';
    return 'BUYER';
  }

  private initNotifications(): void {
    const initialList: AppNotification[] = [
      {
        id: 'notif-welcome',
        title: 'Chào mừng bạn đến với UEL Space',
        message: 'Hệ sinh thái kết nối thời gian thực giữa Khách thuê, Chủ gian hàng và Ban quản trị sàn.',
        timeAgo: 'Vừa xong',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        type: 'success',
        read: false,
        category: 'system',
        link: '/'
      }
    ];
    this.notificationsSubject.next(initialList);

    if (typeof window !== 'undefined') {
      this.fetchRemoteNotifications();
      this.initSseStream();
    }
  }

  public async fetchRemoteNotifications(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const role = this.detectCurrentRole();
      const userId = this.currentUserSubject.value?.id || '';
      const res = await fetch(`${SERVER_BASE_URL}/api/notifications?role=${role}&userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: AppNotification[] = data.map(item => ({
            id: item.id || item._id,
            _id: item._id,
            title: item.title,
            message: item.message,
            timeAgo: item.time || 'Vừa xong',
            timestamp: item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
            type: (item.type || item.category || 'info') as any,
            read: !!(item.read || item.isRead),
            category: (item.category || 'system') as any,
            link: item.link,
            role: item.role
          }));
          this.notificationsSubject.next(mapped);
        }
      }
    } catch (e: any) {
      console.warn('Lỗi tải thông báo từ server:', e?.message);
    }
  }

  public initSseStream(): void {
    if (typeof window === 'undefined') return;
    try {
      if (this.sseSource) {
        this.sseSource.close();
      }
      const role = this.detectCurrentRole();
      const userId = this.currentUserSubject.value?.id || '';
      const sseUrl = `${SERVER_BASE_URL}/api/notifications/stream?role=${role}&userId=${userId}`;
      
      this.sseSource = new EventSource(sseUrl);

      this.sseSource.onmessage = (event) => {
        try {
          const item = JSON.parse(event.data);
          if (item && item.title) {
            this.handleIncomingNotification(item);
          }
        } catch (_) {}
      };

      this.sseSource.onerror = () => {
        // Trình duyệt tự động kết nối lại khi có mạng
      };
    } catch (e: any) {
      console.warn('Khởi tạo kết nối SSE stream cảnh báo:', e?.message);
    }
  }

  public handleIncomingNotification(item: any): void {
    const newNotif: AppNotification = {
      id: item.id || item._id || ('notif-' + Date.now()),
      _id: item._id,
      title: item.title,
      message: item.message,
      timeAgo: 'Vừa xong',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      type: (item.type || item.category || 'info') as any,
      read: false,
      category: (item.category || 'system') as any,
      link: item.link,
      role: item.role
    };

    const current = this.notificationsSubject.value.filter(n => n.id !== newNotif.id);
    this.notificationsSubject.next([newNotif, ...current]);

    // Gửi Web Desktop Notification nếu đã bật quyền
    this.sendDesktopNotification(newNotif.title, newNotif.message);

    // Bật popup Toast thông báo nổi trên màn hình
    this.triggerToastAlert(newNotif);
  }

  public triggerToastAlert(notif: AppNotification): void {
    this.toastAlertSubject.next({
      show: true,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      link: notif.link
    });
    setTimeout(() => {
      this.toastAlertSubject.next(null);
    }, 6000);
  }

  public closeToastAlert(): void {
    this.toastAlertSubject.next(null);
  }

  public get unreadCount(): number {
    return this.notificationsSubject.value.filter(n => !n.read).length;
  }

  public markAsRead(id: string): void {
    const list = this.notificationsSubject.value.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(list);

    if (typeof window !== 'undefined') {
      fetch(`${SERVER_BASE_URL}/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
    }
  }

  public markAllAsRead(): void {
    const list = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(list);

    if (typeof window !== 'undefined') {
      const role = this.detectCurrentRole();
      fetch(`${SERVER_BASE_URL}/api/notifications/read-all?role=${role}`, { method: 'POST' }).catch(() => {});
    }
  }

  public addNotification(notification: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'alert';
    category?: 'system' | 'booking' | 'presence' | 'space' | 'account';
    link?: string;
  }): void {
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: notification.title,
      message: notification.message,
      timeAgo: 'Vừa xong',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      type: notification.type || 'info',
      read: false,
      category: notification.category || 'system',
      link: notification.link
    };
    this.notificationsSubject.next([newNotif, ...this.notificationsSubject.value]);
  }

  public clearAllNotifications(): void {
    this.notificationsSubject.next([]);
  }
}
