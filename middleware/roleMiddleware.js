export const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

export const checkPermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    if (req.user.role === 'superadmin' || req.user.role === 'admin') {
      return next();
    }

    if (req.user.role === 'user') {
      const permissions = req.user.permissions;
      const modulePerms = permissions instanceof Map ? permissions.get(module) : permissions?.[module];
      
      if (modulePerms && modulePerms[action]) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. You do not have permission to ${action} ${module}.`
    });
  };
};