/**
 * Test script to verify the upload flow from Unified Landing Page to Business Compass
 */

const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const SHARED_STORAGE_URL = 'http://localhost:8080';
const BUSINESS_COMPASS_URL = 'http://localhost:3000';

async function testUploadFlow() {
  console.log('🧪 Testing Upload Flow\n');
  
  // Step 1: Upload files to shared storage
  console.log('📤 Step 1: Uploading files to shared storage...');
  
  const formData = new FormData();
  formData.append('uploadMode', 'combined');
  formData.append('combined', fs.createReadStream('./RAW_ALL BRANCES_COMBINED.csv'));
  
  try {
    const uploadResponse = await axios.post(`${SHARED_STORAGE_URL}/api/upload`, formData, {
      headers: formData.getHeaders(),
      timeout: 60000
    });
    
    if (uploadResponse.data.success) {
      const sessionId = uploadResponse.data.sessionId;
      console.log('✅ Files uploaded successfully!');
      console.log(`   Session ID: ${sessionId}\n`);
      
      // Step 2: Verify session exists
      console.log('🔍 Step 2: Verifying session...');
      const sessionResponse = await axios.get(`${SHARED_STORAGE_URL}/api/session/${sessionId}`);
      
      if (sessionResponse.data.success) {
        console.log('✅ Session found!');
        console.log(`   Upload Mode: ${sessionResponse.data.session.uploadMode}`);
        console.log(`   Files: ${Object.keys(sessionResponse.data.session.files).join(', ')}\n`);
        
        // Step 3: Test file download
        console.log('⬇️  Step 3: Testing file download...');
        const fileKey = Object.keys(sessionResponse.data.session.files)[0];
        const fileResponse = await axios.get(
          `${SHARED_STORAGE_URL}/api/session/${sessionId}/file/${fileKey}`,
          { responseType: 'arraybuffer' }
        );
        
        console.log('✅ File download successful!');
        console.log(`   Downloaded ${fileResponse.data.byteLength} bytes\n`);
        
        // Step 4: Show Business Compass URL
        console.log('🎯 Step 4: Business Compass URL:');
        console.log(`   ${BUSINESS_COMPASS_URL}/setup?sessionId=${sessionId}\n`);
        console.log('🌐 Open this URL in your browser to test the complete flow!\n');
        
      } else {
        console.error('❌ Session not found');
      }
    } else {
      console.error('❌ Upload failed:', uploadResponse.data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

testUploadFlow();
