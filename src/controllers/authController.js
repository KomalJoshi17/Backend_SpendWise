const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const axios = require("axios");

const signup = async (req, res, next) => {
  try {
    const { name, email, password, captchaToken } = req.body;

    if (!name || !email || !password || !captchaToken) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if RECAPTCHA_SECRET is configured
    if (!process.env.RECAPTCHA_SECRET) {
      console.error("❌ RECAPTCHA_SECRET is not set in environment variables");
      return res.status(500).json({
        message: "Server configuration error: reCAPTCHA secret key not configured"
      });
    }

    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET);
    params.append("response", captchaToken);

    const captchaRes = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    console.log("DEBUG captchaRes.data =", captchaRes.data);

    if (!captchaRes.data.success) {
      const errorCodes = captchaRes.data["error-codes"] || [];
      console.error("reCAPTCHA validation failed:", errorCodes);
      
      return res.status(400).json({
        message: "Captcha validation failed",
        detail: captchaRes.data["error-codes"]?.join(", ") || "Unknown error"
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken({ id: user._id });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        monthlyIncome: user.monthlyIncome,
        savingsGoal: user.savingsGoal
      },
      token
    });

  } catch (error) {
    console.error("Signup error:", error);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({ id: user._id });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        monthlyIncome: user.monthlyIncome,
        savingsGoal: user.savingsGoal
      },
      token
    });

  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};

module.exports = { signup, login };
