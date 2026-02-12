# Firebase Setup Guide - NEET UG Biology 360

## 🚀 Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Project name: `neet-biology-360`
4. Enable Google Analytics (optional)
5. Click "Create project"

## 🔧 Step 2: Enable Firebase Services

### Authentication:
1. Go to "Authentication" → "Get started"
2. Enable "Email/Password" sign-in method
3. Save settings

### Firestore Database:
1. Go to "Firestore Database" → "Create database"
2. Choose "Start in test mode" (for development)
3. Select a location (choose nearest to your users)
4. Create database

### Storage:
1. Go to "Storage" → "Get started"
2. Start in test mode
3. Select location
4. Enable storage

## 📋 Step 3: Get Firebase Configuration

1. Go to Project Settings (⚙️ icon)
2. Scroll down to "Firebase SDK snippet"
3. Copy the configuration object
4. Replace the config in `js/firebase-config.js`

## 🗄️ Step 4: Set Up Firestore Security Rules

Go to Firestore → Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read courses
    match /courses/{courseId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Only authenticated users can create transactions
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null;
    }
    
    // Test results
    match /test_results/{testId} {
      allow read, write: if request.auth != null;
    }
    
    // Chatbot interactions
    match /chatbot_interactions/{interactionId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📁 Step 5: Set Up Storage Security Rules

Go to Storage → Rules and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Only authenticated users can access their files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public course materials
    match /courses/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🎯 Step 6: Update Firebase Configuration

Replace the content of `js/firebase-config.js` with your actual config:

```javascript
// Firebase Configuration
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence
db.enablePersistence()
  .then(() => {
    console.log("Firestore offline persistence enabled");
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === 'unimplemented') {
      console.log("The current browser does not support persistence.");
    }
  });

// Export Firebase services
window.firebaseServices = {
  auth,
  db,
  storage
};
```

## 📊 Step 7: Create Initial Data

### Create Sample Courses in Firestore:

Go to Firestore → Start collection → "courses" and add these documents:

#### Document 1: ncert-notes
```javascript
{
  id: "ncert-notes",
  name: "NCERT Line-to-Line Notes",
  description: "Detailed biology notes strictly based on NCERT curriculum, organized chapter-wise with comprehensive explanations.",
  price: 999,
  originalPrice: 1499,
  image: "https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=NCERT+Notes",
  features: [
    "Chapter-wise NCERT notes",
    "PDF + online viewer",
    "Digital + hardcopy option",
    "Detailed explanations",
    "Exam-focused content",
    "Regular updates"
  ],
  category: "notes",
  rating: 4.8,
  students: 2500,
  duration: "Lifetime Access",
  status: "active",
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
}
```

#### Document 2: mcq-course
```javascript
{
  id: "mcq-course",
  name: "MCQ Chapter-wise Course",
  description: "2100+ MCQs including case-based questions with chapter-wise categorization and detailed explanations.",
  price: 1299,
  originalPrice: 1999,
  image: "https://via.placeholder.com/300x200/10B981/FFFFFF?text=MCQ+Course",
  features: [
    "2100+ MCQs",
    "Case-based questions",
    "Chapter-wise categorization",
    "Answer key + explanations",
    "Progress tracking",
    "Performance analysis"
  ],
  category: "practice",
  rating: 4.7,
  students: 3200,
  duration: "Lifetime Access",
  status: "active",
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
}
```

#### Document 3: mock-tests
```javascript
{
  id: "mock-tests",
  name: "Mock Test Series - Biology Only",
  description: "20 Full-Length Mock Tests with timer-based interface, auto evaluation, and detailed performance analysis.",
  price: 1599,
  originalPrice: 2499,
  image: "https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Mock+Tests",
  features: [
    "20 Full-Length Mock Tests",
    "90 questions per test",
    "360 marks total",
    "Timer-based interface",
    "Auto evaluation",
    "Rank & scorecard"
  ],
  category: "tests",
  rating: 4.9,
  students: 1800,
  duration: "6 Months",
  status: "active",
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
}
```

#### Document 4: diagram-booklet
```javascript
{
  id: "diagram-booklet",
  name: "NCERT Diagram-Based Booklet",
  description: "High-quality biology diagrams from NCERT, perfect for visual learning and quick revision.",
  price: 799,
  originalPrice: 1299,
  image: "https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=Diagram+Booklet",
  features: [
    "High-quality diagrams",
    "NCERT-focused",
    "Visual learning aid",
    "Revision friendly",
    "Digital + hardcopy",
    "Printable format"
  ],
  category: "visual",
  rating: 4.6,
  students: 2100,
  duration: "Lifetime Access",
  status: "active",
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
}
```

## 🔐 Step 8: Test the Setup

1. Open `http://localhost:8080` in your browser
2. Try to sign up with a new account
3. Check if user data is created in Firestore
4. Test course purchases
5. Verify dashboard functionality

## 🎉 Done! 

Your NEET UG Biology 360 platform now has full Firebase functionality including:
- ✅ User Authentication
- ✅ Real-time Database
- ✅ File Storage
- ✅ Security Rules
- ✅ Offline Support

## 🚨 Important Notes:

1. **For Production**: Change Firestore rules from test mode to production rules
2. **Security**: Implement proper validation and security measures
3. **Scaling**: Consider Firebase pricing tiers as your user base grows
4. **Backup**: Regularly backup your Firestore data
