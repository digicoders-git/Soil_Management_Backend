import MachineReport from '../models/MachineReport.js';
import Site from '../models/Site.js';
import MachineUnit from '../models/MachineUnit.js';

// @desc    Get all machine reports
// @route   GET /api/reports
// @access  Private
export const getMachineReports = async (req, res) => {
  try {
    const { siteId, machineUnitId, status } = req.query;
    let query = {};

    if (siteId) {
      query.siteId = siteId;
    }

    if (machineUnitId) {
      query.machineUnitId = machineUnitId;
    }

    if (status) {
      query.status = status;
    }

    // Filter based on user role
    if (req.user.role === 'admin') {
      const sites = await Site.find({ adminId: req.user.id }).select('_id');
      const siteIds = sites.map(s => s._id);
      query.siteId = { $in: [siteId, ...siteIds].filter(id => id) };
      if (siteId && !siteIds.map(id => id.toString()).includes(siteId)) {
        return res.status(403).json({ success: false, message: 'Not authorized for this site' });
      }
    } else if (req.user.role === 'user') {
      query.reportedBy = req.user.id;
    }

    const reports = await MachineReport.find(query)
      .populate('siteId', 'name address')
      .populate({
        path: 'machineUnitId',
        populate: { path: 'machineTypeId', select: 'name' }
      })
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single machine report
// @route   GET /api/reports/:id
// @access  Private
export const getMachineReport = async (req, res) => {
  try {
    const report = await MachineReport.findById(req.params.id)
      .populate('siteId', 'name address')
      .populate({
        path: 'machineUnitId',
        populate: { path: 'machineTypeId' }
      })
      .populate('reportedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Machine report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create machine report
// @route   POST /api/reports
// @access  Private (User/Admin)
export const createMachineReport = async (req, res) => {
  try {
    const { siteId, machineUnitId, issue, repairCost, estimatedCost } = req.body;

    // Check if site exists
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Check if machine unit exists
    const unit = await MachineUnit.findById(machineUnitId);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Machine unit not found'
      });
    }

    // Check authorization
    if (req.user.role === 'user' && site.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to report issues for this site'
      });
    }

    if (req.user.role === 'admin' && site.adminId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to report issues for this site'
      });
    }

    // Update machine unit condition
    unit.condition = 'damaged';
    await unit.save();

    const report = await MachineReport.create({
      siteId,
      machineUnitId,
      reportedBy: req.user.id,
      issue,
      estimatedCost: estimatedCost || 0,
      repairCost: repairCost || 0
    });

    await report.populate('siteId', 'name address');
    await report.populate({ path: 'machineUnitId', populate: { path: 'machineTypeId' } });
    await report.populate('reportedBy', 'name email');

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update machine report
// @route   PUT /api/reports/:id
// @access  Private (Admin/SuperAdmin)
export const updateMachineReport = async (req, res) => {
  try {
    const { issue, repairCost, estimatedCost, status } = req.body;

    let report = await MachineReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Machine report not found'
      });
    }

    // Check authorization for user
    if (req.user.role === 'user' && report.reportedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report'
      });
    }

    report = await MachineReport.findByIdAndUpdate(
      req.params.id,
      {
        issue: issue || report.issue,
        estimatedCost: estimatedCost !== undefined ? estimatedCost : report.estimatedCost,
        repairCost: repairCost !== undefined ? repairCost : report.repairCost,
        status: status || report.status
      },
      { new: true, runValidators: true }
    ).populate('siteId', 'name address')
      .populate({ path: 'machineUnitId', populate: { path: 'machineTypeId' } })
      .populate('reportedBy', 'name email');

    if (status === 'fixed' || status === 'dead') {
      const unit = await MachineUnit.findById(report.machineUnitId);
      if (unit) {
        if (status === 'fixed') {
          unit.condition = 'good';
          unit.status = 'assigned'; // Assuming it's still at the site
          unit.lastMaintenanceDate = new Date();
        } else if (status === 'dead') {
          unit.condition = 'damaged';
          unit.status = 'available'; // Dead machine disconnected from site, manual handle
          unit.currentSiteId = null;
        }
        await unit.save();
      }
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete machine report
// @route   DELETE /api/reports/:id
// @access  Private (Admin/SuperAdmin)
export const deleteMachineReport = async (req, res) => {
  try {
    const report = await MachineReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Machine report not found'
      });
    }

    await MachineReport.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Machine report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};