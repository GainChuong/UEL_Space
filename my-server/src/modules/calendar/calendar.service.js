/**
 * Google Calendar Service - Option C Live Synchronization
 * Quản lý OAuth 2.0 Tokens, Refresh Tokens, FreeBusy Queries & Events Creation
 */

const { env } = require('../../config/env');

class CalendarService {
  constructor({ usersCollection, db }) {
    this.usersCollection = usersCollection;
    this.db = db;
    this.clientId = env.googleClientId;
    this.clientSecret = env.googleClientSecret;
  }

  /**
   * 1. Sinh URL ủy quyền Google Calendar OAuth 2.0 (yêu cầu quyền Lịch + Offline Mode để lấy Refresh Token)
   */
  getAuthUrl(redirectUri, state = '') {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' '),
      access_type: 'offline', // ĐẶC BIỆT QUAN TRỌNG: để nhận refresh_token
      prompt: 'consent',      // Luôn nhắc chấp thuận để nhận refresh_token
      state: state || 'uel_space_calendar_sync'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * 2. Đổi mã Authorization Code lấy Tokens (access_token + refresh_token)
   */
  async exchangeCodeForTokens({ code, redirectUri, userEmail }) {
    if (!code) {
      throw new Error('Mã xác thực Google code không được để trống.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || tokenData.error) {
      console.error('Google token exchange error:', tokenData);
      throw new Error(tokenData.error_description || tokenData.error || 'Không thể đổi mã xác thực Google.');
    }

    // Lấy thông tin tài khoản Google vừa kết nối
    let googleEmail = userEmail;
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      if (userInfoRes.ok) {
        const uInfo = await userInfoRes.json();
        if (uInfo.email) googleEmail = uInfo.email.toLowerCase();
      }
    } catch (e) {
      console.warn('Cannot fetch userinfo:', e);
    }

    const expiryDate = Date.now() + (tokenData.expires_in || 3600) * 1000;

    const calendarInfo = {
      isConnected: true,
      googleEmail: googleEmail || userEmail,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null, // Lưu ý: chỉ trả về lần đầu tiên hoặc khi có prompt=consent
      expiryDate: expiryDate,
      scope: tokenData.scope || '',
      updatedAt: new Date().toISOString()
    };

    // Lưu vào MongoDB người dùng
    if (this.usersCollection && (userEmail || googleEmail)) {
      const targetEmail = (userEmail || googleEmail).toLowerCase();
      
      // Nếu không có refresh_token mới (do đã cấp trước đó), giữ nguyên refresh_token cũ
      const existingUser = await this.usersCollection.findOne({ email: targetEmail });
      if (!calendarInfo.refreshToken && existingUser && existingUser.googleCalendar && existingUser.googleCalendar.refreshToken) {
        calendarInfo.refreshToken = existingUser.googleCalendar.refreshToken;
      }

      await this.usersCollection.updateOne(
        { email: targetEmail },
        { 
          $set: { 
            email: targetEmail,
            googleCalendar: calendarInfo,
            updatedAt: new Date()
          },
          $setOnInsert: {
            name: googleEmail ? googleEmail.split('@')[0] : 'User',
            role: 'student',
            status: 'active',
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
    }

    return {
      success: true,
      email: googleEmail,
      isConnected: true,
      expiryDate
    };
  }

  /**
   * 3. Lấy Access Token còn hiệu lực (tự động Refresh nếu đã hết hạn)
   */
  async getValidAccessToken(userEmail) {
    if (!this.usersCollection) throw new Error('Database chưa kết nối.');
    const user = await this.usersCollection.findOne({ email: userEmail.toLowerCase() });
    
    if (!user || !user.googleCalendar || !user.googleCalendar.isConnected) {
      return null;
    }

    const { accessToken, refreshToken, expiryDate } = user.googleCalendar;

    // Nếu token còn hạn > 5 phút thì dùng tiếp
    if (accessToken && expiryDate && (expiryDate - Date.now() > 5 * 60 * 1000)) {
      return accessToken;
    }

    // Nếu hết hạn nhưng có refresh_token -> Tự động làm mới
    if (refreshToken) {
      try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
          })
        });

        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.access_token) {
          const newExpiry = Date.now() + (refreshData.expires_in || 3600) * 1000;
          await this.usersCollection.updateOne(
            { email: userEmail.toLowerCase() },
            {
              $set: {
                'googleCalendar.accessToken': refreshData.access_token,
                'googleCalendar.expiryDate': newExpiry,
                'googleCalendar.updatedAt': new Date().toISOString()
              }
            }
          );
          return refreshData.access_token;
        } else {
          console.warn('Google token refresh failed:', refreshData);
        }
      } catch (err) {
        console.error('Error refreshing Google token:', err);
      }
    }

    return accessToken;
  }

  /**
   * 4. Kiểm tra trạng thái kết nối Google Calendar của người dùng
   */
  async getConnectionStatus(userEmail) {
    if (!this.usersCollection || !userEmail) {
      return { isConnected: false };
    }

    const user = await this.usersCollection.findOne({ email: userEmail.toLowerCase() });
    if (!user || !user.googleCalendar || !user.googleCalendar.isConnected) {
      return { isConnected: false };
    }

    return {
      isConnected: true,
      email: user.googleCalendar.googleEmail || user.email,
      updatedAt: user.googleCalendar.updatedAt
    };
  }

  /**
   * 5. Hủy liên kết Google Calendar
   */
  async disconnect(userEmail) {
    if (!this.usersCollection || !userEmail) return { success: true };
    await this.usersCollection.updateOne(
      { email: userEmail.toLowerCase() },
      {
        $set: {
          'googleCalendar.isConnected': false,
          'googleCalendar.accessToken': null,
          'googleCalendar.refreshToken': null,
          'googleCalendar.updatedAt': new Date().toISOString()
        }
      }
    );
    return { success: true, message: 'Đã hủy kết nối Google Calendar' };
  }

  /**
   * 6. Truy vấn FreeBusy thời gian thực (Real-time Available Slots)
   * Lấy các khung giờ bận thật của tài khoản Google trong ngày targetDate
   */
  async getFreeBusy({ userEmail, dateStr }) {
    const status = await this.getConnectionStatus(userEmail);
    if (!status.isConnected) {
      return {
        isConnected: false,
        message: 'Tài khoản chưa kết nối Google Calendar.',
        busySlots: []
      };
    }

    const accessToken = await this.getValidAccessToken(userEmail);
    if (!accessToken) {
      return {
        isConnected: false,
        message: 'Phiên Google Calendar đã hết hạn, vui lòng kết nối lại.',
        busySlots: []
      };
    }

    // Tính toán timeMin và timeMax cho ngày dateStr (VD: "2026-11-01") theo múi giờ Việt Nam +07:00
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const timeMin = `${targetDate}T00:00:00+07:00`;
    const timeMax = `${targetDate}T23:59:59+07:00`;

    // 1. Gọi Google Calendar FreeBusy API
    let busyRanges = [];
    try {
      const freeBusyRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          timeZone: 'Asia/Ho_Chi_Minh',
          items: [{ id: 'primary' }]
        })
      });

      if (freeBusyRes.ok) {
        const fbData = await freeBusyRes.json();
        const primary = fbData.calendars && fbData.calendars.primary;
        if (primary && Array.isArray(primary.busy)) {
          busyRanges = primary.busy;
        }
      }
    } catch (e) {
      console.warn('Freebusy API query failed:', e);
    }

    // 2. Gọi thêm Events API để lấy chi tiết Tên sự kiện (Meeting title)
    let eventTitlesMap = {};
    try {
      const eventsRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      if (eventsRes.ok) {
        const evData = await eventsRes.json();
        if (Array.isArray(evData.items)) {
          for (const ev of evData.items) {
            const startStr = ev.start?.dateTime || ev.start?.date;
            if (startStr) {
              eventTitlesMap[startStr] = ev.summary || 'Sự kiện Google Calendar';
            }
          }
        }
      }
    } catch (e) {
      console.warn('Events API query failed:', e);
    }

    // 3. Chuẩn hóa về format giờ: "08:00", "11:30"
    const busySlots = busyRanges.map((item, idx) => {
      const sDate = new Date(item.start);
      const eDate = new Date(item.end);

      const sHour = sDate.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false });
      const eHour = eDate.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false });
      
      const title = eventTitlesMap[item.start] || `Lịch hẹn cá nhân (${sHour} - ${eHour})`;

      return {
        id: `gcal-${idx}-${Date.now()}`,
        start: sHour,
        end: eHour,
        time: `${sHour} - ${eHour}`,
        title: title,
        isBusy: true,
        type: 'google-calendar-event'
      };
    });

    return {
      success: true,
      isConnected: true,
      email: status.email,
      date: targetDate,
      busySlots
    };
  }

  /**
   * 7. Tự động đẩy sự kiện Đặt phòng vào Google Calendar của người dùng (2-Way Sync)
   */
  async createBookingEvent(userEmail, bookingData) {
    const accessToken = await this.getValidAccessToken(userEmail);
    if (!accessToken) {
      console.warn('No active Google access token for booking sync:', userEmail);
      return { success: false, reason: 'NO_TOKEN' };
    }

    try {
      const targetDate = bookingData.date || new Date().toISOString().split('T')[0];
      const startTime = bookingData.startTime || '08:00';
      const endTime = bookingData.endTime || '10:00';

      const startDateTime = `${targetDate}T${startTime}:00+07:00`;
      const endDateTime = `${targetDate}T${endTime}:00+07:00`;

      const summary = `[UEL Space] Đặt phòng ${bookingData.spaceName || 'Không gian học tập'}`;
      const description = [
        `🏢 Nền tảng: UEL Space - Smart Office & Campus Space Management`,
        `📍 Địa điểm: ${bookingData.spaceName || 'Phòng học/Phòng họp'} (${bookingData.building || 'Khuôn viên UEL'})`,
        `🎟️ Mã đặt chỗ: ${bookingData.code || 'UEL-BOOKING'}`,
        `👤 Người đặt: ${userEmail}`,
        `⏰ Khung giờ: ${startTime} - ${endTime}`,
        `----------------------------------------`,
        `⚠️ Check-in: Vui lòng quét mã QR tại Kiosk tiếp tân khi đến nơi.`
      ].join('\n');

      const eventPayload = {
        summary,
        description,
        location: bookingData.location || `UEL Space, ${bookingData.building || 'Trường ĐH Kinh tế - Luật'}`,
        start: { dateTime: startDateTime, timeZone: 'Asia/Ho_Chi_Minh' },
        end: { dateTime: endDateTime, timeZone: 'Asia/Ho_Chi_Minh' },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'popup', minutes: 10 }
          ]
        }
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventPayload)
      });

      if (res.ok) {
        const created = await res.json();
        return { success: true, eventId: created.id, htmlLink: created.htmlLink };
      } else {
        const errData = await res.json();
        console.error('Failed to create Google Calendar event:', errData);
        return { success: false, error: errData };
      }
    } catch (e) {
      console.error('Error creating Google Calendar event:', e);
      return { success: false, error: e.message };
    }
  }
}

module.exports = { CalendarService };
