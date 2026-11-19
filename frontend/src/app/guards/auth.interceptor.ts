import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (typeof window === 'undefined') return next(req);

  const headers: Record<string, string> = {};
  const token = localStorage.getItem('uel_jwt_token');

  if (token && !req.headers.has('Authorization')) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Fallback đồng bộ vai trò khi chuyển nhanh tài khoản trên Header / Demo Offline
    const savedUserStr = localStorage.getItem('uel_current_user');
    const isLoggedIn = localStorage.getItem('uel_is_logged_in') === 'true';
    if (isLoggedIn && savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        if (u && u.role) {
          if (!req.headers.has('x-user-id') && u.id) headers['x-user-id'] = String(u.id);
          if (!req.headers.has('x-user-role')) headers['x-user-role'] = String(u.role);
          if (!req.headers.has('x-user-email') && u.email) headers['x-user-email'] = String(u.email);
        }
      } catch (_) {}
    }
  }

  return next(
    req.clone({
      setHeaders: headers
    })
  );
};
