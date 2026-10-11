function publicUser(user, { organizationName } = {}) {
  if (!user) return null;
  return {
    id: user._id,
    code: user.code || '',
    name: user.fullName || user.name || '',
    email: user.email,
    role: user.role,
    avatar: user.avatar || '',
    organization: organizationName || user.organization || '',
    organizationId: user.organizationId || null,
    status: user.status || 'ACTIVE',
    phone: user.phoneNumber || '',
    createdAt: user.createdAt
  };
}

module.exports = { publicUser };
