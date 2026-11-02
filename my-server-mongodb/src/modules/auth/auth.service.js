const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { env } = require('../../config/env');
const { AppError } = require('../../common/app-error');
const { newId, now } = require('../../common/id');
const { ROLES } = require('../../common/constants');
const { publicUser } = require('../../common/presenters');
const { writeAudit } = require('../../common/audit');
const { requireString } = require('../../common/validate');

const ALLOWED_DOMAIN_REGEX = /@(st\.)?uel\.edu\.vn$/i;


// =========================================================================
// SECURITY ENHANCEMENTS: HMAC Pepper, Cost 12 Bcrypt & Timing Protection
// =========================================================================

function applyPepper(password) {
  const secret = env.passwordPepper || 'uel_space_super_secret_pepper_key_2026_x89a';
  return crypto.createHmac('sha256', secret).update(String(password || '')).digest('hex');
}

function validatePasswordStrength(password) {
  const raw = requireString(password, 'password', { min: 8 });
  const hasUpper = /[A-Z]/.test(raw);
  const hasLower = /[a-z]/.test(raw);
  const hasDigit = /[0-9]/.test(raw);
  if (!hasUpper || !hasLower || !hasDigit) {
    throw AppError.badRequest('Mật khẩu phải có tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.', 'WEAK_PASSWORD');
  }
  return raw;
}

// Pre-generated cost 12 dummy hash to neutralize timing attacks (always takes ~80ms)
const DUMMY_HASH = '$2a$12$L7p7yTjFvFp2B9E4Qo.8heK1zY3k1p9L4h7Y2m3n5o6p7q8r9s0t.';

// In-Memory Adaptive Rate Limiter with Exponential Backoff
class LoginRateLimiter {
  constructor() {
    this.attempts = new Map();
    this.MAX_ATTEMPTS = 5;
    this.WINDOW_MS = 15 * 60 * 1000; // 15 minutes lockout window
  }

  _clean() {
    const nowTime = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (nowTime - record.firstFailedAt > this.WINDOW_MS) {
        this.attempts.delete(key);
      }
    }
  }

  getKey(ip, email) {
    return `${ip || '127.0.0.1'}:${String(email).trim().toLowerCase()}`;
  }

  check(ip, email) {
    this._clean();
    const key = this.getKey(ip, email);
    const record = this.attempts.get(key);
    if (!record) return;

    if (record.count >= this.MAX_ATTEMPTS) {
      const elapsed = Date.now() - record.firstFailedAt;
      if (elapsed < this.WINDOW_MS) {
        const remainingMinutes = Math.ceil((this.WINDOW_MS - elapsed) / 60000);
        throw AppError.tooManyRequests(
          `Bạn đã nhập sai mật khẩu quá 5 lần. Vì lý do an toàn, vui lòng thử lại sau ${remainingMinutes} phút.`,
          'TOO_MANY_FAILED_ATTEMPTS'
        );
      } else {
        this.attempts.delete(key);
      }
    }
  }

  async recordFailure(ip, email) {
    this._clean();
    const key = this.getKey(ip, email);
    const nowTime = Date.now();
    const record = this.attempts.get(key) || { count: 0, firstFailedAt: nowTime, lastFailedAt: nowTime };
    record.count += 1;
    record.lastFailedAt = nowTime;
    this.attempts.set(key, record);

    // Exponential backoff delay (slows down automated brute-force scripts)
    const delayMs = Math.min(2000, 300 * Math.pow(1.5, record.count - 1));
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  recordSuccess(ip, email) {
    const key = this.getKey(ip, email);
    this.attempts.delete(key);
  }
}

const loginLimiter = new LoginRateLimiter();

class AuthService {
  constructor(repository, organizationResolver) {
    this.users = repository;
    this.resolveOrganization = organizationResolver || (async () => null);
  }

  mapRole(email) {
    const normalized = email.toLowerCase();
    if (env.adminEmails.includes(normalized) || normalized.startsWith('admin')) {
      return { role: ROLES.ADMIN, organizationName: 'Ban Quản Trị Hệ Thống UEL Space' };
    }
    if (
      normalized.endsWith('@company.com') ||
      normalized.includes('host') ||
      normalized.includes('partner') ||
      normalized.includes('corp') ||
      normalized.includes('seller') ||
      ['techpark@gmail.com', 'innovate@gmail.com', 'landmark@gmail.com', 'uelhub@gmail.com', 'creative@gmail.com'].includes(normalized)
    ) {
      return { role: ROLES.SELLER, organizationName: 'Đơn Vị Sở Hữu Không Gian (Host Partner)' };
    }
    return { role: ROLES.BUYER, organizationName: 'Doanh Nghiệp & Khách Thuê (UEL Space Member)' };
  }

