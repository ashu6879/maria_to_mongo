const mysql = require('mysql');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// MySQL connection configuration
const mysqlConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
};

// MongoDB connection configuration
const mongoUrl = process.env.MONGO_URL;
const mongoDbName = process.env.MONGO_DB_NAME;

async function syncData() {
  // Establish a new MySQL connection for each sync cycle
  const mysqlConnection = mysql.createConnection(mysqlConfig);

  mysqlConnection.connect(err => {
    if (err) {
      console.error('MySQL connection error:', err);
      return;
    }

    // Query data from MySQL
    mysqlConnection.query('SELECT * FROM projectcategories', async (error, results) => {
      if (error) {
        console.error('MySQL query error:', error);
        mysqlConnection.end();
        return;
      }

      try {
        // Connect to MongoDB
        const mongoClient = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
        await mongoClient.connect();
        const mongoDb = mongoClient.db(mongoDbName);
        const mongoCollection = mongoDb.collection('projectcategories');

        // Clear the existing data in MongoDB collection
        await mongoCollection.deleteMany({});

        // Insert new data into MongoDB
        await mongoCollection.insertMany(results);

        // Close MongoDB connection
        await mongoClient.close();
        console.log('Data synced successfully');
      } catch (mongoError) {
        console.error('MongoDB error:', mongoError);
      } finally {
        // Close MySQL connection
        mysqlConnection.end();
      }
    });
  });
}

// Schedule the sync function to run at regular intervals (every second)
// setInterval(syncData, 1000); // Every second

// Run sync immediately
syncData();
