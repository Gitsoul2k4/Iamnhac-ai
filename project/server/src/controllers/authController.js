const User = require('../models/User'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
 
// --- DANG KY --- 
exports.register = async (req, res) => { 
    try { 
        const { username, email, password } = req.body; 
        let user = await User.findOne({ email }); 
        if (user) return res.status(400).json({ message: 'Email nay da ton tai' }); 
 
        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(password, salt); 
 
        user = new User({ username, email, password: hashedPassword }); 
        await user.save(); 
 
        res.status(201).json({ message: 'Dang ky thanh cong' }); 
    } catch (err) { 
        res.status(500).json({ message: 'Loi Server: ' + err.message }); 
    } 
}; 
 
// --- DANG NHAP --- 
exports.login = async (req, res) => { 
    try { 
        const { email, password } = req.body; 
        const user = await User.findOne({ email }); 
        if (!user) return res.status(400).json({ message: 'Email khong ton tai' }); 
 
        const isMatch = await bcrypt.compare(password, user.password); 
        if (!isMatch) return res.status(400).json({ message: 'Sai mat khau' }); 
 
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' }); 
 
        res.json({ 
            token, 
            user: { _id: user._id, username: user.username, role: user.role } 
        }); 
    } catch (err) { 
        res.status(500).json({ message: 'Loi Server: ' + err.message }); 
    } 
}; 
