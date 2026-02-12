// Firebase Setup Script - Run this in browser console after Firebase setup
// This script will create initial data for your NEET Biology 360 platform

async function setupFirebaseData() {
  console.log("🚀 Setting up Firebase data for NEET Biology 360...");
  
  try {
    // Create sample courses
    const courses = [
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
      },
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
      },
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
      },
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
    ];

    // Add courses to Firestore
    for (const course of courses) {
      await db.collection('courses').doc(course.id).set(course);
      console.log(`✅ Created course: ${course.name}`);
    }

    // Create admin user (optional)
    const adminEmail = "admin@neetbiology360.com";
    try {
      const adminCredential = await auth.createUserWithEmailAndPassword(adminEmail, "admin123456");
      await db.collection('users').doc(adminCredential.user.uid).set({
        uid: adminCredential.user.uid,
        email: adminEmail,
        displayName: "Admin",
        role: "admin",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        purchasedCourses: [],
        testScores: [],
        downloadHistory: []
      });
      console.log(`✅ Created admin user: ${adminEmail}`);
    } catch (error) {
      console.log(`ℹ️ Admin user might already exist: ${error.message}`);
    }

    console.log("🎉 Firebase setup completed successfully!");
    console.log("📚 4 courses created");
    console.log("👤 Admin user created");
    console.log("🔐 You can now login with admin@neetbiology360.com / admin123456");

  } catch (error) {
    console.error("❌ Error setting up Firebase data:", error);
  }
}

// Function to verify setup
async function verifySetup() {
  console.log("🔍 Verifying Firebase setup...");
  
  try {
    // Check courses
    const coursesSnapshot = await db.collection('courses').get();
    console.log(`📚 Found ${coursesSnapshot.size} courses`);
    
    coursesSnapshot.forEach(doc => {
      console.log(`  - ${doc.data().name} (₹${doc.data().price})`);
    });

    // Check authentication
    const user = auth.currentUser;
    if (user) {
      console.log(`👤 Logged in as: ${user.email}`);
    } else {
      console.log("👤 Not logged in");
    }

    console.log("✅ Setup verification complete!");
    
  } catch (error) {
    console.error("❌ Error verifying setup:", error);
  }
}

// Export functions for console use
window.setupFirebaseData = setupFirebaseData;
window.verifySetup = verifySetup;

console.log("🔧 Firebase setup functions loaded!");
console.log("💡 Run setupFirebaseData() to create initial data");
console.log("💡 Run verifySetup() to check your setup");
