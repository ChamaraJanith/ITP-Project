import express from 'express';
import SurgicalItem from '../model/SurgicalItem.js';

const surgicalrouter = express.Router();

// GET /api/inventory/surgical-items - Fetch all surgical items
surgicalrouter.get('/surgical-items', async (req, res) => {
  try {
    console.log('📋 Fetching surgical items from HealX database...');
    
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, 
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (status && status !== 'all') {
      if (status === 'Low Stock') {
        query.$expr = { $lte: ['$quantity', '$minStockLevel'] };
      } else if (status === 'Out of Stock') {
        query.quantity = 0;
      } else if (status === 'Available') {
        query.$expr = { $gt: ['$quantity', '$minStockLevel'] };
      }
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const items = await SurgicalItem.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    const totalItems = await SurgicalItem.countDocuments(query);
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    console.log(`✅ Found ${items.length} surgical items (page ${page} of ${totalPages})`);
    
    res.status(200).json({
      success: true,
      data: {
        items: items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalItems: totalItems,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
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
});

// POST /api/inventory/surgical-items - Create new surgical item
surgicalrouter.post('/surgical-items', async (req, res) => {
  try {
    console.log('➕ Creating new surgical item...');
    
    const newItem = new SurgicalItem(req.body);
    const savedItem = await newItem.save();
    
    console.log(`✅ Created new item: ${savedItem.name}`);
    
    res.status(201).json({
      success: true,
      message: 'Surgical item created successfully',
      data: savedItem
    });
  } catch (error) {
    console.error('❌ Error creating surgical item:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create surgical item',
      error: error.message
    });
  }
});

// PUT /api/inventory/surgical-items/:id - Update surgical item
surgicalrouter.put('/surgical-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📝 Updating surgical item: ${id}`);
    
    const updatedItem = await SurgicalItem.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Surgical item not found'
      });
    }
    
    console.log(`✅ Updated item: ${updatedItem.name}`);
    
    res.status(200).json({
      success: true,
      message: 'Surgical item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('❌ Error updating surgical item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update surgical item',
      error: error.message
    });
  }
});

// DELETE /api/inventory/surgical-items/:id - Delete surgical item
surgicalrouter.delete('/surgical-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting surgical item: ${id}`);
    
    const deletedItem = await SurgicalItem.findByIdAndUpdate(
      id, 
      { isActive: false }, 
      { new: true }
    );
    
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Surgical item not found'
      });
    }
    
    console.log(`✅ Deleted item: ${deletedItem.name}`);
    
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
});

// POST /api/inventory/surgical-items/:id/update-stock - Update stock
surgicalrouter.post('/surgical-items/:id/update-stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityChange, type, usedBy, purpose } = req.body;
    
    console.log(`📊 Updating stock for item ${id}: ${type} of ${quantityChange} units`);
    
    const item = await SurgicalItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Surgical item not found'
      });
    }
    
    const previousQuantity = item.quantity;
    let newQuantity;
    
    if (type === 'usage') {
      newQuantity = Math.max(0, previousQuantity - quantityChange);
      item.usageHistory.push({
        quantityUsed: quantityChange,
        usedBy: usedBy || 'HealX Admin',
        purpose: purpose || 'Manual stock adjustment'
      });
    } else if (type === 'restock') {
      newQuantity = previousQuantity + quantityChange;
      item.lastRestocked = new Date();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid stock update type. Use "usage" or "restock"'
      });
    }
    
    item.quantity = newQuantity;
    await item.save();
    
    const lowStockTriggered = newQuantity <= item.minStockLevel && newQuantity > 0;
    const outOfStockTriggered = newQuantity <= 0;
    
    console.log(`✅ Stock ${type} updated: ${item.name} (${previousQuantity} → ${newQuantity})`);
    
    res.status(200).json({
      success: true,
      message: `Stock ${type} updated successfully`,
      data: {
        item: { 
          _id: id, 
          name: item.name,
          minStockLevel: item.minStockLevel
        },
        transaction: {
          type,
          quantityChange,
          previousQuantity,
          newQuantity,
          performedAt: new Date(),
          performedBy: usedBy || 'HealX Admin'
        }
      },
      notifications: {
        lowStockTriggered,
        outOfStockTriggered,
        statusChanged: true
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
});

export default surgicalrouter;
