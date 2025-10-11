// File: backend/test/testGoogleCloudStorage.js
// Run this script to test your Google Cloud Storage setup

import GoogleCloudStorageService from '../services/googleCloudStorage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testGoogleCloudStorage() {
  console.log('🧪 Starting Google Cloud Storage Test...\n');

  try {
    // Test 1: Connection
    console.log('Test 1: Testing connection...');
    const isConnected = await GoogleCloudStorageService.testConnection();
    console.log(isConnected ? '✅ Connection successful\n' : '❌ Connection failed\n');

    if (!isConnected) {
      console.error('Cannot proceed with tests. Please check your configuration.');
      return;
    }

    // Test 2: Upload a test PDF
    console.log('Test 2: Uploading test PDF...');
    
    // Create a simple test PDF buffer (you can also use a real PDF file)
    const testPdfPath = path.join(__dirname, 'test.pdf');
    let testPdfBuffer;
    
    if (fs.existsSync(testPdfPath)) {
      testPdfBuffer = fs.readFileSync(testPdfPath);
    } else {
      // Create a minimal PDF buffer for testing
      testPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n190\n%%EOF');
    }

    const uploadResult = await GoogleCloudStorageService.uploadPrescriptionPDF(
      testPdfBuffer,
      {
        prescriptionId: 'TEST-123',
        patientId: 'PAT-456',
        patientName: 'Test Patient',
        doctorName: 'Dr. Test',
        date: new Date().toISOString(),
      }
    );

    console.log('✅ Upload successful!');
    console.log('   File name:', uploadResult.fileName);
    console.log('   Public URL:', uploadResult.publicUrl);
    console.log('   GS URL:', uploadResult.gsUrl);
    console.log('   Size:', uploadResult.size, 'bytes\n');

    // Test 3: Generate signed URL
    console.log('Test 3: Generating signed URL...');
    const signedUrl = await GoogleCloudStorageService.getSignedUrl(uploadResult.fileName);
    console.log('✅ Signed URL generated successfully');
    console.log('   URL:', signedUrl.substring(0, 100) + '...\n');

    // Test 4: Download the PDF
    console.log('Test 4: Downloading PDF...');
    const downloadedBuffer = await GoogleCloudStorageService.downloadPrescriptionPDF(uploadResult.fileName);
    console.log('✅ Download successful');
    console.log('   Downloaded size:', downloadedBuffer.length, 'bytes\n');

    // Test 5: Delete the PDF
    console.log('Test 5: Deleting test PDF...');
    await GoogleCloudStorageService.deletePrescriptionPDF(uploadResult.fileName);
    console.log('✅ Delete successful\n');

    console.log('🎉 All tests passed successfully!');
    console.log('\n✅ Your Google Cloud Storage setup is working correctly!');
    console.log('You can now use it in your prescription system.\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. Your service account key file is at: backend/config/google-cloud-key.json');
    console.error('2. Your .env file has correct GOOGLE_CLOUD_PROJECT_ID and GOOGLE_CLOUD_BUCKET_NAME');
    console.error('3. Your service account has "Storage Object Admin" role');
    console.error('4. Your bucket exists and is accessible');
    console.error('\nError details:', error);
  }
}

// Run the test
testGoogleCloudStorage();