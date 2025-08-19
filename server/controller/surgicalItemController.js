import SurgicalItem from '../model/SurgicalItem.js'; // Adjust path to your model
import mongoose from 'mongoose';

// @desc    Get all surgical items
// @route   GET /api/inventory/surgical-items
// @access  Private (Admin/Staff)
export const getAllSurgicalItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
      lowStock = false
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$quantity', '$minStockLevel'] };
    }
    
    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'supplier.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const items = await SurgicalItem.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('usageHistory.usedBy', 'name');

    // Get total count for pagination
    const totalItems = await SurgicalItem.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Get summary statistics
    const stats = await SurgicalItem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          lowStockItems: {
            $sum: {
              $cond: [{ $lte: ['$quantity', '$minStockLevel'] }, 1, 0]
            }
          },
          outOfStockItems: {
            $sum: {
              $cond: [{ $eq: ['$quantity', 0] }, 1, 0]
            }
          },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        stats: stats[0] || {
          totalItems: 0,
          totalQuantity: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          totalValue: 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching surgical items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch surgical items',
      error: error.message
    });
  }
};

// @desc    Get single surgical item
// @route   GET /api/inventory/surgical-items/:id
// @access  Private (Admin/Staff)
export const getSurgicalItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format'
      });
    }

    const item = await SurgicalItem.findById(id);

    if (!item || !item.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Surgical item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });

  } catch (error) {
    console.error('❌ Error fetching surgical item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch surgical item',
      error: error.message
    });
  }
};

// @desc    Create new surgical item
// @route   POST /api/inventory/surgical-items
// @access  Private (Admin/Staff)
export const createSurgicalItem = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      quantity,
      minStockLevel,
      price,
      supplier,
      location,
      expiryDate,
      batchNumber,
      serialNumber
    } = req.body;

    // Check if item with same name and supplier already exists
    const existingItem = await SurgicalItem.findOne({
      name: name,
      'supplier.name': supplier.name,
      isActive: true
    });

    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: 'Item with this name and supplier already exists'
      });
    }

    const newItem = new SurgicalItem({
      name,
      category,
      description,
      quantity,
      minStockLevel,
      price,
      supplier,
      location,
      expiryDate,
      batchNumber,
      serialNumber
    });

    const savedItem = await newItem.save();

    res.status(201).json({
      success: true,
      message: 'Surgical item created successfully',
      data: savedItem
    });

  } catch (error) {
    console.error('❌ Error creating surgical item:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create surgical item',
      error: error.message
    });
  }
};

// @desc    Update surgical item
// @route   PUT /api/inventory/surgical-items/:id
// @access  Private (Admin/Staff)
export const updateSurgicalItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format'
      });
    }

    const existingItem = await SurgicalItem.findById(id);
    if (!existingItem || !existingItem.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Surgical item not found'
      });
    }

    // Don't allow direct status updates - it should be calculated
    const updateData = { ...req.body };
    delete updateData.status;

    const updatedItem = await SurgicalItem.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    );

    res.status(200).json({
      success: true,
      message: 'Surgical item updated successfully',
      data: updatedItem
    });

  } catch (error) {
    console.error('❌ Error updating surgical item:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update surgical item',
      error: error.message
    });
  }
};

// @desc    Delete surgical item (soft delete)
// @route   DELETE /api/inventory/surgical-items/:id
// @access  Private (Admin only)
export const deleteSurgicalItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format'
      });
    }

    const item = await SurgicalItem.findById(id);
    if (!item || !item.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Surgical item not found'
      });
    }

    // Soft delete
    item.isActive = false;
    await item.save();

    res.status(200).json({
      success: true,
      message: 'Surgical item deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting surgical item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete surgical item',
      error: error.message
    });
  }
};

// @desc    Update stock quantity (restock/usage)
// @route   POST /api/inventory/surgical-items/:id/update-stock
// @access  Private (Admin/Staff)
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityChange, type, usedBy, purpose } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format'
      });
    }

    if (!quantityChange || !type || !['restock', 'usage'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stock update data'
      });
    }

    const item = await SurgicalItem.findById(id);
    if (!item || !item.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Surgical item not found'
      });
    }

    if (type === 'restock') {
      item.quantity += Math.abs(quantityChange);
      item.lastRestocked = new Date();
    } else if (type === 'usage') {
      const usageQuantity = Math.abs(quantityChange);
      
      if (item.quantity < usageQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock for this usage'
        });
      }

      item.quantity -= usageQuantity;
      
      // Add to usage history
      item.usageHistory.push({
        quantityUsed: usageQuantity,
        usedBy: usedBy || 'Unknown',
        purpose: purpose || 'Not specified'
      });
    }

    await item.save();

    res.status(200).json({
      success: true,
      message: `Stock ${type} updated successfully`,
      data: {
        item: item,
        previousQuantity: type === 'restock' 
          ? item.quantity - quantityChange 
          : item.quantity + quantityChange,
        newQuantity: item.quantity
      }
    });

  } catch (error) {
    console.error('❌ Error updating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
};

// @desc    Get inventory dashboard stats
// @route   GET /api/inventory/dashboard-stats
// @access  Private (Admin/Staff)
export const getDashboardStats = async (req, res) => {
  try {
    // Get comprehensive statistics
    const stats = await SurgicalItem.aggregate([
      { $match: { isActive: true } },
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                totalItems: { $sum: 1 },
                totalQuantity: { $sum: '$quantity' },
                totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
                lowStockItems: {
                  $sum: {
                    $cond: [
                      { $and: [{ $lte: ['$quantity', '$minStockLevel'] }, { $gt: ['$quantity', 0] }] },
                      1,
                      0
                    ]
                  }
                },
                outOfStockItems: {
                  $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] }
                }
              }
            }
          ],
          categoryBreakdown: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                totalQuantity: { $sum: '$quantity' },
                totalValue: { $sum: { $multiply: ['$quantity', '$price'] } }
              }
            },
            { $sort: { count: -1 } }
          ],
          recentUsage: [
            { $unwind: '$usageHistory' },
            { $sort: { 'usageHistory.date': -1 } },
            { $limit: 10 },
            {
              $project: {
                name: 1,
                usageHistory: 1
              }
            }
          ],
          expiringItems: [
            {
              $match: {
                expiryDate: {
                  $gte: new Date(),
                  $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                }
              }
            },
            { $sort: { expiryDate: 1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0].overview || {
          totalItems: 0,
          totalQuantity: 0,
          totalValue: 0,
          lowStockItems: 0,
          outOfStockItems: 0
        },
        categoryBreakdown: stats.categoryBreakdown,
        recentUsage: stats.recentUsage,
        expiringItems: stats.expiringItems
      }
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};
