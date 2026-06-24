const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log('------------------------------------------------');
        console.log('✅ KET NOI MONGODB THANH CONG: ' + conn.connection.host);
        console.log('------------------------------------------------');
    } catch (error) {
        console.error('❌ LOI KET NOI: ' + error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
