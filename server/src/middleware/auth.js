const jwt = require('jsonwebtoken');
const prisma = require('../db');

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not defined in production');
    }
    const decoded = jwt.verify(token, jwtSecret || 'dev-secret-key');

    // Check if user is still active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActive: true }
    });

    if (!user || !user.isActive) {
      res.clearCookie('token');
      return res.status(401).json({ message: 'User account is inactive or not found' });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ message: `Access denied. Requires one of: ${allowedRoles.join(', ')}` });
    }
    next();
  };
};

module.exports = { authMiddleware, adminMiddleware, checkRole };
