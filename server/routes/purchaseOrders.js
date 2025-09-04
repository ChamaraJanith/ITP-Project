import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Purchase Order Schema
const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  items: [{
    product: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0.01, 'Unit price must be greater than 0']
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0.01, 'Total amount must be greater than 0']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'ordered', 'received', 'cancelled'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDelivery: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date >= new Date();
      },
      message: 'Expected delivery date cannot be in the past'
    }
  },
  actualDelivery: Date,
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5'],
    default: 3
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

// GET all purchase orders
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching all purchase orders...');
    
    const { status, supplier, page = 1, limit = 50 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;
    
    const orders = await PurchaseOrder.find(query)
      .populate('supplier', 'name email phone')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    const total = await PurchaseOrder.countDocuments(query);
    
    console.log(`✅ Found ${orders.length} purchase orders`);
    
    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching purchase orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders',
      error: error.message
    });
  }
});

// CREATE purchase order
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating new purchase order with data:', JSON.stringify(req.body, null, 2));
    
    // Validate supplier exists
    const supplierExists = await mongoose.model('Supplier').findById(req.body.supplier);
    if (!supplierExists) {
      return res.status(400).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Generate unique order number
    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Calculate item totals
    if (req.body.items && req.body.items.length > 0) {
      req.body.items = req.body.items.map(item => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice
      }));
    }

    const purchaseOrder = new PurchaseOrder({
      ...req.body,
      orderNumber
    });
    
    await purchaseOrder.save();
    await purchaseOrder.populate('supplier', 'name email phone');
    
    console.log('✅ Purchase order created successfully:', purchaseOrder._id);
    
    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      order: purchaseOrder
    });
  } catch (error) {
    console.error('❌ Error creating purchase order:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message
    });
  }
});

// UPDATE purchase order
router.put('/:id', async (req, res) => {
  try {
    console.log(`📝 Updating purchase order ${req.params.id}`);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase order ID format'
      });
    }

    // Recalculate totals if items are updated
    if (req.body.items && req.body.items.length > 0) {
      req.body.items = req.body.items.map(item => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice
      }));
      
      req.body.totalAmount = req.body.items.reduce((sum, item) => 
        sum + (item.quantity * item.unitPrice), 0
      );
    }

    const order = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('supplier', 'name email phone');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }
    
    console.log('✅ Purchase order updated successfully:', order._id);
    
    res.json({
      success: true,
      message: 'Purchase order updated successfully',
      order
    });
  } catch (error) {
    console.error('❌ Error updating purchase order:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update purchase order',
      error: error.message
    });
  }
});

// DELETE purchase order
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ Deleting purchase order ${req.params.id}`);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase order ID format'
      });
    }

    const order = await PurchaseOrder.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }
    
    console.log('✅ Purchase order deleted successfully:', order._id);
    
    res.json({
      success: true,
      message: 'Purchase order deleted successfully',
      deletedOrder: {
        id: order._id,
        orderNumber: order.orderNumber
      }
    });
  } catch (error) {
    console.error('❌ Error deleting purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete purchase order',
      error: error.message
    });
  }
});

export default router;
