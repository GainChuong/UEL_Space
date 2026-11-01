const bcrypt = require('bcryptjs');
const { env } = require('../../config/env');
const { AppError } = require('../../common/app-error');
const { newId, now } = require('../../common/id');
const { ROLES } = require('../../common/constants');
const { publicUser } = require('../../common/presenters');
const { writeAudit } = require('../../common/audit');
const { requireString } = require('../../common/validate');

const ALLOWED_DOMAIN_REGEX = /@(st\.)?uel\.edu\.vn$/i;

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

    const chosenRole = role && env.adminEmails.includes(normalized) ? ROLES.ADMIN : (this.mapRole(normalized).role);
    const passwordHash = await bcrypt.hash(requireString(password, 'password', { min: 6 }), 10);
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
    await writeAudit({ actorId: user._id, action: 'USER_REGISTERED', entityName: 'User', entityId: user._id, changes: { email: normalized } });
    return user;
  }

  async login({ email, password }) {
    const normalized = requireString(email, 'email', { min: 3 }).toLowerCase();
    const user = await this.users.findByEmail(normalized);
    if (!user || !user.passwordHash) throw AppError.unauthorized('Email hoặc mật khẩu không đúng', 'INVALID_CREDENTIALS');
    if (user.status === 'SUSPENDED') throw AppError.forbidden('Tài khoản đã bị tạm khóa', 'ACCOUNT_SUSPENDED');
    const ok = await bcrypt.compare(String(password || ''), user.passwordHash);
    if (!ok) throw AppError.unauthorized('Email hoặc mật khẩu không đúng', 'INVALID_CREDENTIALS');
    return user;
  }

  async me(userId) {
    const user = await this.users.findById(userId);
    if (!user) throw AppError.unauthorized('Phiên đăng nhập không còn hợp lệ');
    return user;
  }
}

module.exports = { AuthService };
