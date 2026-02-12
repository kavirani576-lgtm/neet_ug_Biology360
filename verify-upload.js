const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginResponse = await axios.post('http://localhost:3000/api/admin/login', {
            email: 'rchhaba644@gmail.com',
            password: 'rohit12345'
        });

        const token = loginResponse.data.token;
        console.log('Token obtained:', token ? 'Yes' : 'No');

        // 2. Prepare file
        const filePath = path.join(__dirname, 'test_upload.txt');
        fs.writeFileSync(filePath, 'This is a test content for upload verification.');

        // 3. Upload
        console.log('Uploading file...');
        const form = new FormData();
        form.append('title', 'Test Upload via Script');
        form.append('type', 'notes');
        form.append('content', 'This is a test note created by verification script');
        form.append('chapter_id', '1');
        form.append('file', fs.createReadStream(filePath));

        const uploadResponse = await axios.post('http://localhost:3000/api/admin/content', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Upload successful!');
        console.log('Response:', uploadResponse.data);

        if (uploadResponse.data.fileUrl) {
            console.log('File URL:', uploadResponse.data.fileUrl);
            // Verify file exists
            try {
                const fileCheck = await axios.get(`http://localhost:3000${uploadResponse.data.fileUrl}`);
                console.log('File access verified: OK');
            } catch (e) {
                console.error('Failed to access uploaded file:', e.message);
            }
        }

    } catch (error) {
        console.error('Verification failed:', error.response ? error.response.data : error.message);
    }
}

testUpload();
