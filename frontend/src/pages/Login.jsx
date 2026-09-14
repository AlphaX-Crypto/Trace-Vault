import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, User, Terminal } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock login delay
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-header">
          <div className="icon-wrapper">
            <ShieldAlert size={48} className="brand-icon" />
          </div>
          <h1>TRACEVAULT</h1>
          <span className="subtitle mono">CHAIN INTELLIGENCE</span>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input type="text" placeholder="Investigator ID" required defaultValue="INV-001" className="input-field" />
            </div>
          </div>
          
          <div className="form-group">
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input type="password" placeholder="Passcode" required defaultValue="******" className="input-field" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="mono">AUTHENTICATING...</span>
            ) : (
              <>
                <Terminal size={18} />
                <span>ACCESS TERMINAL</span>
              </>
            )}
          </button>
        </form>

        <div className="system-notice mono">
          <p>UNAUTHORIZED ACCESS STRICTLY PROHIBITED</p>
          <p>ALL ACTIVITIES ARE LOGGED</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
