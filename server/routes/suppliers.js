import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Supplier Schema
const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    match: [/^[\+]?[0-9]{7,15}$/, 'Please enter a valid phone number']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['medical_equipment', 'pharmaceuticals', 'consumables', 'services'],
      message: 'Category must be one of: medical_equipment, pharmaceuticals, consumables, services'
    }
  },
  address: {
    street: {
      type: String,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      maxlength: [50, 'City cannot exceed 50 characters']
    },
    state: {
      type: String,
      maxlength: [50, 'State cannot exceed 50 characters']
    },
    zipCode: {
      type: String,
      maxlength: [10, 'Zip code cannot exceed 10 characters']
    },
    country: {
      type: String,
      maxlength: [50, 'Country cannot exceed 50 characters']
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blacklisted'],
    default: 'active'
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5'],
    default: 3
  }
}, {
  timestamps: true
});

const Supplier = mongoose.model('Supplier', supplierSchema);

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching all suppliers...');
    
    const { category, status, search, page = 1, limit = 50 } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const suppliers = await Supplier.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    const total = await Supplier.countDocuments(query);
    
    console.log(`✅ Found ${suppliers.length} suppliers`);
    
    res.json({
      success: true,
      suppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers',
      error: error.message
    });
  }
});

// CREATE supplier
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating new supplier with data:', JSON.stringify(req.body, null, 2));
    
    // Manual validation of required fields
    const { name, email, phone, category } = req.body;
    if (!name || !email || !phone || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, phone, and category are required'
      });
    }

    // Check for existing supplier with same email
    const existingSupplier = await Supplier.findOne({ email: email.toLowerCase() });
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'A supplier with this email already exists'
      });
    }

    const supplier = new Supplier(req.body);
    const savedSupplier = await supplier.save();
    
    console.log('✅ Supplier created successfully:', savedSupplier._id);
    
    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      supplier: savedSupplier
    });
  } catch (error) {
    console.error('❌ Error creating supplier:', error);
    
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
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A supplier with this ${field} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Database error occurred while creating supplier',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// UPDATE supplier
router.put('/:id', async (req, res) => {
  try {
    console.log(`📝 Updating supplier ${req.params.id} with data:`, req.body);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    console.log('✅ Supplier updated successfully:', supplier._id);
    
    res.json({
      success: true,
      message: 'Supplier updated successfully',
      supplier
    });
  } catch (error) {
    console.error('❌ Error updating supplier:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.message
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists for another supplier'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update supplier',
      error: error.message
    });
  }
});

// DELETE supplier
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ Deleting supplier ${req.params.id}`);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }

    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    console.log('✅ Supplier deleted successfully:', supplier._id);
    
    res.json({
      success: true,
      message: 'Supplier deleted successfully',
      deletedSupplier: {
        id: supplier._id,
        name: supplier.name
      }
    });
  } catch (error) {
    console.error('❌ Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete supplier',
      error: error.message
    });
  }
});

export default router;
