import Expense from '../models/Expense.js';
import Site from '../models/Site.js';
import mongoose from 'mongoose';

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const { siteId, category, startDate, endDate } = req.query;
    let query = {};

    if (siteId) {
      query.siteId = siteId;
    }

    if (category) {
      query.category = category;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Filter based on user role
    if (req.user.role === 'admin') {
      const sites = await Site.find({ adminId: req.user.id }).select('_id');
      const siteIds = sites.map(s => s._id);
      query.siteId = { $in: siteIds };
    } else if (req.user.role === 'user') {
      query.userId = req.user.id;
    }

    const expenses = await Expense.find(query)
      .populate('siteId', 'name address')
      .populate('userId', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
export const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('siteId', 'name address')
      .populate('userId', 'name email');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create expense
// @route   POST /api/expenses
// @access  Private (User/Admin)
export const createExpense = async (req, res) => {
  try {
    const { siteId, amount, category, description, date } = req.body;

    // Check if site exists
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Check authorization
    if (req.user.role === 'user' && site.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add expense to this site'
      });
    }

    if (req.user.role === 'admin' && site.adminId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add expense to this site'
      });
    }

    const expense = await Expense.create({
      siteId,
      userId: req.user.id,
      amount,
      category,
      description,
      date: date || new Date()
    });

    await expense.populate('siteId', 'name address');
    await expense.populate('userId', 'name email');

    if (site.status !== 'completed' && site.status !== 'cancelled' && site.status !== 'in_progress') {
      site.status = 'in_progress';
      await site.save();
    }

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private (User who created it/Admin)
export const updateExpense = async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;

    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user is the one who created the expense
    if (expense.userId.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this expense'
      });
    }

    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        amount: amount || expense.amount,
        category: category || expense.category,
        description: description || expense.description,
        date: date || expense.date
      },
      { new: true, runValidators: true }
    ).populate('siteId', 'name address')
      .populate('userId', 'name email');

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private (User who created it/Admin)
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user is the one who created the expense
    if (expense.userId.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense'
      });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get expense summary for a site
// @route   GET /api/expenses/summary/:siteId
// @access  Private
export const getExpenseSummary = async (req, res) => {
  try {
    const { siteId } = req.params;

    const summary = await Expense.aggregate([
      { $match: { siteId: mongoose.Types.ObjectId(siteId) } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const totalSummary = await Expense.aggregate([
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
      data: {
        byCategory: summary,
        total: totalSummary[0] || { totalAmount: 0, count: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};