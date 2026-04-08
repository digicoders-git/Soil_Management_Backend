import User from '../models/User.js';
import { sendTokenResponse } from '../utils/jwt.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (for first superadmin) / Private (for others)
export const register = async (req, res) => {
  try {
    const { name, email, password, role, adminId, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      adminId,
      phone
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Validate mobile & password
    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide mobile and password'
      });
    }

    // Check for user
    const user = await User.findOne({ phone: mobile }).select('+password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account inactive'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};

// @desc    Create superadmin
// @route   POST /api/auth/create-superadmin
// @access  Secret key protected
export const createSuperAdmin = async (req, res) => {
  try {
    const { name, phone, password, secretKey } = req.body;

    if (secretKey !== process.env.SUPERADMIN_SECRET) {
      return res.status(403).json({ success: false, message: 'Invalid secret key' });
    }

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'name, phone aur password required hain' });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Is phone number se user already exists' });
    }

    const user = await User.create({ name, phone, password, role: 'superadmin', email: `${phone}@superadmin.com` });

    res.status(201).json({ success: true, message: 'Superadmin created successfully', data: { name: user.name, phone: user.phone, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
        success: false,
        message: 'User not found'
      });
    }

    const { name, email, phone, password } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (password) user.password = password;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};