  buildCode(email, role) {
    const local = email.split('@')[0];
    if (role === ROLES.ADMIN) return 'ADMIN-001';
    if (role === ROLES.SELLER) return `SELLER-${local.toUpperCase()}`;
    return `BUYER-${local.toUpperCase()}`;
  }

  assertAllowedDomain(email) {
    // FlexSpace AI Marketplace: Mở tự do cho mọi email Google (Cá nhân, Doanh nghiệp)
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      throw new AppError(400, 'INVALID_EMAIL', 'Địa chỉ email không hợp lệ.');
    }
  }

  async resolveGoogleIdentity({ accessToken, idToken, email, name, picture, isDevMock }) {
    if (accessToken) {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) throw AppError.unauthorized('Phiên xác thực Google không hợp lệ hoặc đã hết hạn', 'GOOGLE_AUTH_FAILED');
      const payload = await response.json();
      return { email: (payload.email || '').trim().toLowerCase(), name: payload.name || '', picture: payload.picture || '' };
    }

    if (idToken) {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (!response.ok) throw AppError.unauthorized('Mã xác thực Google không hợp lệ hoặc đã hết hạn', 'GOOGLE_AUTH_FAILED');
      const payload = await response.json();
      return { email: (payload.email || '').trim().toLowerCase(), name: payload.name || '', picture: payload.picture || '' };
    }

    if (isDevMock && email) {
      return { email: String(email).trim().toLowerCase(), name: name || '', picture: picture || '' };
    }

    throw AppError.badRequest('Yêu cầu không hợp lệ: thiếu token hoặc thông tin xác thực Google', 'INVALID_AUTH_REQUEST');
  }

  async upsertFromIdentity(identity) {
    const { email, name, picture } = identity;
    this.assertAllowedDomain(email);

    let user = await this.users.findByEmail(email);
    const mapping = this.mapRole(email);

    if (!user) {
      const organization = await this.resolveOrganization(mapping.organizationName);
      user = {
        _id: newId(),
        code: this.buildCode(email, mapping.role),
        fullName: name || email.split('@')[0],
        email,
        role: mapping.role,
        avatar: picture || '',
        organizationId: organization ? organization._id : null,
        organization: mapping.organizationName,
        phoneNumber: '',
        authProvider: 'GOOGLE',
        status: 'ACTIVE',
        version: 1,
        createdAt: now(),
        updatedAt: now()
      };
      await this.users.insert(user);
      await writeAudit({
        actorId: user._id,
        action: 'USER_REGISTERED',
        entityName: 'User',
        entityId: user._id,
        changes: { email, role: user.role, provider: 'GOOGLE' }
      });
    } else {
      const patch = { updatedAt: now() };
      if (name && name !== user.fullName) patch.fullName = name;
      if (picture && picture !== user.avatar) patch.avatar = picture;
      user = await this.users.update(user._id, patch);
    }

    return user;
  }

  async googleLogin(payload) {
    const identity = await this.resolveGoogleIdentity(payload);
    const user = await this.upsertFromIdentity(identity);
    if (user.status === 'SUSPENDED') {
      throw AppError.forbidden('Tài khoản đã bị tạm khóa', 'ACCOUNT_SUSPENDED');
    }
    return user;
  }

  async register({ email, password, fullName, role }) {
    const normalized = requireString(email, 'email', { min: 3 }).toLowerCase();
    this.assertAllowedDomain(normalized);
    const existing = await this.users.findByEmail(normalized);
    if (existing) throw AppError.conflict('Email đã được đăng ký', 'EMAIL_EXISTS');

    // 1. Password Strength Policy (min 8 chars, uppercase, lowercase, digit)
    const validPassword = validatePasswordStrength(password);

    // 2. Hash with HMAC-SHA256 Pepper + Cost 12 Bcrypt
    const pepperedPassword = applyPepper(validPassword);
    const passwordHash = await bcrypt.hash(pepperedPassword, 12);

    const chosenRole = role && env.adminEmails.includes(normalized) ? ROLES.ADMIN : (this.mapRole(normalized).role);
    const organization = await this.resolveOrganization(this.mapRole(normalized).organizationName);

    const user = {
      _id: newId(),
      code: this.buildCode(normalized, chosenRole),
      fullName: requireString(fullName, 'fullName', { min: 2 }),
      email: normalized,
      role: chosenRole,
      avatar: '',
      organizationId: organization ? organization._id : null,
      organization: this.mapRole(normalized).organizationName,
      phoneNumber: '',
      passwordHash,
      authProvider: 'PASSWORD',
      status: 'ACTIVE',
      version: 1,
      createdAt: now(),
      updatedAt: now()
    };
    await this.users.insert(user);
    await writeAudit({ actorId: user._id, action: 'USER_REGISTERED', entityName: 'User', entityId: user._id, changes: { email: normalized, standard: 'HMAC_PEPPER_BCRYPT_12' } });
    return user;
  }

  async login({ email, password, ip }) {
    const normalized = requireString(email, 'email', { min: 3 }).toLowerCase();

    // 1. Brute-force & Credential Stuffing Protection (Adaptive Rate Limit)
    loginLimiter.check(ip, normalized);

    const user = await this.users.findByEmail(normalized);

    // 2. Constant-Time Timing Attack Mitigation:
    // If user doesn't exist or has no passwordHash (e.g. Google auth), still run dummy compare so elapsed time is constant (~80ms)
    if (!user || !user.passwordHash) {
      await bcrypt.compare(applyPepper(password || ''), DUMMY_HASH);
      await loginLimiter.recordFailure(ip, normalized);
      throw AppError.unauthorized('Email hoặc mật khẩu không đúng', 'INVALID_CREDENTIALS');
    }

    if (user.status === 'SUSPENDED') {
      throw AppError.forbidden('Tài khoản đã bị tạm khóa', 'ACCOUNT_SUSPENDED');
    }

    // 3. Modern Verification with HMAC-SHA256 Pepper
    let isValid = false;
    let needsRehash = false;

    try {
      isValid = await bcrypt.compare(applyPepper(password || ''), user.passwordHash);
    } catch (_) {
      isValid = false;
    }

    // 4. Backward Compatibility: If modern verification fails, test legacy unpeppered bcrypt
    if (!isValid) {
      try {
        const legacyValid = await bcrypt.compare(String(password || ''), user.passwordHash);
        if (legacyValid) {
          isValid = true;
          needsRehash = true; // Mark for automatic upgrade
        }
      } catch (_) {
        isValid = false;
      }
    }

    // 5. Handle failed authentication
    if (!isValid) {
      await loginLimiter.recordFailure(ip, normalized);
      await writeAudit({
        actorId: user._id,
        action: 'LOGIN_FAILED',
        entityName: 'User',
        entityId: user._id,
        changes: { email: normalized, ip }
      });
      throw AppError.unauthorized('Email hoặc mật khẩu không đúng', 'INVALID_CREDENTIALS');
    }

    // 6. Reset rate limiter upon successful login
    loginLimiter.recordSuccess(ip, normalized);

    // 7. Zero-Downtime Auto Re-hash (Upgrade legacy hash to HMAC Pepper + Cost 12)
    if (needsRehash) {
      const upgradedHash = await bcrypt.hash(applyPepper(password), 12);
      await this.users.update(user._id, { passwordHash: upgradedHash, updatedAt: now() });
      await writeAudit({
        actorId: user._id,
        action: 'PASSWORD_HASH_UPGRADED',
        entityName: 'User',
        entityId: user._id,
        changes: { email: normalized, standard: 'HMAC_SHA256_PEPPER_BCRYPT_12' }
      });
    }

    await writeAudit({
      actorId: user._id,
      action: 'LOGIN_SUCCESS',
      entityName: 'User',
      entityId: user._id,
      changes: { email: normalized, ip }
    });

    return user;
  }

  async me(userId) {
    const user = await this.users.findById(userId);
    if (!user) throw AppError.unauthorized('Phiên đăng nhập không còn hợp lệ');
    return user;
  }
}

module.exports = { AuthService };
