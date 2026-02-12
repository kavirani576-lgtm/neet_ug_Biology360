const axios = require('axios');

async function testPublicApi() {
    try {
        console.log('Testing Public Content API...');

        // 1. Fetch all content
        console.log('1. Fetching all content...');
        const resAll = await axios.get('http://localhost:3000/api/content');
        console.log(`   Status: ${resAll.status}`);
        console.log(`   Count: ${resAll.data.content ? resAll.data.content.length : 0}`);

        // 2. Fetch by type (notes)
        console.log('2. Fetching notes...');
        const resNotes = await axios.get('http://localhost:3000/api/content?type=notes');
        console.log(`   Status: ${resNotes.status}`);
        console.log(`   Count: ${resNotes.data.content ? resNotes.data.content.length : 0}`);
        if (resNotes.data.content.length > 0) {
            console.log(`   First Note: ${resNotes.data.content[0].title}`);
        }

        // 3. Fetch by chapter
        console.log('3. Fetching Chapter 1 content...');
        const resCh1 = await axios.get('http://localhost:3000/api/content?chapter_id=1');
        console.log(`   Status: ${resCh1.status}`);
        console.log(`   Count: ${resCh1.data.content ? resCh1.data.content.length : 0}`);

    } catch (error) {
        console.error('API Verification Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testPublicApi();
