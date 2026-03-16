const ROLE_ADMIN = 'Admin';
const ROLE_SUBJECT_TEACHER = 'Subject Teacher';
const ROLE_HOMEROOM_TEACHER = 'Homeroom Teacher';

function requireAuth(req, res, next) {
  if (req.session?.user) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (roles.length > 0 && !roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}

module.exports = {
  ROLE_ADMIN,
  ROLE_SUBJECT_TEACHER,
  ROLE_HOMEROOM_TEACHER,
  requireAuth,
  requireRole
};
