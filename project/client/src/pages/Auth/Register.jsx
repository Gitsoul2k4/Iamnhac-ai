import React, { useState } from 'react'; 
import axios from 'axios'; 
import { useNavigate, Link } from 'react-router-dom'; 
import '../../styles/Auth.css'; 
 
const Register = () => { 
    const [formData, setFormData] = useState({ username: '', email: '', password: '' }); 
    const [error, setError] = useState(''); 
    const navigate = useNavigate(); 
 
    const handleChange = (e) => { 
        setFormData({ ...formData, [e.target.name]: e.target.value }); 
    }; 
 
    const handleSubmit = async (e) => { 
        e.preventDefault(); 
        try { 
            await axios.post('http://localhost:5000/api/auth/register', formData); 
            alert('Dang ky thanh cong! Hay dang nhap.'); 
            navigate('/login'); 
        } catch (err) { 
            setError(err.response ? err.response.data.message : 'Loi ket noi Server'); 
        } 
    }; 
 
    return ( 
        <div className="auth-container"> 
            <h2>Dang Ky Tai Khoan</h2> 
            {error && <div className="error-msg">{error}</div>} 
            <form onSubmit={handleSubmit}> 
                <div className="form-group"> 
                    <label>Ten nguoi dung:</label> 
                    <input type="text" name="username" onChange={handleChange} required /> 
                </div> 
                <div className="form-group"> 
                    <label>Email:</label> 
                    <input type="email" name="email" onChange={handleChange} required /> 
                </div> 
                <div className="form-group"> 
                    <label>Mat khau:</label> 
                    <input type="password" name="password" onChange={handleChange} required /> 
                </div> 
                <button type="submit">Dang Ky</button> 
            </form> 
            <p className="link-text">Da co tai khoan? <Link to="/login">Dang nhap</Link></p> 
        </div> 
    ); 
}; 
export default Register; 
