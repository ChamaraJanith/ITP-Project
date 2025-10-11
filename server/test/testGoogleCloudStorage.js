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
   */
  static async uploadPrescriptionPDF(pdfBuffer, metadata) {
    try {
      const timestamp = Date.now();
      const prescriptionId = metadata.prescriptionId || 'unknown';
      const patientName = metadata.patientName?.replace(/\s+/g, '_') || 'patient';
      const fileName = `prescriptions/${prescriptionId}/${patientName}_${timestamp}.pdf`;

      const file = bucket.file(fileName);

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

      await file.save(pdfBuffer, options);
      console.log(`✅ PDF uploaded successfully to: ${fileName}`);

      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });

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
   */
  static async listPatientPrescriptions(patientId) {
    try {
      const [files] = await bucket.getFiles({
        prefix: `prescriptions/`,
      });

      const patientFiles = [];
      
      for (const file of files) {
        const [metadata] = await file.getMetadata();
        if (metadata.metadata?.patientId === patientId) {
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
      }

      return patientFiles;
    } catch (error) {
      console.error('❌ Error listing prescriptions:', error);
      throw new Error(`Failed to list prescriptions: ${error.message}`);
    }
  }

  /**
   * Check if Google Cloud Storage is properly configured
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