import Installment from '../models/Installment.js';
import Site from '../models/Site.js';
import mongoose from 'mongoose';

// @desc    Get all installments
// @route   GET /api/installments
// @access  Private
export const getInstallments = async (req, res) => {
  try {
    const { siteId } = req.query;
    let query = {};

    if (siteId) {
      query.siteId = siteId;
    }

    // Filter based on user role
    if (req.user.role === 'admin') {
      const sites = await Site.find({ adminId: req.user.id }).select('_id');
      const siteIds = sites.map(s => s._id);
      query.siteId = { $in: siteIds };
    } else if (req.user.role === 'user') {
      query.receivedBy = req.user.id;
    }

    const installments = await Installment.find(query)
      .populate('siteId', 'name address')
      .populate('givenBy', 'name email')
      .populate('receivedBy', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: installments.length,
      data: installments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single installment
// @route   GET /api/installments/:id
// @access  Private
export const getInstallment = async (req, res) => {
  try {
    const installment = await Installment.findById(req.params.id)
      .populate('siteId', 'name address')
      .populate('givenBy', 'name email')
      .populate('receivedBy', 'name email');

    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: installment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create installment
// @route   POST /api/installments
// @access  Private (Admin only)
export const createInstallment = async (req, res) => {
  try {
    const { siteId, amount, receivedBy, note, date } = req.body;

    // Check if site exists and belongs to admin
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    if (req.user.role === 'admin' && site.adminId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create installment for this site'
      });
    }

    const installment = await Installment.create({
      siteId,
      amount,
      givenBy: req.user.id,
      receivedBy,
      note,
      date: date || new Date()
    });

    await installment.populate('siteId', 'name address');
    await installment.populate('givenBy', 'name email');
    await installment.populate('receivedBy', 'name email');

    if (site.status === 'created' || site.status === 'machines_assigned' || site.status === 'supervisor_assigned') {
      site.status = 'active';
      await site.save();
    }

    res.status(201).json({
      success: true,
      data: installment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update installment
// @route   PUT /api/installments/:id
// @access  Private (Admin only)
export const updateInstallment = async (req, res) => {
  try {
    const { amount, note, date } = req.body;

    let installment = await Installment.findById(req.params.id);

    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    // Check if user is the one who gave the installment
    if (installment.givenBy.toString() !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this installment'
      });
    }

    installment = await Installment.findByIdAndUpdate(
      req.params.id,
      {
        amount: amount || installment.amount,
        note: note || installment.note,
        date: date || installment.date
      },
      { new: true, runValidators: true }
    ).populate('siteId', 'name address')
      .populate('givenBy', 'name email')
      .populate('receivedBy', 'name email');

    res.status(200).json({
      success: true,
      data: installment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete installment
// @route   DELETE /api/installments/:id
// @access  Private (Admin only)
export const deleteInstallment = async (req, res) => {
  try {
    const installment = await Installment.findById(req.params.id);

    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    // Check if user is the one who gave the installment
    if (installment.givenBy.toString() !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this installment'
      });
    }

    await Installment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Installment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get installment summary for a site
// @route   GET /api/installments/summary/:siteId
// @access  Private
export const getInstallmentSummary = async (req, res) => {
  try {
    const { siteId } = req.params;

    const summary = await Installment.aggregate([
      { $match: { siteId: mongoose.Types.ObjectId(siteId) } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: summary[0] || { totalAmount: 0, count: 0 }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};