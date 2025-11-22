const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const googleCallback = async (req, res, next) => {
  try {
    const { id, email, name, picture } = req.user;

    if (!id || !email) {
      return res.status(400).json({
        message: 'Google authentication failed: missing user data'
      });
    }

    let user = await User.findOne({ googleId: id });

    if (user) {
      if (name) user.name = name;
      if (picture) user.avatar = picture;
      await user.save();
    } else {
      user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        user.googleId = id;
        user.provider = user.password ? 'local' : 'google';
        if (name) user.name = name;
        if (picture) user.avatar = picture;
        await user.save();
      } else {
        user = await User.create({
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          googleId: id,
          avatar: picture || null,
          provider: 'google',
        });
      }
    }

    // Generate JWT token
    const token = generateToken({ id: user._id });

    // Set token cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // FRONTEND URL Handling
    let frontendUrl = process.env.FRONTEND_URL;

    // Debug logging — VERY important on Render
    console.log("➡ FRONTEND_URL from .env =", frontendUrl);

    if (!frontendUrl) {
      // In production, throw error instead of using localhost
      if (process.env.NODE_ENV === 'production') {
        console.error("❌ FRONTEND_URL is required in production environment");
        return res.status(500).json({
          message: 'Server configuration error: FRONTEND_URL not set',
          error: 'Please configure FRONTEND_URL environment variable'
        });
      }
      // Only use localhost fallback in development
      console.warn("⚠ FRONTEND_URL NOT FOUND — using localhost fallback (dev only)");
      frontendUrl = "http://localhost:5173";
    }

    // Remove trailing slash to avoid "//?token="
    frontendUrl = frontendUrl.replace(/\/$/, "");

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider,
      monthlyIncome: user.monthlyIncome,
      savingsGoal: user.savingsGoal,
    };

    const redirectUrl = `${frontendUrl}/?token=${token}&googleAuth=true&user=${encodeURIComponent(JSON.stringify(userData))}`;

    console.log("➡ Redirecting to:", redirectUrl);

    res.redirect(redirectUrl);

  } catch (error) {
    console.error("Google OAuth callback error:", error);
    next(error);
  }
};

const googleFailure = (req, res) => {
  res.status(401).json({
    message: 'Google authentication failed. Please try again.',
    error: req.query.error || 'Unknown error',
  });
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  googleCallback,
  googleFailure,
  logout,
};
