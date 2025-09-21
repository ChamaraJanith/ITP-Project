// ===== 2. EmergencyAlertController.js (Fixed) =====
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
        assignedDoctorSpecialization
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
        description,
        assignedDoctorId,
        assignedDoctorName,
        assignedDoctorSpecialization
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

  // Get all emergency alerts
  static async getAllEmergencyAlerts(req, res) {
    try {
      console.log('📋 Fetching emergency alerts with query:', req.query);
      
      const { status, type, assignedDoctorId } = req.query;
      
      // Build query filter
      const filter = {};
      if (status && status !== 'All') filter.status = status;
      if (type && type !== 'All') filter.type = type;
      if (assignedDoctorId) filter.assignedDoctorId = assignedDoctorId;

      const alerts = await EmergencyAlert.find(filter).sort({ createdAt: -1 });
      console.log(`✅ Found ${alerts.length} emergency alerts`);

      return res.status(200).json({
        success: true,
        message: 'Emergency alerts fetched successfully',
        data: alerts,
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
  static async updateEmergencyAlertStatus(req, res) {
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

      const stats = {
        totalAlerts,
        activeAlerts,
        resolvedAlerts,
        criticalAlerts,
        urgentAlerts,
        alertsByDay
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
}

export default EmergencyAlertController;