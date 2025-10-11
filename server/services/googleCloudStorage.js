import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: path.join(__dirname, '../config/google-cloud-key.json'),
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'healx-prescriptions';
const bucket = storage.bucket(bucketName);

class GoogleCloudStorageService {
  /**
   * Upload a PDF buffer to Google Cloud Storage
   * @param {Buffer} pdfBuffer - The PDF file as a buffer
   * @param {Object} metadata - Metadata about the prescription
   * @returns {Promise<Object>} - Returns the public URL and file details
   */
  static async uploadPrescriptionPDF(pdfBuffer, metadata) {
    try {
      // Generate a clean filename structure
      const now = new Date();
      const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const prescriptionId = metadata.prescriptionId || 'unknown';
      const patientId = metadata.patientId || 'unknown';
      const patientName = metadata.patientName?.replace(/\s+/g, '_') || 'patient';
      
      // ✅ FIXED: Clean structure - organized by patient ID
      // Format: prescriptions/PatientID/Date_PrescriptionID.pdf
      const fileName = `prescriptions/${patientId}/${date}_${patientName}_${prescriptionId}.pdf`;

      // Create a file reference in the bucket
      const file = bucket.file(fileName);

      // Upload options
      const options = {
        metadata: {
          contentType: 'application/pdf',
          metadata: {
            prescriptionId: metadata.prescriptionId || '',
            patientId: metadata.patientId || '',
            patientName: metadata.patientName || '',
            doctorName: metadata.doctorName || '',
            date: metadata.date || new Date().toISOString(),
            uploadedAt: new Date().toISOString(),
          },
        },
        public: false,
        resumable: false,
      };

      // Upload the buffer
      await file.save(pdfBuffer, options);

      console.log(`✅ PDF uploaded successfully to: ${fileName}`);

      // Generate a signed URL (valid for 7 days)
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Get file metadata
      const [fileMetadata] = await file.getMetadata();

      return {
        success: true,
        fileName: fileName,
        publicUrl: signedUrl,
        gsUrl: `gs://${bucketName}/${fileName}`,
        size: fileMetadata.size,
        contentType: fileMetadata.contentType,
        uploadedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      console.error('❌ Error uploading to Google Cloud Storage:', error);
      throw new Error(`Failed to upload PDF: ${error.message}`);
    }
  }

  /**
   * Download a prescription PDF from Google Cloud Storage
   * @param {string} fileName - The file path in the bucket
   * @returns {Promise<Buffer>} - Returns the file as a buffer
   */
  static async downloadPrescriptionPDF(fileName) {
    try {
      const file = bucket.file(fileName);
      const [buffer] = await file.download();
      
      console.log(`✅ PDF downloaded successfully: ${fileName}`);
      return buffer;
    } catch (error) {
      console.error('❌ Error downloading from Google Cloud Storage:', error);
      throw new Error(`Failed to download PDF: ${error.message}`);
    }
  }

  /**
   * Delete a prescription PDF from Google Cloud Storage
   * @param {string} fileName - The file path in the bucket
   * @returns {Promise<boolean>}
   */
  static async deletePrescriptionPDF(fileName) {
    try {
      const file = bucket.file(fileName);
      await file.delete();
      
      console.log(`✅ PDF deleted successfully: ${fileName}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting from Google Cloud Storage:', error);
      throw new Error(`Failed to delete PDF: ${error.message}`);
    }
  }

  /**
   * Get a signed URL for a prescription PDF
   * @param {string} fileName - The file path in the bucket
   * @param {number} expirationDays - Number of days until the URL expires (default: 7)
   * @returns {Promise<string>} - Returns the signed URL
   */
  static async getSignedUrl(fileName, expirationDays = 7) {
    try {
      const file = bucket.file(fileName);
      
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expirationDays * 24 * 60 * 60 * 1000,
      });

      return signedUrl;
    } catch (error) {
      console.error('❌ Error generating signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * List all prescriptions for a patient
   * @param {string} patientId - The patient ID
   * @returns {Promise<Array>} - Returns array of file metadata
   */
  static async listPatientPrescriptions(patientId) {
    try {
      // ✅ FIXED: Use patient-specific prefix for better performance
      const [files] = await bucket.getFiles({
        prefix: `prescriptions/${patientId}/`,
      });

      const patientFiles = [];
      
      for (const file of files) {
        // Skip if it's a folder (ends with /)
        if (file.name.endsWith('/')) continue;
        
        const [metadata] = await file.getMetadata();
        patientFiles.push({
          fileName: file.name,
          prescriptionId: metadata.metadata?.prescriptionId,
          patientName: metadata.metadata?.patientName,
          doctorName: metadata.metadata?.doctorName,
          date: metadata.metadata?.date,
          uploadedAt: metadata.metadata?.uploadedAt,
          size: metadata.size,
          contentType: metadata.contentType,
        });
      }

      return patientFiles;
    } catch (error) {
      console.error('❌ Error listing prescriptions:', error);
      throw new Error(`Failed to list prescriptions: ${error.message}`);
    }
  }

  /**
   * List all prescriptions (admin view)
   * @returns {Promise<Array>} - Returns array of all prescription files
   */
  static async listAllPrescriptions() {
    try {
      const [files] = await bucket.getFiles({
        prefix: `prescriptions/`,
      });

      const allFiles = [];
      
      for (const file of files) {
        // Skip if it's a folder (ends with /)
        if (file.name.endsWith('/')) continue;
        
        const [metadata] = await file.getMetadata();
        allFiles.push({
          fileName: file.name,
          prescriptionId: metadata.metadata?.prescriptionId,
          patientId: metadata.metadata?.patientId,
          patientName: metadata.metadata?.patientName,
          doctorName: metadata.metadata?.doctorName,
          date: metadata.metadata?.date,
          uploadedAt: metadata.metadata?.uploadedAt,
          size: metadata.size,
          contentType: metadata.contentType,
        });
      }

      return allFiles;
    } catch (error) {
      console.error('❌ Error listing all prescriptions:', error);
      throw new Error(`Failed to list prescriptions: ${error.message}`);
    }
  }

  /**
   * Check if Google Cloud Storage is properly configured
   * @returns {Promise<boolean>}
   */
  static async testConnection() {
    try {
      await bucket.getMetadata();
      console.log(`✅ Successfully connected to Google Cloud Storage bucket: ${bucketName}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Google Cloud Storage:', error);
      return false;
    }
  }
}

export default GoogleCloudStorageService;