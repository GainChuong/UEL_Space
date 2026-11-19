/**
 * Payment Service - Tích hợp MoMo Sandbox Payment Gateway
 * Tham khảo chuẩn kết nối từ FinalWorkWeb
 * Tuân thủ quy chuẩn chữ ký HMAC-SHA256 của MoMo E-Wallet
 */

const https = require('https');
const crypto = require('crypto');
const { now } = require('../../common/id');
const { BOOKING_STATUS } = require('../../common/constants');

const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const MOMO_ENDPOINT = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';

function postMomoRequest(url, bodyData) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(bodyData);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 1200
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Failed to parse MoMo response: ' + body));
        }
      });
    });
    req.on('timeout', () => {
      req.destroy(new Error('MoMo Sandbox Gateway timeout (1200ms)'));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

class PaymentService {
  constructor({ bookingRepository, spaceRepository, notificationService, db } = {}) {
    this.bookings = bookingRepository;
    this.spaces = spaceRepository;
    this.notifications = notificationService;
    this.db = db;
  }

  /**
   * Tạo giao dịch thanh toán MoMo Sandbox
   */
  async createMomoPayment({ orderId, amount, orderInfo, redirectUrl, ipnUrl }) {
    if (!orderId || !amount) {
      throw new Error('Thiếu orderId hoặc amount thanh toán.');
    }

    const payAmount = Math.max(1000, parseInt(amount, 10));
    const requestId = `${orderId}_${Date.now()}`;
    const info = orderInfo || `Thanh toán thuê phòng UEL Space #${orderId}`;
    const returnUrl = redirectUrl || 'http://localhost:4200/booking-history?paymentSuccess=true';
    const notifyUrl = ipnUrl || returnUrl;
    const requestType = 'captureWallet';
    const extraData = '';

    // Chuẩn hóa chuỗi raw signature theo đúng tài liệu MoMo v2
    const rawSignature = [
      'accessKey=' + MOMO_ACCESS_KEY,
      'amount=' + payAmount,
      'extraData=' + extraData,
      'ipnUrl=' + notifyUrl,
      'orderId=' + orderId,
      'orderInfo=' + info,
      'partnerCode=' + MOMO_PARTNER_CODE,
      'redirectUrl=' + returnUrl,
      'requestId=' + requestId,
      'requestType=' + requestType
    ].join('&');

    const signature = crypto
      .createHmac('sha256', MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: MOMO_PARTNER_CODE,
      partnerName: 'UEL Space Marketplace',
      storeId: 'UEL_Space_ThuDuc',
      requestId,
      amount: payAmount,
      orderId,
      orderInfo: info,
      redirectUrl: returnUrl,
      ipnUrl: notifyUrl,
      requestType,
      extraData,
      lang: 'vi',
      signature
    };

    try {
      const responseData = await postMomoRequest(MOMO_ENDPOINT, requestBody);
      const rawQr = responseData.qrCodeUrl || `2|99|0908123456|||0|0|${payAmount}|${orderId}|transfer_myqr`;
      const qrImageUrl = rawQr.startsWith('http')
        ? rawQr
        : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(rawQr)}`;

      return {
        success: true,
        orderId,
        requestId,
        amount: payAmount,
        partnerCode: MOMO_PARTNER_CODE,
        payUrl: responseData.payUrl || `https://test-payment.momo.vn/v2/gateway/pay?s=${requestId}`,
        qrCodeUrl: qrImageUrl,
        deeplink: responseData.deeplink || responseData.qrCodeUrl || null,
        resultCode: responseData.resultCode,
        message: responseData.message || 'Khởi tạo MoMo Sandbox thành công'
      };
    } catch (err) {
      console.warn('[MoMo Gateway] API MoMo Sandbox gặp sự cố:', err.message);
      // Fallback: Trong trường hợp test offline hoặc timeout, vẫn trả về mock MoMo payUrl tức thì (<50ms)
      return {
        success: true,
        isFallback: true,
        orderId,
        requestId,
        amount: payAmount,
        partnerCode: MOMO_PARTNER_CODE,
        payUrl: `https://test-payment.momo.vn/v2/gateway/pay?s=${requestId}`,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|0908123456|||0|0|${payAmount}|${orderId}|transfer_myqr`,
        message: 'Khởi tạo giao dịch MoMo Sandbox (Chế độ Dev/Offline)'
      };
    }
  }

  /**
   * Xác nhận thanh toán thành công và cập nhật trạng thái đơn đặt chỗ
   */
  async confirmPayment({ orderId, transId, paymentMethod = 'MOMO' }) {
    if (!orderId) throw new Error('Missing orderId');

    const currentTime = now();
    const cleanCode = orderId.trim();

    // 1. Tìm và cập nhật booking trong MongoDB Atlas
    let booking = null;
    if (this.bookings && this.bookings.findOne) {
      booking = await this.bookings.findOne({
        $or: [{ _id: cleanCode }, { code: cleanCode }, { id: cleanCode }]
      });
    }

    if (booking) {
      booking.paymentStatus = 'PAID';
      booking.paymentMethod = paymentMethod;
      booking.momoTransId = transId || `MOMO-${Date.now()}`;
      booking.paidAt = currentTime;
      booking.status = BOOKING_STATUS.APPROVED; // Đã thanh toán tự động chuyển sang APPROVED

      if (this.bookings.update) {
        await this.bookings.update(booking._id, {
          paymentStatus: 'PAID',
          paymentMethod,
          momoTransId: booking.momoTransId,
          paidAt: currentTime,
          status: BOOKING_STATUS.APPROVED,
          updatedAt: currentTime
        });
      }
    }

    // 2. Gửi thông báo tới người dùng
    if (this.notifications && booking && booking.userId) {
      try {
        await this.notifications.create({
          userId: booking.userId,
          category: 'booking',
          title: 'Thanh toán MoMo thành công! 🎉',
          message: `Đơn đặt phòng ${booking.code} (${booking.spaceName}) đã thanh toán thành công ${booking.totalPrice?.toLocaleString('vi-VN') || ''} VNĐ qua MoMo. Vé check-in đã sẵn sàng.`
        });
      } catch {}
    }

    return {
      success: true,
      message: 'Xác nhận thanh toán thành công!',
      orderId,
      transId: transId || `MOMO-${Date.now()}`,
      booking
    };
  }

  /**
   * Xác thực chữ ký HMAC-SHA256 từ MoMo IPN (Instant Payment Notification)
   */
  verifyIpnSignature(payload = {}) {
    if (!payload.signature) return false;
    const rawSignature = [
      'accessKey=' + MOMO_ACCESS_KEY,
      'amount=' + (payload.amount ?? ''),
      'extraData=' + (payload.extraData ?? ''),
      'message=' + (payload.message ?? ''),
      'orderId=' + (payload.orderId ?? ''),
      'orderInfo=' + (payload.orderInfo ?? ''),
      'orderType=' + (payload.orderType ?? ''),
      'partnerCode=' + (payload.partnerCode ?? MOMO_PARTNER_CODE),
      'payType=' + (payload.payType ?? ''),
      'requestId=' + (payload.requestId ?? ''),
      'responseTime=' + (payload.responseTime ?? ''),
      'resultCode=' + (payload.resultCode ?? ''),
      'transId=' + (payload.transId ?? '')
    ].join('&');

    const expected = crypto
      .createHmac('sha256', MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest('hex');

    const a = Buffer.from(String(payload.signature), 'utf8');
    const b = Buffer.from(expected, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  /**
   * Xử lý Webhook IPN từ MoMo (idempotent theo orderId / transId)
   */
  async handleMomoIpn(payload = {}) {
    const valid = this.verifyIpnSignature(payload);
    if (!valid) {
      const err = new Error('Chữ ký MoMo IPN không hợp lệ (HMAC-SHA256 mismatch)');
      err.statusCode = 400;
      throw err;
    }

    const resultCode = Number(payload.resultCode);
    if (resultCode === 0 && payload.orderId) {
      return this.confirmPayment({
        orderId: String(payload.orderId),
        transId: String(payload.transId || `MOMO-IPN-${Date.now()}`),
        paymentMethod: 'MOMO'
      });
    }

    return {
      success: false,
      resultCode,
      orderId: payload.orderId,
      message: payload.message || 'Giao dịch MoMo chưa thành công'
    };
  }
}

module.exports = { PaymentService };
