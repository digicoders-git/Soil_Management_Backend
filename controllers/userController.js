import User from '../models/User.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (SuperAdmin/Admin)
export const getUsers = async (req, res) => {
  try {
    let query = {};

    // If admin, only show their supervisors
    if (req.user.role === 'admin') {
      query = { adminId: req.user.id, role: 'user' };
    }

    // If superadmin, show all users
    if (req.user.role === 'superadmin') {
      query = {};
    }

    const users = await User.find(query)
      .select('-password')
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('adminId', 'name email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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

// @desc    Create user
// @route   POST /api/users
// @access  Private (SuperAdmin can create Admin, Admin can create User)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Role validation
    if (req.user.role === 'admin' && role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Admin can only create users with role "user"'
      });
    }

    if (req.user.role === 'superadmin' && !['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const userData = {
      name,
      email,
      password,
      role,
      phone,
      permissions: req.body.permissions || []
    };

    // Set adminId
    if (req.user.role === 'superadmin' && req.body.adminId) {
      userData.adminId = req.body.adminId;
    } else if (req.user.role === 'admin' && role === 'user') {
      userData.adminId = req.user.id;
    }

    const user = await User.create(userData);

    res.status(201).json({
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

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, isActive, password } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    if (password) user.password = password;

    if (req.user.role === 'superadmin' && req.body.adminId) {
      user.adminId = req.body.adminId;
    }

    if (req.user.role === 'superadmin' && req.body.permissions !== undefined) {
      user.permissions = req.body.permissions;
    }

    if (typeof isActive !== 'undefined') {
      user.isActive = isActive;
    }

    await user.save();

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

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (SuperAdmin/Admin)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};