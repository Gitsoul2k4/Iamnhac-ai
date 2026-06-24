const mongoose = require('mongoose'); 
const User = require('./src/models/User'); 
require('dotenv').config(); 
 
console.log('Dang ket noi Database...'); 
mongoose.connect(process.env.MONGO_URI) 
  .then(async () => { 
      console.log('SUCCESS! Dang lay du lieu...'); 
      const users = await User.find({}, 'username email role'); 
      console.log('------------------------------------------------'); 
      if (users.length === 0) { 
          console.log('Chua co tai khoan nao!'); 
      } else { 
          users.forEach(u => { 
