import Machine from '../models/Machine.js';
import User from '../models/User.js';

// @desc    Get all machines
// @route   GET /api/machines
// @access  Private
export const getmachines = async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'admin') {
      query.adminId = req.user.id;
    } else if (req.user.role === 'user') {
      // Users can see machines from their admin
      const user = await User.findById(req.user.id);
      query.adminId = user.adminId;
    }

    const machines = await Machine.find(query)
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: machines.length,
      data: machines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single machine
// @route   GET /api/machines/:id
// @access  Private
export const getMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id)
      .populate('adminId', 'name email');

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    res.status(200).json({
      success: true,
      data: machine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create machine
// @route   POST /api/machines
// @access  Private (Admin only)
export const createMachine = async (req, res) => {
  try {
    const { name, code, quantity, description } = req.body;

    const machine = await Machine.create({
      name,
      code,
      quantity,
      description,
      adminId: req.user.id
    });

    await machine.populate('adminId', 'name email');

    res.status(201).json({
      success: true,
      data: machine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update machine
// @route   PUT /api/machines/:id
// @access  Private (Admin only)
export const updateMachine = async (req, res) => {
  try {
    const { name, code, quantity, status, description } = req.body;

    let machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    // Check ownership for admin
    if (req.user.role === 'admin' && machine.adminId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this machine'
      });
    }

    machine = await Machine.findByIdAndUpdate(
      req.params.id,
      {
        name: name || machine.name,
        code: code || machine.code,
        quantity: quantity || machine.quantity,
        status: status || machine.status,
        description: description || machine.description
      },
      { new: true, runValidators: true }
    ).populate('adminId', 'name email');

    res.status(200).json({
      success: true,
      data: machine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete machine
// @route   DELETE /api/machines/:id
// @access  Private (Admin only)
export const deleteMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    // Check ownership for admin
    if (req.user.role === 'admin' && machine.adminId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this machine'
      });
    }

    await Machine.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Machine deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};