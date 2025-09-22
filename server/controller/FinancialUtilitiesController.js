import FinancialUtilities from '../model/FinancialUtilitiesModal.js';

// Create a new utility expense record
export const createUtility = async (req, res) => {
  try {
    const {
      utilityId,
      category,
      description,
      amount,
      billing_period_start,
      billing_period_end,
      payment_status,
      vendor_name,
      invoice_number
    } = req.body;

    // Check if utility ID already exists
    const existingUtility = await FinancialUtilities.findByUtilityId(utilityId);
    if (existingUtility) {
      return res.status(400).json({
        success: false,
        message: 'Utility record with this Utility ID already exists',
        error: 'DUPLICATE_UTILITY_ID'
      });
    }

    // Additional validation for 6-character utilityId format
    if (!utilityId || utilityId.length !== 6 || !/^[A-Z0-9]{6}$/.test(utilityId)) {
      return res.status(400).json({
        success: false,
        message: 'Utility ID must be exactly 6 characters long and contain only uppercase letters and numbers',
        error: 'INVALID_UTILITY_ID_FORMAT'
      });
    }

    const newUtility = new FinancialUtilities({
      utilityId: utilityId.toUpperCase(),
      category,
      description,
      amount: parseFloat(amount),
      billing_period_start: new Date(billing_period_start),
      billing_period_end: new Date(billing_period_end),
      payment_status: payment_status || 'Pending',
      vendor_name,
      invoice_number: invoice_number || undefined
    });

    const savedUtility = await newUtility.save();

    res.status(201).json({
      success: true,
      message: 'Utility expense record created successfully',
      data: savedUtility
    });

  } catch (error) {
    console.error('Create utility error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Utility record with this ID already exists',
        error: 'DUPLICATE_KEY'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating utility record',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Generate a unique 6-character ID
export const generateUniqueId = async (req, res) => {
  try {
    const uniqueId = await FinancialUtilities.generateUniqueId();
    
    res.status(200).json({
      success: true,
      message: 'Unique ID generated successfully',
      data: { id: uniqueId }
    });

  } catch (error) {
    console.error('Generate ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating unique ID',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Get all utility expense records with filtering and pagination
export const getAllUtilities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      payment_status,
      vendor_name,
      start_date,
      end_date,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (payment_status) filter.payment_status = payment_status;
    if (vendor_name) filter.vendor_name = { $regex: vendor_name, $options: 'i' };
    
    // Date range filter
    if (start_date || end_date) {
      filter.billing_period_start = {};
      if (start_date) filter.billing_period_start.$gte = new Date(start_date);
      if (end_date) filter.billing_period_start.$lte = new Date(end_date);
    }

    // Pagination setup
    const pageNumber = parseInt(page);
    const limitNumber = Math.min(parseInt(limit), 100);
    const skip = (pageNumber - 1) * limitNumber;

    // Sorting
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Execute queries
    const [utilities, totalCount] = await Promise.all([
      FinancialUtilities.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      FinancialUtilities.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.status(200).json({
      success: true,
      message: 'Utility records retrieved successfully',
      data: {
        utilities,
        pagination: {
          current_page: pageNumber,
          total_pages: totalPages,
          total_records: totalCount,
          records_per_page: limitNumber,
          has_next: pageNumber < totalPages,
          has_prev: pageNumber > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all utilities error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching utility records',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Get a single utility expense record by ID
export const getUtilityById = async (req, res) => {
  try {
    let { id } = req.params;
    id = id.toUpperCase();

    // Validate ID format
    if (!id || id.length !== 6 || !/^[A-Z0-9]{6}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format. ID must be exactly 6 characters long and contain only uppercase letters and numbers'
      });
    }

    const utility = await FinancialUtilities.findByUtilityId(id);

    if (!utility) {
      return res.status(404).json({
        success: false,
        message: 'Utility record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Utility record retrieved successfully',
      data: utility
    });

  } catch (error) {
    console.error('Get utility by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching utility record',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Update a utility expense record
export const updateUtility = async (req, res) => {
  try {
    let { id } = req.params;
    id = id.toUpperCase();
    const updateData = req.body;

    // Validate ID format
    if (!id || id.length !== 6 || !/^[A-Z0-9]{6}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format. ID must be exactly 6 characters long and contain only uppercase letters and numbers'
      });
    }

    // Remove fields that shouldn't be updated
    delete updateData.utilityId;
    delete updateData._id;
    delete updateData.createdAt;

    // Convert date strings to Date objects if provided
    if (updateData.billing_period_start) {
      updateData.billing_period_start = new Date(updateData.billing_period_start);
    }
    if (updateData.billing_period_end) {
      updateData.billing_period_end = new Date(updateData.billing_period_end);
    }

    // Convert amount to number if provided
    if (updateData.amount !== undefined) {
      updateData.amount = parseFloat(updateData.amount);
      if (isNaN(updateData.amount) || updateData.amount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a valid positive number'
        });
      }
    }

    const updatedUtility = await FinancialUtilities.updateByUtilityId(id, updateData);

    if (!updatedUtility) {
      return res.status(404).json({
        success: false,
        message: 'Utility record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Utility record updated successfully',
      data: updatedUtility
    });

  } catch (error) {
    console.error('Update utility error:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating utility record',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Delete a utility expense record
export const deleteUtility = async (req, res) => {
  try {
    let { id } = req.params;
    id = id.toUpperCase();

    // Validate ID format
    if (!id || id.length !== 6 || !/^[A-Z0-9]{6}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format. ID must be exactly 6 characters long and contain only uppercase letters and numbers'
      });
    }

    const deletedUtility = await FinancialUtilities.deleteByUtilityId(id);

    if (!deletedUtility) {
      return res.status(404).json({
        success: false,
        message: 'Utility record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Utility record deleted successfully',
      data: deletedUtility
    });

  } catch (error) {
    console.error('Delete utility error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting utility record',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Get utility statistics
export const getUtilityStats = async (req, res) => {
  try {
    const [
      totalExpenses,
      categoryBreakdown,
      paymentStatusBreakdown,
      monthlyExpenses,
      overdueUtilities
    ] = await Promise.all([
      // Total expenses
      FinancialUtilities.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      
      // Category breakdown
      FinancialUtilities.aggregate([
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      
      // Payment status breakdown
      FinancialUtilities.aggregate([
        { $group: { _id: '$payment_status', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      
      // Monthly expenses (last 12 months)
      FinancialUtilities.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$billing_period_start' },
              month: { $month: '$billing_period_start' }
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]),

      // Overdue utilities
      FinancialUtilities.find({ payment_status: 'Overdue' })
        .select('utilityId category vendor_name amount billing_period_end')
        .limit(10)
    ]);

    res.status(200).json({
      success: true,
      message: 'Utility statistics retrieved successfully',
      data: {
        total_expenses: totalExpenses[0]?.total || 0,
        total_records: totalExpenses[0]?.count || 0,
        category_breakdown: categoryBreakdown,
        payment_status_breakdown: paymentStatusBreakdown,
        monthly_expenses: monthlyExpenses,
        recent_overdue: overdueUtilities
      }
    });

  } catch (error) {
    console.error('Get utility stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching utility statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};
