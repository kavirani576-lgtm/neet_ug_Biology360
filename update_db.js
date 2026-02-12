const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./neet.db');

db.run("ALTER TABLE content ADD COLUMN file_url TEXT", (err) => {
    if (err) {
        console.log('Column might already exist or error:', err.message);
    } else {
        console.log('Column added successfully.');
    }
    db.close();
});
