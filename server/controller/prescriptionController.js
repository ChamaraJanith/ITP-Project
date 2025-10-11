import Prescriptions from "../model/Prescriptions.js";
import GoogleCloudStorageService from "../services/googleCloudStorage.js";

class PrescriptionController {
  // CREATE new prescription with PDF upload
  static async createPrescription(req, res) {
    try {
      const body = req.body;

      // Use logged-in user or fallback doctor info
      const doctor = req.user || {
        id: "TEMP_DOCTOR_ID",
        name: "Dr. Gayath Dahanayaka",
        specialization: "General",
      };

      const patientId = body.patientId;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: "patientId is required",
        });
      }

      const newPrescription = new Prescriptions({
        date: body.date ? new Date(body.date) : Date.now(),
        diagnosis: body.diagnosis,
        medicines: body.medicines,
        notes: body.notes || "",

        patientId: patientId,
        patientName: body.patientName,
        patientEmail: body.patientEmail,
        patientPhone: body.patientPhone,
        patientGender: body.patientGender,
        bloodGroup: body.bloodGroup || "",
        patientBloodGroup: body.bloodGroup || "",
        patientDateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        patientAllergies: body.patientAllergies || [],

        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization || "",
      });

      await newPrescription.save();

      // Upload PDF to Google Cloud Storage if PDF buffer is provided
      let cloudStorageResult = null;
      if (body.pdfBuffer) {
        try {
          const pdfBuffer = Buffer.from(body.pdfBuffer);
          
          cloudStorageResult = await GoogleCloudStorageService.uploadPrescriptionPDF(
            pdfBuffer,
            {
              prescriptionId: newPrescription._id.toString(),
              patientId: patientId,
              patientName: body.patientName,
              doctorName: doctor.name,
              date: newPrescription.date.toISOString(),
            }
          );

          // Update prescription with cloud storage info
          newPrescription.pdfUrl = cloudStorageResult.publicUrl;
          newPrescription.pdfFileName = cloudStorageResult.fileName;
          newPrescription.pdfGsUrl = cloudStorageResult.gsUrl;
          await newPrescription.save();

          console.log("✅ PDF uploaded to Google Cloud Storage:", cloudStorageResult.fileName);
        } catch (uploadError) {
          console.error("⚠️ Prescription saved but PDF upload failed:", uploadError);
          // Don't fail the entire request if PDF upload fails
        }
      }

      return res.status(201).json({
        success: true,
        message: "Prescription created successfully",
        data: newPrescription,
        cloudStorage: cloudStorageResult,
      });
    } catch (error) {
      console.error("Error creating prescription:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating prescription",
        error: error.message,
      });
    }
  }

  // UPDATE prescription by ID with PDF upload
  static async updatePrescription(req, res) {
    try {
      const { id } = req.params;
      const body = req.body;

      const updateFields = {};

      if (body.hasOwnProperty("date")) updateFields.date = body.date ? new Date(body.date) : null;
      if (body.hasOwnProperty("diagnosis")) updateFields.diagnosis = body.diagnosis || "";
      if (body.hasOwnProperty("medicines")) updateFields.medicines = body.medicines || [];
      if (body.hasOwnProperty("notes")) updateFields.notes = body.notes || "";

      if (body.hasOwnProperty("patientId")) updateFields.patientId = body.patientId || "";
      if (body.hasOwnProperty("patientName")) updateFields.patientName = body.patientName || "";
      if (body.hasOwnProperty("patientEmail")) updateFields.patientEmail = body.patientEmail || "";
      if (body.hasOwnProperty("patientPhone")) updateFields.patientPhone = body.patientPhone || "";
      if (body.hasOwnProperty("patientGender")) updateFields.patientGender = body.patientGender || "";
      if (body.hasOwnProperty("bloodGroup")) updateFields.patientBloodGroup = body.bloodGroup || "";
      if (body.hasOwnProperty("dateOfBirth")) updateFields.patientDateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
      if (body.hasOwnProperty("patientAllergies")) updateFields.patientAllergies = body.patientAllergies || [];

      if (body.hasOwnProperty("doctorId")) updateFields.doctorId = body.doctorId || "";
      if (body.hasOwnProperty("doctorName")) updateFields.doctorName = body.doctorName || "";
      if (body.hasOwnProperty("doctorSpecialization")) updateFields.doctorSpecialization = body.doctorSpecialization || "";

      const updatedPrescription = await Prescriptions.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, runValidators: true }
      );

      if (!updatedPrescription) {
        return res.status(404).json({
          success: false,
          message: "Prescription not found",
        });
      }

      // Upload updated PDF to Google Cloud Storage if PDF buffer is provided
      let cloudStorageResult = null;
      if (body.pdfBuffer) {
        try {
          const pdfBuffer = Buffer.from(body.pdfBuffer);
          
          // Delete old PDF if exists
          if (updatedPrescription.pdfFileName) {
            try {
              await GoogleCloudStorageService.deletePrescriptionPDF(updatedPrescription.pdfFileName);
              console.log("✅ Old PDF deleted from Google Cloud Storage");
            } catch (deleteError) {
              console.warn("⚠️ Could not delete old PDF:", deleteError.message);
            }
          }

          // Upload new PDF
          cloudStorageResult = await GoogleCloudStorageService.uploadPrescriptionPDF(
            pdfBuffer,
            {
              prescriptionId: updatedPrescription._id.toString(),
              patientId: updatedPrescription.patientId,
              patientName: updatedPrescription.patientName,
              doctorName: updatedPrescription.doctorName,
              date: updatedPrescription.date.toISOString(),
            }
          );

          // Update prescription with new cloud storage info
          updatedPrescription.pdfUrl = cloudStorageResult.publicUrl;
          updatedPrescription.pdfFileName = cloudStorageResult.fileName;
          updatedPrescription.pdfGsUrl = cloudStorageResult.gsUrl;
          await updatedPrescription.save();

          console.log("✅ Updated PDF uploaded to Google Cloud Storage:", cloudStorageResult.fileName);
        } catch (uploadError) {
          console.error("⚠️ Prescription updated but PDF upload failed:", uploadError);
        }
      }

      return res.status(200).json({
        success: true,
        message: "Prescription updated successfully",
        data: updatedPrescription,
        cloudStorage: cloudStorageResult,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error updating prescription",
        error: error.message,
      });
    }
  }

  // GET all prescriptions
  static async getAllPrescriptions(req, res) {
    try {
      const prescriptions = await Prescriptions.find().sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        message: "Prescriptions fetched successfully",
        data: prescriptions,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching prescriptions",
        error: error.message,
      });
    }
  }

  // GET prescription by ID
  static async getPrescriptionById(req, res) {
    try {
      const { id } = req.params;
      const prescription = await Prescriptions.findById(id);

      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: "Prescription not found",
        });
      }

      // Generate a fresh signed URL if PDF exists
      if (prescription.pdfFileName) {
        try {
          const signedUrl = await GoogleCloudStorageService.getSignedUrl(prescription.pdfFileName);
          prescription.pdfUrl = signedUrl;
        } catch (urlError) {
          console.warn("⚠️ Could not generate signed URL:", urlError.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: "Prescription fetched successfully",
        data: prescription,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching prescription",
        error: error.message,
      });
    }
  }

  // DELETE prescription by ID
  static async deletePrescription(req, res) {
    try {
      const { id } = req.params;

      const prescription = await Prescriptions.findById(id);
      
      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: "Prescription not found",
        });
      }

      // Delete PDF from Google Cloud Storage if exists
      if (prescription.pdfFileName) {
        try {
          await GoogleCloudStorageService.deletePrescriptionPDF(prescription.pdfFileName);
          console.log("✅ PDF deleted from Google Cloud Storage");
        } catch (deleteError) {
          console.warn("⚠️ Could not delete PDF from cloud:", deleteError.message);
        }
      }

      // Delete prescription from database
      await Prescriptions.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: "Prescription deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error deleting prescription",
        error: error.message,
      });
    }
  }

  // GET prescriptions by patient ID
  static async getPrescriptionsByPatientId(req, res) {
    try {
      const { patientId } = req.params;
      
      const prescriptions = await Prescriptions.find({ patientId }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: "Patient prescriptions fetched successfully",
        data: prescriptions,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching patient prescriptions",
        error: error.message,
      });
    }
  }

  // Download prescription PDF
  static async downloadPrescriptionPDF(req, res) {
    try {
      const { id } = req.params;
      
      const prescription = await Prescriptions.findById(id);

      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: "Prescription not found",
        });
      }

      if (!prescription.pdfFileName) {
        return res.status(404).json({
          success: false,
          message: "PDF not found for this prescription",
        });
      }

      // Download PDF from Google Cloud Storage
      const pdfBuffer = await GoogleCloudStorageService.downloadPrescriptionPDF(
        prescription.pdfFileName
      );

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Prescription_${prescription.patientName}_${prescription._id}.pdf"`
      );

      // Send the PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error downloading prescription PDF:", error);
      return res.status(500).json({
        success: false,
        message: "Error downloading prescription PDF",
        error: error.message,
      });
    }
  }
}

export default PrescriptionController;