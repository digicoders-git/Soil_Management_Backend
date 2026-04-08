import MachineCategory from '../models/MachineCategory.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await MachineCategory.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const existing = await MachineCategory.findOne({ name: req.body.name });
    if (existing) return res.status(400).json({ success: false, message: 'Category already exists' });
    const category = await MachineCategory.create({ name: req.body.name, adminId: req.user.id });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await MachineCategory.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await MachineCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
