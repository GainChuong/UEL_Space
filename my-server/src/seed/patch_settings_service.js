const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../../../frontend/src/app/services/settings.service.ts');
let content = fs.readFileSync(file, 'utf8');

// 1. Add SERVER_BASE_URL import
if (!content.includes('SERVER_BASE_URL')) {
  content = content.replace(
    "import { BehaviorSubject, Observable } from 'rxjs';",
    "import { BehaviorSubject, Observable } from 'rxjs';\nimport { SERVER_BASE_URL } from './api-config';"
  );
}

// 2. Expand AppNotification interface
const oldInterface = `export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  category: 'system' | 'booking' | 'presence';
}`;

const newInterface = `export interface AppNotification {
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
}`;

content = content.replace(oldInterface, newInterface);

// 3. Add sseSource & Toast state to SettingsService
const oldNotifState = `  // Notifications State
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$: Observable<AppNotification[]> = this.notificationsSubject.asObservable();`;

const newNotifState = `  // Notifications State
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$: Observable<AppNotification[]> = this.notificationsSubject.asObservable();
  
  // Real-time SSE & Live Floating Toast
  private sseSource: EventSource | null = null;
  private toastAlertSubject = new BehaviorSubject<{ show: boolean; title: string; message: string; type: string; link?: string } | null>(null);
  public toastAlert$ = this.toastAlertSubject.asObservable();`;

content = content.replace(oldNotifState, newNotifState);

// 4. Update initNotifications and methods
const oldMethodsRegex = /  \/\/ --- Notifications Management ---[\s\S]*?  public clearAllNotifications\(\): void \{[\s\S]*?  \}/;

const newMethods = `  // --- Notifications Management (Real-Time SSE + MongoDB Persistence) ---
  public detectCurrentRole(): 'ADMIN' | 'SELLER' | 'CUSTOMER' {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('admin')) return 'ADMIN';
      if (path.includes('seller')) return 'SELLER';
    }
    const user = this.currentUserSubject.value;
    if (user?.role === 'ADMIN') return 'ADMIN';
    if (user?.role === 'SPACE_MANAGER') return 'SELLER';
    return 'CUSTOMER';
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
      const res = await fetch(\`\${SERVER_BASE_URL}/api/notifications?role=\${role}&userId=\${userId}\`);
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
      const sseUrl = \`\${SERVER_BASE_URL}/api/notifications/stream?role=\${role}&userId=\${userId}\`;
      
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
      fetch(\`\${SERVER_BASE_URL}/api/notifications/\${id}/read\`, { method: 'POST' }).catch(() => {});
    }
  }

  public markAllAsRead(): void {
    const list = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(list);

    if (typeof window !== 'undefined') {
      const role = this.detectCurrentRole();
      fetch(\`\${SERVER_BASE_URL}/api/notifications/read-all?role=\${role}\`, { method: 'POST' }).catch(() => {});
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
  }`;

content = content.replace(oldMethodsRegex, newMethods);
fs.writeFileSync(file, content, 'utf8');
console.log('✓ Successfully patched settings.service.ts with live SSE and REST sync');
