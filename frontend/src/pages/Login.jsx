import {useState} from 'react'
import {LockKeyhole,ShieldCheck} from 'lucide-react'
import {Navigate,useNavigate} from 'react-router-dom'
import {authenticate,isAuthenticated} from '../utils/mockAuth'
import './login.css'

export default function Login(){
  const navigate=useNavigate()
  const [identifier,setIdentifier]=useState('')
  const [password,setPassword]=useState('')
  const [remember,setRemember]=useState(true)

  if(isAuthenticated())return <Navigate to="/dashboard" replace/>

  function handleSubmit(event){
    event.preventDefault()
    if(!identifier.trim()||!password)return
    authenticate({remember})
    navigate('/dashboard',{replace:true})
  }

  return <main className="login-page">
    <video className="login-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" tabIndex="-1">
      <source src="/videos/tracevault-login-bg.mp4" type="video/mp4"/>
    </video>
    <div className="login-overlay" aria-hidden="true"/>
    <section className="login-intro" aria-label="TRACEVAULT">
      <div className="login-brand"><span className="login-brand-mark"><ShieldCheck/></span><span><strong>TRACEVAULT</strong><small>CHAIN INTELLIGENCE</small></span></div>
      <p>Follow the movement.<br/>Preserve the evidence.</p>
      <span>Blockchain investigation workspace</span>
    </section>
    <section className="login-panel" aria-labelledby="login-title">
      <header>
        <span className="login-security-mark"><LockKeyhole/></span>
        <div><p>Secure workspace</p><h1 id="login-title">Investigator Sign In</h1></div>
      </header>
      <p className="login-instruction">Enter your authorized investigator credentials to access active cases and intelligence records.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="investigator-id">Investigator ID / Email</label>
        <input id="investigator-id" name="identifier" autoComplete="username" value={identifier} onChange={event=>setIdentifier(event.target.value)} placeholder="investigator@tracevault.demo" required autoFocus/>
        <label htmlFor="investigator-password">Password</label>
        <input id="investigator-password" name="password" type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} placeholder="Enter password" required/>
        <label className="remember-control"><input type="checkbox" checked={remember} onChange={event=>setRemember(event.target.checked)}/><span>Remember me on this device</span></label>
        <button className="login-submit" type="submit">Sign In</button>
      </form>
      <div className="login-access-note"><ShieldCheck/><span><strong>Authorized access only</strong>Activity within this environment may be monitored and recorded.</span></div>
      <p className="login-demo-note">Demo access accepts any non-empty ID and password.</p>
    </section>
  </main>
}
