// models/DisposalRecord.js

import mongoose from 'mongoose';
const { Schema } = mongoose;

const DisposalRecordSchema = new Schema({
  itemId: { type: Schema.Types.ObjectId, ref: 'SurgicalItem', required: true },
  itemName: { type: String, required: true },
  category: { type: String },
  quantityDisposed: { type: Number, required: true, min: 1 },
  reason: { type: String, required: true },
  disposedBy: { type: String, required: true },
  disposedDate: { type: Date, default: Date.now },
  estimatedValue: { type: Number, required: true },
  disposalType: { type: String, default: 'manual' },
  batchDisposal: { type: Boolean, default: false },
  metadata: {
    previousQuantity: { type: Number },
    remainingQuantity: { type: Number },
    unitPrice: { type: Number },
    batchId: { type: String }
  }
});

// 🔥 GET ALL SURGICAL ITEMS - For disposal modal inventory display
export const getAllItems = async (req, res) => {
  try {
    console.log('📋 Fetching all surgical items for disposal modal');
    
    const { 
      page = 1, 
      limit = 100, 
      search = '', 
      category = '',
      supplier = '',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build query filters
    let query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }
    
    // Supplier filter
    if (supplier) {
      query.supplier = { $regex: supplier, $options: 'i' };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const items = await SurgicalItem.find(query)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('name description category quantity price supplier minStockLevel maxStockLevel reorderPoint location expirationDate status createdAt updatedAt')
      .lean();

    // Get total count for pagination
    const totalItems = await SurgicalItem.countDocuments(query);
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    // Calculate inventory stats
    const inventoryStats = {
      totalItems: totalItems,
      totalValue: items.reduce((sum, item) => sum + (item.quantity * (parseFloat(item.price) || 0)), 0),
      lowStockItems: items.filter(item => item.quantity <= (item.minStockLevel || 0)).length,
      outOfStockItems: items.filter(item => item.quantity === 0).length
    };

    console.log(`✅ Retrieved ${items.length} items out of ${totalItems} total`);

    res.status(200).json({
      success: true,
      message: `Retrieved ${items.length} surgical items`,
      data: {
        items: items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalItems: totalItems,
          itemsPerPage: parseInt(limit),
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        stats: inventoryStats,
        filters: {
          search,
          category,
          supplier,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching surgical items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching surgical items',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


// Index for fast queries by disposedDate
DisposalRecordSchema.index({ disposedDate: -1 });

export default mongoose.model('DisposalRecord', DisposalRecordSchema);
