import React, { useState } from 'react'; 
import axios from 'axios'; 
import { useNavigate, Link } from 'react-router-dom'; 
import '../../styles/Auth.css'; 
 
const Login = () => { 
    const [formData, setFormData] = useState({ email: '', password: '' }); 
    const [error, setError] = useState(''); 
    const navigate = useNavigate(); 
 
    const handleChange = (e) => { 
        setFormData({ ...formData, [e.target.name]: e.target.value }); 
    }; 
 
    const handleSubmit = async (e) => { 
        e.preventDefault(); 
        try { 
            const res = await axios.post('http://localhost:5000/api/auth/login', formData); 
            localStorage.setItem('token', res.data.token); 
            localStorage.setItem('user', JSON.stringify(res.data.user)); 
            alert('Dang nhap thanh cong!'); 
            window.location.href = '/'; 
        } catch (err) { 
            setError(err.response ? err.response.data.message : 'Sai thong tin dang nhap'); 
        } 
    }; 
 
    return ( 
        <div className="auth-container"> 
            <h2>Dang Nhap</h2> 
            {error && <div className="error-msg">{error}</div>} 
            <form onSubmit={handleSubmit}> 
                <div className="form-group"> 
                    <label>Email:</label> 
                    <input type="email" name="email" onChange={handleChange} required /> 
                </div> 
                <div className="form-group"> 
                    <label>Mat khau:</label> 
                    <input type="password" name="password" onChange={handleChange} required /> 
                </div> 
                <button type="submit">Dang Nhap</button> 
            </form> 
            <p className="link-text">Chua co tai khoan? <Link to="/register">Dang ky</Link></p> 
        </div> 
    ); 
}; 
export default Login; 
