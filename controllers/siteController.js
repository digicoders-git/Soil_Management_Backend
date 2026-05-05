import Site from '../models/Site.js';
import User from '../models/User.js';
import OperatorAssignment from '../models/OperatorAssignment.js';

// @desc    Get all sites
// @route   GET /api/sites
// @access  Private
export const getSites = async (req, res) => {
  try {
    let query = {};

    // Filter based on user role
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      if (req.query.userId) {
        query.userId = { $in: [req.query.userId] };
      } else if (req.user.role === 'admin') {
        const superAdmins = await User.find({ role: 'superadmin' }).select('_id');
        const superAdminIds = superAdmins.map(sa => sa._id);
        query.$or = [
          { adminId: req.user.id },
          { adminId: { $in: superAdminIds } }
        ];
      }
    } else if (req.user.role === 'user') {
      query.userId = { $in: [req.user.id] };
    }

    const sites = await Site.find(query)
      .populate('adminId', 'name email')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    const sitesWithOperators = await Promise.all(sites.map(async (site) => {
      const assignments = await OperatorAssignment.find({ siteId: site._id }).populate('operatorId', 'name');
      const operators = [...new Set(assignments.map(a => a.operatorId?.name).filter(Boolean))];
      return {
        ...site.toObject(),
        operators: operators.join(', ')
      };
    }));

    res.status(200).json({
      success: true,
      count: sitesWithOperators.length,
      data: sitesWithOperators
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single site
// @route   GET /api/sites/:id
// @access  Private
export const getSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id)
      .populate('adminId', 'name email')
      .populate('userId', 'name email phone');

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    res.status(200).json({
      success: true,
      data: site
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create site
// @route   POST /api/sites
// @access  Private (Admin only)
export const createSite = async (req, res) => {
  try {
    const { name, address, estimatedCost, userId, notes } = req.body;

    const site = await Site.create({
      name,
      address,
      estimatedCost,
      adminId: req.user.id,
      userId,
      notes
    });

    await site.populate('adminId', 'name email');
    await site.populate('userId', 'name email phone');

    res.status(201).json({
      success: true,
      data: site
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update site
// @route   PUT /api/sites/:id
// @access  Private (Admin or assigned User)
export const updateSite = async (req, res) => {
  try {
    const { name, address, estimatedCost, userId, status, endDate, notes } = req.body;

    let site = await Site.findById(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Check authorization
    if (req.user.role === 'admin' && site.adminId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this site'
      });
    }

    // Allow user to update only status to completed
    if (req.user.role === 'user') {
      const isIncharge = site.userId.map(u => u.toString()).includes(req.user.id);
      if (!isIncharge) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this site'
        });
      }
      if (status && status !== 'completed') {
        return res.status(403).json({
          success: false,
          message: 'Users can only mark site as completed'
        });
      }
    }

    const updateData = {};
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      updateData.name = name || site.name;
      updateData.address = address || site.address;
      updateData.estimatedCost = estimatedCost || site.estimatedCost;

      if (status) {
        updateData.status = status;
      } else {
        updateData.status = site.status;
      }

      updateData.endDate = endDate || site.endDate;
      updateData.notes = notes !== undefined ? notes : site.notes;
    } else if (req.user.role === 'user') {
      if (status) updateData.status = status;
    }

    site = await Site.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('adminId', 'name email')
      .populate('userId', 'name email phone');

    res.status(200).json({
      success: true,
      data: site
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add site incharge
// @route   POST /api/sites/:id/incharge
// @access  Private (Admin only)
export const addSiteIncharge = async (req, res) => {
  try {
    const { userId } = req.body;
    const site = await Site.findById(req.params.id);

    if (!site) return res.status(404).json({ success: false, message: 'Site not found' });
    if (req.user.role === 'admin' && site.adminId.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    if (site.userId.map(u => u.toString()).includes(userId))
      return res.status(400).json({ success: false, message: 'User already assigned as incharge' });

    site.userId.push(userId);
    if (['created', 'machines_assigned'].includes(site.status)) site.status = 'supervisor_assigned';
    await site.save();

    // Supervisor ki saari assigned machines ko is site par auto-assign karo
    const MachineUnit = (await import('../models/MachineUnit.js')).default;
    await MachineUnit.updateMany(
      { assignedUserId: userId, status: 'assigned' },
      { currentSiteId: site._id }
    );

    await site.populate('userId', 'name email phone');
    await site.populate('adminId', 'name email');

    res.status(200).json({ success: true, data: site });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove site incharge
// @route   DELETE /api/sites/:id/incharge/:userId
// @access  Private (Admin only)
export const removeSiteIncharge = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);

    if (!site) return res.status(404).json({ success: false, message: 'Site not found' });
    if (req.user.role === 'admin' && site.adminId.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    site.userId = site.userId.filter(u => u.toString() !== req.params.userId);
    await site.save();

    // Supervisor ki saari machines ka currentSiteId clear karo
    const MachineUnit = (await import('../models/MachineUnit.js')).default;
    await MachineUnit.updateMany(
      { assignedUserId: req.params.userId, currentSiteId: req.params.id },
      { currentSiteId: null }
    );

    await site.populate('userId', 'name email phone');
    await site.populate('adminId', 'name email');

    res.status(200).json({ success: true, data: site });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete site
// @route   DELETE /api/sites/:id
// @access  Private (Admin only)
export const deleteSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Check ownership for admin
    if (req.user.role === 'admin' && site.adminId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this site'
      });
    }

    await Site.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Site deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};