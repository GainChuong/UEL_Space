const { publicUser } = require('../../common/presenters');
const { AppError } = require('../../common/app-error');

class AuthController {
  constructor(service) {
    this.service = service;
  }

  setSession(req, user) {
    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.fullName,
      organization: user.organization || '',
      avatar: user.avatar || ''
    };
  }

  googleLogin = async (req, res) => {
    const user = await this.service.googleLogin(req.body || {});
    this.setSession(req, user);
    res.json({
      success: true,
      message: 'Đăng nhập Google thành công!',
      user: publicUser(user),
      token: `uel-session-${Buffer.from(`${user.email}:${Date.now()}`).toString('base64')}`
    });
  };

  register = async (req, res) => {
    const user = await this.service.register(req.body || {});
    this.setSession(req, user);
    res.status(201).json({ success: true, message: 'Đăng ký thành công', user: publicUser(user) });
  };

  login = async (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';
    const user = await this.service.login({ ...(req.body || {}), ip });
    this.setSession(req, user);
    res.json({ success: true, message: 'Đăng nhập thành công', user: publicUser(user) });
  };

  me = async (req, res) => {
    if (!req.session || !req.session.user) throw AppError.unauthorized('Chưa đăng nhập');
    const user = await this.service.me(req.session.user.id);
    res.json({ success: true, user: publicUser(user) });
  };

  logout = async (req, res) => {
    if (req.session) {
      req.session.destroy(() => {
        res.clearCookie('sid');
        res.status(204).end();
      });
      return;
    }
    res.status(204).end();
  };
}

module.exports = { AuthController };
