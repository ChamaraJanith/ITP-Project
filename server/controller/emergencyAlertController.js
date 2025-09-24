// controller/EmergencyAlertController.js
import EmergencyAlert from "../model/EmergencyAlert.js";

class EmergencyAlertController {
  // Create a new emergency alert
  static async createEmergencyAlert(req, res) {
    try {
      console.log('📝 Creating emergency alert:', req.body);
      
      const {
        patientId,
        patientName,
        patientEmail,
        patientPhone,
        patientGender,
        type,
        description,
        assignedDoctorId,
        assignedDoctorName,
        assignedDoctorSpecialization,
        location,
        symptoms,
        vitalSigns,
        priority
      } = req.body;

      // Validate required fields
      if (!patientId || !patientName || !description || !assignedDoctorId || !assignedDoctorName) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: patientId, patientName, description, assignedDoctorId, assignedDoctorName'
        });
      }

      const newAlert = new EmergencyAlert({
        patientId,
        patientName,
        patientEmail,
        patientPhone,
        patientGender,
        type: type || 'Non-urgent',
        priority: priority || 'Medium',
        description,
        assignedDoctorId,
        assignedDoctorName,
        assignedDoctorSpecialization,
        location: location || 'Unknown',
        symptoms: symptoms || [],
        vitalSigns: vitalSigns || {}
      });

      const savedAlert = await newAlert.save();
      console.log('✅ Emergency alert created:', savedAlert._id);

      return res.status(201).json({
        success: true,
        message: 'Emergency alert created successfully',
        data: savedAlert
      });
    } catch (error) {
      console.error("❌ Error creating emergency alert:", error);
      return res.status(500).json({
        success: false,
        message: 'Error creating emergency alert',
        error: error.message
      });
    }
  }

  // Get all emergency alerts with pagination
  static async getAllEmergencyAlerts(req, res) {
    try {
      console.log('📋 Fetching emergency alerts with query:', req.query);
      
      const { 
        status, 
        type, 
        assignedDoctorId, 
        page = 1, 
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      // Build query filter
      const filter = {};
      if (status && status !== 'All') filter.status = status;
      if (type && type !== 'All') filter.type = type;
      if (assignedDoctorId) filter.assignedDoctorId = assignedDoctorId;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const [alerts, totalAlerts] = await Promise.all([
        EmergencyAlert.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(), // Use lean for better performance
        EmergencyAlert.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(totalAlerts / parseInt(limit));

      console.log(`✅ Found ${alerts.length} emergency alerts (Page ${page} of ${totalPages})`);

      return res.status(200).json({
        success: true,
        message: 'Emergency alerts fetched successfully',
        data: alerts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalAlerts,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          limit: parseInt(limit)
        },
        count: alerts.length
      });
    } catch (error) {
      console.error("❌ Error fetching emergency alerts:", error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching emergency alerts',
        error: error.message
      });
    }
  }

  // Get emergency alert by ID
  static async getEmergencyAlertById(req, res) {
    try {
      const { id } = req.params;
      console.log('🔍 Fetching emergency alert by ID:', id);

      const alert = await EmergencyAlert.findById(id);

      if (!alert) {
        return res.status(404).json({ 
          success: false, 
          message: 'Emergency alert not found' 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Emergency alert fetched successfully',
        data: alert
      });
    } catch (error) {
      console.error("❌ Error fetching emergency alert:", error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching emergency alert',
        error: error.message
      });
    }
  }

  // Update emergency alert status
  static async updateEmergencyAlert(req, res) {
    try {
      const { id } = req.params;
      const { status, notes, resolvedBy } = req.body;
      
      console.log('🔄 Updating emergency alert:', id, { status, notes, resolvedBy });

      const updateFields = { status, updatedAt: new Date() };
      
      if (status === 'Resolved') {
        updateFields.resolvedAt = new Date();
        updateFields.resolvedBy = resolvedBy || 'Unknown';
      }
      
      if (notes !== undefined) updateFields.notes = notes;

      const updatedAlert = await EmergencyAlert.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, runValidators: true }
      );

      if (!updatedAlert) {
        return res.status(404).json({ 
          success: false, 
          message: 'Emergency alert not found' 
        });
      }

      console.log('✅ Emergency alert updated:', updatedAlert._id);

      return res.status(200).json({
        success: true,
        message: 'Emergency alert updated successfully',
        data: updatedAlert
      });
    } catch (error) {
      console.error("❌ Error updating emergency alert:", error);
      return res.status(500).json({
        success: false,
        message: 'Error updating emergency alert',
        error: error.message
      });
    }
  }

  // Delete emergency alert
  static async deleteEmergencyAlert(req, res) {
    try {
      const { id } = req.params;
      console.log('🗑️ Deleting emergency alert:', id);

      const deleted = await EmergencyAlert.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ 
          success: false, 
          message: 'Emergency alert not found' 
        });
      }

      console.log('✅ Emergency alert deleted:', id);

      return res.status(200).json({ 
        success: true, 
        message: 'Emergency alert deleted successfully' 
      });
    } catch (error) {
      console.error("❌ Error deleting emergency alert:", error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting emergency alert',
        error: error.message
      });
    }
  }

  // Get emergency alert statistics
  static async getEmergencyAlertStats(req, res) {
    try {
      console.log('📊 Fetching emergency alert statistics');
      
      const { assignedDoctorId } = req.query;
      
      const filter = assignedDoctorId ? { assignedDoctorId } : {};
      
      const [
        totalAlerts,
        activeAlerts,
        resolvedAlerts,
        criticalAlerts,
        urgentAlerts
      ] = await Promise.all([
        EmergencyAlert.countDocuments(filter),
        EmergencyAlert.countDocuments({ ...filter, status: 'Active' }),
        EmergencyAlert.countDocuments({ ...filter, status: 'Resolved' }),
        EmergencyAlert.countDocuments({ ...filter, type: 'Critical' }),
        EmergencyAlert.countDocuments({ ...filter, type: 'Urgent' })
      ]);
      
      // Get alerts by day for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const alertsByDay = await EmergencyAlert.aggregate([
        { $match: { ...filter, createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Calculate average resolution time
      const resolvedAlertsData = await EmergencyAlert.find({
        ...filter,
        status: 'Resolved',
        resolutionTime: { $exists: true, $ne: null }
      }).select('resolutionTime');
      
      const avgResolutionTime = resolvedAlertsData.length > 0
        ? Math.round(resolvedAlertsData.reduce((sum, alert) => sum + alert.resolutionTime, 0) / resolvedAlertsData.length)
        : 0;

      const stats = {
        overview: {
          totalAlerts,
          activeAlerts,
          resolvedAlerts,
          todayAlerts: alertsByDay.reduce((sum, day) => {
            const today = new Date().toISOString().split('T')[0];
            return day._id === today ? day.count : sum;
          }, 0)
        },
        byType: {
          criticalAlerts,
          urgentAlerts,
          nonUrgentAlerts: totalAlerts - criticalAlerts - urgentAlerts
        },
        alertsByDay,
        performance: {
          avgResolutionTime,
          resolutionRate: totalAlerts > 0 ? Math.round((resolvedAlerts / totalAlerts) * 100) : 0
        }
      };

      console.log('✅ Emergency alert statistics:', stats);

      return res.status(200).json({
        success: true,
        message: 'Emergency alert statistics fetched successfully',
        data: stats
      });
    } catch (error) {
      console.error("❌ Error fetching emergency alert statistics:", error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching emergency alert statistics',
        error: error.message
      });
    }
  }

  // Bulk update alerts
  static async bulkUpdateAlerts(req, res) {
    try {
      const { alertIds, updateData } = req.body;
      
      if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No alert IDs provided'
        });
      }

      const result = await EmergencyAlert.updateMany(
        { _id: { $in: alertIds } },
        { $set: { ...updateData, updatedAt: new Date() } },
        { multi: true }
      );

      return res.status(200).json({
        success: true,
        message: `${result.modifiedCount} alerts updated successfully`,
        data: result
      });
    } catch (error) {
      console.error("❌ Error bulk updating emergency alerts:", error);
      return res.status(500).json({
        success: false,
        message: 'Error bulk updating emergency alerts',
        error: error.message
      });
    }
  }
}

export default EmergencyAlertController;