import SurgicalItem from '../model/SurgicalItem.js'; // Adjust path to your model
import mongoose from 'mongoose';

// Helper function to safely trim strings
const safeTrim = (value) => {
  return typeof value === 'string' ? value.trim() : value;
};

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
    const statsResult = await SurgicalItem.aggregate([
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

    const stats = statsResult.length > 0 ? statsResult[0] : {
      totalItems: 0,
      totalQuantity: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalValue: 0
    };

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
        stats
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

    const item = await SurgicalItem.findById(id)
      .populate('usageHistory.usedBy', 'name');

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
      quantity = 0,
      minStockLevel = 5,
      price = 0,
      supplier,
      location,
      expiryDate,
      batchNumber,
      serialNumber,
      autoRestock,
      companyId,
      tracking,
      metadata
    } = req.body;

    // Basic validation
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required fields'
      });
    }

    // Validate numeric values
    const numQuantity = Number(quantity) || 0;
    const numPrice = Number(price) || 0;
    const numMinStock = Number(minStockLevel) || 5;

    if (numQuantity < 0 || numPrice < 0 || numMinStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity, price, and minimum stock level must be non-negative'
      });
    }

    // Process autoRestock data
    let autoRestockData = {
      enabled: false,
      maxStockLevel: null,
      reorderPoint: null
    };

    // Handle autoRestock from form (frontend structure)
    if (autoRestock) {
      const isEnabled = Boolean(
        autoRestock.enabled || 
        autoRestock.isEnabled || 
        (autoRestock.minStockLevel && autoRestock.maxStockLevel)
      );

      if (isEnabled) {
        const minStock = Number(autoRestock.minStockLevel) || numMinStock;
        const maxStock = Number(autoRestock.maxStockLevel) || Math.max(minStock * 2, 50);
        const reorderPoint = Number(autoRestock.reorderPoint) || minStock;

        // Validate relationships
        if (maxStock < minStock) {
          return res.status(400).json({
            success: false,
            message: `Maximum stock level (${maxStock}) must be greater than or equal to minimum stock level (${minStock})`
          });
        }

        autoRestockData = {
          enabled: true,
          maxStockLevel: maxStock,
          reorderPoint: reorderPoint
        };
      }
    }

    // Check if item with same name and supplier already exists
    const existingItem = await SurgicalItem.findOne({
      name: new RegExp(`^${name.trim()}$`, 'i'),
      'supplier.name': supplier?.name,
      isActive: true
    });

    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: 'Item with this name and supplier already exists'
      });
    }

    // Validate expiry date if provided
    if (expiryDate && new Date(expiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date cannot be in the past'
      });
    }

    // Process supplier data - handle both form structure and direct structure
    let supplierData = {};
    if (supplier) {
      supplierData = {
        name: safeTrim(supplier.name) || '',
        contact: safeTrim(supplier.contact || supplier.phone) || '',
        email: safeTrim(supplier.email) || ''
      };
    }

    // Process location data - handle both form structure and direct structure
    let locationData = '';
    if (location) {
      if (typeof location === 'string') {
        locationData = safeTrim(location);
      } else if (typeof location === 'object') {
        // Handle form structure with room/shelf/bin
        const parts = [
          safeTrim(location.room),
          safeTrim(location.shelf), 
          safeTrim(location.bin)
        ].filter(Boolean);
        locationData = parts.join(' - ') || '';
      }
    }

    // Prepare the data for creating the item
    const itemData = {
      name: safeTrim(name),
      category,
      description: safeTrim(description) || '',
      quantity: numQuantity,
      minStockLevel: numMinStock,
      price: numPrice,
      supplier: supplierData,
      location: locationData,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      batchNumber: safeTrim(batchNumber) || '',
      serialNumber: safeTrim(serialNumber) || '',
      autoRestock: autoRestockData,
      companyId: companyId || null
    };

    // Add tracking data if provided
    if (tracking) {
      if (tracking.expiryDate) itemData.expiryDate = new Date(tracking.expiryDate);
      if (tracking.batchNumber) itemData.batchNumber = safeTrim(tracking.batchNumber);
      if (tracking.serialNumber) itemData.serialNumber = safeTrim(tracking.serialNumber);
    }

    // Add metadata if provided  
    if (metadata) {
      itemData.metadata = {
        priority: metadata.priority || 'normal',
        notes: safeTrim(metadata.notes) || '',
        lastUpdatedBy: metadata.lastUpdatedBy || 'system'
      };
    }

    // Don't set status - let the schema default handle it
    const newItem = new SurgicalItem(itemData);
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

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate entry detected'
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

    // Prepare update data
    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be directly updated
    delete updateData.status; // Status is calculated automatically
    delete updateData.isActive; // Prevent accidental deactivation
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Process autoRestock if being updated
    if (updateData.autoRestock) {
      const minStock = Number(updateData.minStockLevel) || existingItem.minStockLevel;
      const autoRestock = updateData.autoRestock;

      if (autoRestock.enabled || autoRestock.isEnabled) {
        const maxStock = Number(autoRestock.maxStockLevel) || Math.max(minStock * 2, 50);
        const reorderPoint = Number(autoRestock.reorderPoint) || minStock;

        // Validate relationships
        if (maxStock < minStock) {
          return res.status(400).json({
            success: false,
            message: `Maximum stock level (${maxStock}) must be greater than or equal to minimum stock level (${minStock})`
          });
        }

        updateData.autoRestock = {
          enabled: true,
          maxStockLevel: maxStock,
          reorderPoint: reorderPoint
        };
      } else {
        updateData.autoRestock = {
          enabled: false,
          maxStockLevel: null,
          reorderPoint: null
        };
      }
    }

    // Process location data
    if (updateData.location && typeof updateData.location === 'object') {
      const parts = [
        safeTrim(updateData.location.room),
        safeTrim(updateData.location.shelf),
        safeTrim(updateData.location.bin)
      ].filter(Boolean);
      updateData.location = parts.join(' - ') || '';
    }

    // Validate expiry date if being updated
    if (updateData.expiryDate && new Date(updateData.expiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date cannot be in the past'
      });
    }

    // Safely trim string fields
    if (updateData.name) updateData.name = safeTrim(updateData.name);
    if (updateData.description) updateData.description = safeTrim(updateData.description);
    if (updateData.batchNumber) updateData.batchNumber = safeTrim(updateData.batchNumber);
    if (updateData.serialNumber) updateData.serialNumber = safeTrim(updateData.serialNumber);

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

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate entry detected'
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

    // Soft delete by setting isActive to false
    item.isActive = false;
    item.deletedAt = new Date();
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
    const { quantityChange, type, usedBy, purpose, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format'
      });
    }

    if (!quantityChange || !type || !['restock', 'usage'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stock update data. Quantity change and type (restock/usage) are required.'
      });
    }

    const changeAmount = Math.abs(Number(quantityChange));
    if (changeAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity change must be a positive number'
      });
    }

    const item = await SurgicalItem.findById(id);
    if (!item || !item.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Surgical item not found'
      });
    }

    const previousQuantity = item.quantity;

    if (type === 'restock') {
      item.quantity += changeAmount;
      item.lastRestocked = new Date();
      
      // Add to restock history
      if (!item.restockHistory) {
        item.restockHistory = [];
      }
      item.restockHistory.push({
        quantityAdded: changeAmount,
        restockedBy: safeTrim(usedBy) || 'Unknown',
        notes: safeTrim(notes) || 'Stock replenishment',
        date: new Date()
      });

    } else if (type === 'usage') {
      if (item.quantity < changeAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for this usage. Available: ${item.quantity}, Requested: ${changeAmount}`
        });
      }

      item.quantity -= changeAmount;
      
      // Add to usage history
      item.usageHistory.push({
        quantityUsed: changeAmount,
        usedBy: safeTrim(usedBy) || 'Unknown',
        purpose: safeTrim(purpose) || 'Not specified',
        notes: safeTrim(notes) || '',
        date: new Date()
      });
    }

    await item.save();

    // Check if auto-restock is needed
    let autoRestockTriggered = false;
    if (item.autoRestock.enabled && item.quantity <= item.autoRestock.reorderPoint) {
      autoRestockTriggered = true;
      console.log(`🔄 Auto-restock triggered for ${item.name}. Current: ${item.quantity}, Reorder Point: ${item.autoRestock.reorderPoint}`);
    }

    res.status(200).json({
      success: true,
      message: `Stock ${type} updated successfully`,
      data: {
        item: item,
        previousQuantity,
        newQuantity: item.quantity,
        changeAmount,
        autoRestockTriggered
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

// @desc    Get low stock items
// @route   GET /api/inventory/surgical-items/low-stock
// @access  Private (Admin/Staff)
export const getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await SurgicalItem.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    }).sort({ quantity: 1 });

    res.status(200).json({
      success: true,
      data: {
        count: lowStockItems.length,
        items: lowStockItems
      }
    });

  } catch (error) {
    console.error('❌ Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock items',
      error: error.message
    });
  }
};

// @desc    Get expiring items
// @route   GET /api/inventory/surgical-items/expiring
// @access  Private (Admin/Staff)
export const getExpiringItems = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAhead = parseInt(days);
    
    const expiringItems = await SurgicalItem.find({
      isActive: true,
      expiryDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
      }
    }).sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      data: {
        count: expiringItems.length,
        daysAhead,
        items: expiringItems
      }
    });

  } catch (error) {
    console.error('❌ Error fetching expiring items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiring items',
      error: error.message
    });
  }
};

// @desc    Get inventory dashboard stats
// @route   GET /api/inventory/dashboard-stats
// @access  Private (Admin/Staff)
export const getDashboardStats = async (req, res) => {
  try {
    const statsResult = await SurgicalItem.aggregate([
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
                },
                autoRestockEnabled: {
                  $sum: { $cond: ['$autoRestock.enabled', 1, 0] }
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
                totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
                avgPrice: { $avg: '$price' }
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
                category: 1,
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

    const stats = statsResult[0];
    
    res.status(200).json({
      success: true,
      data: {
        overview: stats.overview.length > 0 ? stats.overview[0] : {
          totalItems: 0,
          totalQuantity: 0,
          totalValue: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          autoRestockEnabled: 0
        },
        categoryBreakdown: stats.categoryBreakdown || [],
        recentUsage: stats.recentUsage || [],
        expiringItems: stats.expiringItems || []
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

// @desc    Bulk update items
// @route   POST /api/inventory/surgical-items/bulk-update
// @access  Private (Admin only)
export const bulkUpdateItems = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required and must contain at least one update'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < updates.length; i++) {
      const { id, ...updateData } = updates[i];
      
      try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push({ index: i, id, error: 'Invalid ID format' });
          continue;
        }

        // Safely trim string fields in bulk update
        if (updateData.name) updateData.name = safeTrim(updateData.name);
        if (updateData.description) updateData.description = safeTrim(updateData.description);
        if (updateData.location) updateData.location = safeTrim(updateData.location);
        if (updateData.batchNumber) updateData.batchNumber = safeTrim(updateData.batchNumber);
        if (updateData.serialNumber) updateData.serialNumber = safeTrim(updateData.serialNumber);

        const updatedItem = await SurgicalItem.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        );

        if (!updatedItem || !updatedItem.isActive) {
          errors.push({ index: i, id, error: 'Item not found' });
          continue;
        }

        results.push({ index: i, id, item: updatedItem });
        
      } catch (error) {
        errors.push({ index: i, id, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk update completed. ${results.length} successful, ${errors.length} failed`,
      data: {
        successful: results,
        failed: errors,
        totalProcessed: updates.length
      }
    });

  } catch (error) {
    console.error('❌ Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk update',
      error: error.message
    });
  }
};

// Export all functions
