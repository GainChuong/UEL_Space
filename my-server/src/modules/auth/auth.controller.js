const { publicUser } = require('../../common/presenters');
const { AppError } = require('../../common/app-error');
const { signJwt } = require('../../common/jwt');
const { extractUserFromRequest } = require('../../middleware/require-auth');

class AuthController {
  constructor(service) {
    this.service = service;
  }

  issueToken(user) {
    return signJwt({
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.fullName,
      organization: user.organization || ''
    });
  }

  googleLogin = async (req, res) => {
    const user = await this.service.googleLogin(req.body || {});
    const token = this.issueToken(user);
    res.json({
      success: true,
      message: 'Đăng nhập Google thành công!',
      user: publicUser(user),
      token
    });
  };

  register = async (req, res) => {
    const user = await this.service.register(req.body || {});
    const token = this.issueToken(user);
    res.status(201).json({ success: true, message: 'Đăng ký thành công', user: publicUser(user), token });
  };

  login = async (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';
    const user = await this.service.login({ ...(req.body || {}), ip });
    const token = this.issueToken(user);
    res.json({ success: true, message: 'Đăng nhập thành công', user: publicUser(user), token });
  };

  me = async (req, res) => {
    const current = extractUserFromRequest(req);
    if (!current || !current.id) throw AppError.unauthorized('Chưa đăng nhập hoặc JWT không hợp lệ');
    const user = await this.service.me(current.id);
    res.json({ success: true, user: publicUser(user) });
  };

  logout = async (_req, res) => {
    res.status(204).end();
  };
}

module.exports = { AuthController };
