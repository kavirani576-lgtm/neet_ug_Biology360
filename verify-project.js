const http = require('http');
const fs = require('fs');
const path = require('path');

function fetch(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        }).on('error', reject);
    });
}

async function verify() {
    console.log("Starting Verification...\n");
    let errors = 0;

    // 1. Verify Image
    try {
        console.log("1. Checking Hero Image...");
        const imgRes = await fetch('http://localhost:3000/images/hero.png');
        if (imgRes.status === 200 && imgRes.data.length > 0) {
            console.log("   ✅ Image found and served accessible.");
        } else {
            console.log(`   ❌ Image failed: Status ${imgRes.status}`);
            errors++;
        }
    } catch (e) {
        console.log(`   ❌ Image check failed: ${e.message}`);
        errors++;
    }

    // 2. Verify Google Sign-In in Auth HTML
    try {
        console.log("\n2. Checking Google Sign-In Button in Auth Page...");
        const authRes = await fetch('http://localhost:3000/auth.html');
        if (authRes.data.includes('googleLogin()') && authRes.data.includes('Sign in with Google')) {
            console.log("   ✅ Google Sign-In button present in HTML.");
        } else {
            console.log("   ❌ Google Sign-In button MISSING in HTML.");
            errors++;
        }
    } catch (e) {
        console.log(`   ❌ Auth page check failed: ${e.message}`);
        errors++;
    }

    // 3. Verify Purchase Protection in Chapter 1
    try {
        console.log("\n3. Checking Purchase Protection in Chapter 1...");
        // Fetching the file directly since we modified it and served it
        const chapterRes = await fetch('http://localhost:3000/ncert-notes/chapter-1/index.html');
        if (chapterRes.data.includes('localStorage.getItem(\'neet_token\')') && chapterRes.data.includes('window.location.href = \'../../auth.html\'')) {
            console.log("   ✅ Purchase protection logic detected.");
        } else {
            console.log("   ❌ Purchase protection logic MISSING.");
            errors++;
        }

        // Also check if image path is correct in HTML
        if (chapterRes.data.includes('../../images/hero.png')) {
            console.log("   ✅ Local image path verified.");
        } else {
            console.log("   ❌ Local image path incorrect.");
            errors++;
        }

    } catch (e) {
        console.log(`   ❌ Chapter 1 page check failed: ${e.message}`);
        errors++;
    }

    // 4. Verify Auth JS Logic (Redirection)
    try {
        console.log("\n4. Checking Auth JS Logic...");
        const authJs = fs.readFileSync(path.join(__dirname, 'js/auth.js'), 'utf8');
        if (authJs.includes('dashboard.html')) {
            console.log("   ✅ Redirection to dashboard.html found.");
        } else {
            console.log("   ❌ Redirection to dashboard.html MISSING.");
            errors++;
        }
        if (authJs.includes('confirm(')) {
            console.log("   ✅ Google Consent Dialog found.");
        } else {
            console.log("   ❌ Google Consent Dialog MISSING.");
            errors++;
        }

    } catch (e) {
        console.log(`   ❌ Auth JS check failed: ${e.message}`);
        errors++;
    }

    console.log(`\nVerification Complete. ${errors} errors found.`);
}

verify();
