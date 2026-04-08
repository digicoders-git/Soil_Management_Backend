import SiteMachine from '../models/SiteMachine.js';
import Machine from '../models/Machine.js';
import Site from '../models/Site.js';
import Expense from '../models/Expense.js';

// @desc    Get all site machines
// @route   GET /api/site-machines
// @access  Private
export const getSitemachines = async (req, res) => {
  try {
    const { siteId } = req.query;
    let query = {};

    if (siteId) {
      query.siteId = siteId;
    }

    const sitemachines = await SiteMachine.find(query)
      .populate('siteId', 'name address')
      .populate('machineId', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sitemachines.length,
      data: sitemachines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Assign machine to site
// @route   POST /api/site-machines
// @access  Private (Admin only)
export const assignMachine = async (req, res) => {
  try {
    const { siteId, machineId, quantity } = req.body;

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
        message: 'Not authorized to assign machines to this site'
      });
    }

    // Check if machine exists and is available
    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    if (machine.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient machine quantity available'
      });
    }

    // Create site machine assignment
    const siteMachine = await SiteMachine.create({
      siteId,
      machineId,
      quantity
    });

    // Update machine status and quantity
    machine.quantity -= quantity;
    if (machine.quantity === 0) {
      machine.status = 'assigned';
    }
    await machine.save();

    await siteMachine.populate('siteId', 'name address');
    await siteMachine.populate('machineId', 'name code');

    res.status(201).json({
      success: true,
      data: siteMachine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Purchase machine locally
// @route   POST /api/site-machines/purchase
// @access  Private (User/Admin)
export const purchaseLocalMachine = async (req, res) => {
  try {
    const { siteId, name, code, cost, description } = req.body;

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    if (req.user.role === 'user' && site.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Ensure code is unique checking all machines
    const existing = await Machine.findOne({ code });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Machine code already exists' });
    }

    // 1. Create Machine
    const machine = await Machine.create({
      name,
      code,
      quantity: 1,
      adminId: site.adminId,
      status: 'assigned',
      description: description || ''
    });

    // 2. Create SiteMachine Assignment
    const siteMachine = await SiteMachine.create({
      siteId,
      machineId: machine._id,
      quantity: 1
    });

    // 3. Create Expense
    await Expense.create({
      siteId,
      userId: req.user.id,
      amount: cost,
      category: 'machine_purchase',
      description: `Purchased new machine: ${name} (${code})`
    });

    await siteMachine.populate('siteId', 'name address');
    await siteMachine.populate('machineId', 'name code');

    res.status(201).json({
      success: true,
      data: siteMachine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Return machine from site
// @route   PUT /api/site-machines/:id/return
// @access  Private (User/Admin)
export const returnMachine = async (req, res) => {
  try {
    const { status } = req.body; // 'returned' or 'damaged'

    const siteMachine = await SiteMachine.findById(req.params.id)
      .populate('siteId')
      .populate('machineId');

    if (!siteMachine) {
      return res.status(404).json({
        success: false,
        message: 'Site machine assignment not found'
      });
    }

    // Check authorization
    if (req.user.role === 'user' && (!siteMachine.siteId.userId || siteMachine.siteId.userId.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to return this machine'
      });
    }

    if (req.user.role === 'admin' && (!siteMachine.siteId.adminId || siteMachine.siteId.adminId.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to return this machine'
      });
    }

    // Update site machine status
    siteMachine.status = status || 'returned';
    siteMachine.returnedDate = new Date();
    await siteMachine.save();

    // Update machine availability
    const machine = await Machine.findById(siteMachine.machineId._id);
    if (status !== 'damaged') {
      machine.quantity += siteMachine.quantity;
      machine.status = 'available';
      await machine.save();
    }

    res.status(200).json({
      success: true,
      data: siteMachine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get site machine by ID
// @route   GET /api/site-machines/:id
// @access  Private
export const getSiteMachine = async (req, res) => {
  try {
    const siteMachine = await SiteMachine.findById(req.params.id)
      .populate('siteId', 'name address')
      .populate('machineId', 'name code');

    if (!siteMachine) {
      return res.status(404).json({
        success: false,
        message: 'Site machine assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: siteMachine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Transfer machine from one site to another
// @route   POST /api/site-machines/transfer
// @access  Private (Admin only)
export const transferMachine = async (req, res) => {
  try {
    const { fromSiteMachineId, toSiteId, quantityToTransfer } = req.body;

    // Validate inputs
    if (!fromSiteMachineId || !toSiteId || !quantityToTransfer) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const transferQty = Number(quantityToTransfer);
    if (transferQty <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }

    // Get the source assignment
    const sourceAssignment = await SiteMachine.findById(fromSiteMachineId).populate('siteId');
    if (!sourceAssignment || sourceAssignment.status !== 'assigned') {
      return res.status(404).json({ success: false, message: 'Source assignment not found or already returned' });
    }

    if (sourceAssignment.siteId._id.toString() === toSiteId) {
      return res.status(400).json({ success: false, message: 'Cannot transfer to the same site' });
    }

    if (sourceAssignment.quantity < transferQty) {
      return res.status(400).json({ success: false, message: 'Not enough quantity to transfer' });
    }

    // Ensure target site exists
    const Site = mongoose.model('Site');
    const targetSite = await Site.findById(toSiteId);
    if (!targetSite || targetSite.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Target site not found or not active' });
    }

    // Adjust quantities
    if (sourceAssignment.quantity === transferQty) {
      sourceAssignment.status = 'transferred';
      sourceAssignment.returnedDate = new Date();
    } else {
      sourceAssignment.quantity -= transferQty;
    }
    await sourceAssignment.save();

    // Create new assignment for target site
    // Check if machine is already assigned to target site
    let targetAssignment = await SiteMachine.findOne({
      siteId: toSiteId,
      machineId: sourceAssignment.machineId,
      status: 'assigned'
    });

    if (targetAssignment) {
      targetAssignment.quantity += transferQty;
      await targetAssignment.save();
    } else {
      targetAssignment = await SiteMachine.create({
        siteId: toSiteId,
        machineId: sourceAssignment.machineId,
        quantity: transferQty,
        status: 'assigned'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Machine transferred successfully',
      data: targetAssignment
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};