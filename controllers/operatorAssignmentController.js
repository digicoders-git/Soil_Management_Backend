import OperatorAssignment from '../models/OperatorAssignment.js';
import Site from '../models/Site.js';

// GET /api/operator-assignments?siteId=xxx
export const getAssignments = async (req, res) => {
  try {
    const { siteId } = req.query;
    const query = siteId ? { siteId } : {};

    const assignments = await OperatorAssignment.find(query)
      .populate('operatorId', 'name')
      .populate('siteId', 'name')
      .populate('machineUnitId', 'serialNumber machineTypeId')
      .sort({ startDate: -1 });

    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/operator-assignments
export const createAssignment = async (req, res) => {
  try {
    const { operatorId, siteId, startDate, endDate } = req.body;

    const site = await Site.findById(siteId);
    if (!site) return res.status(404).json({ success: false, message: 'Site not found' });

    if (req.user.role === 'admin' && site.adminId.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    if (req.user.role === 'user') {
      const isIncharge = site.userId.map(u => u.toString()).includes(req.user.id);
      if (!isIncharge) return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const assignment = await OperatorAssignment.create({
      operatorId,
      siteId,
      startDate,
      endDate: endDate || null,
      adminId: req.user.id
    });

    await assignment.populate('operatorId', 'name');
    await assignment.populate('siteId', 'name');

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/operator-assignments/:id
export const updateAssignment = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const assignment = await OperatorAssignment.findByIdAndUpdate(
      req.params.id,
      { startDate, endDate },
      { new: true, runValidators: true }
    ).populate('operatorId', 'name').populate('siteId', 'name');

    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/operator-assignments/:id
export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await OperatorAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
