import { useState } from 'react'

function GIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path d="M21 12h-9v3h5c-.5 2.5-2.4 3.5-5 3.5-3 0-5.5-2.5-5.5-5.5S9 7.5 12 7.5c1.3 0 2.4.5 3.3 1.3l2.3-2.3C16 5.2 14.1 4.5 12 4.5 7.6 4.5 4 8.1 4 12.5S7.6 20.5 12 20.5c6.1 0 7.5-5.2 7-8.5z" fill="currentColor"/>
    </svg>
  )
}
function FIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path d="M15 8h2V5h-2c-2 0-3 1-3 3v2H9v3h3v6h3v-6h2.2l.4-3H15V8c0-.6.3-1 1-1z" fill="currentColor"/>
    </svg>
  )
}
function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="5" y="10" width="14" height="10" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="15" r="2" fill="currentColor"/>
    </svg>
  )
}
function StarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path d="M12 2l2.8 6.4 6.7.6-5 4.4 1.6 6.6-6.1-3.6-6.1 3.6 1.6-6.6-5-4.4 6.7-.6z" fill="currentColor"/>
    </svg>
  )
}

export default function Auth({ token, setToken, onLogout }) {
  const [tab, setTab] = useState(token ? 'me' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')

  async function submit(path) {
    setMsg('')
    const userName = email.trim()
    const pass = password.trim()
    if (!userName || !pass) {
      setMsg('Username and password are required')
      return
    }
    const users = JSON.parse(localStorage.getItem('localAuthUsers') || '[]')
    if (path === 'register') {
      const exists = users.some(u => String(u.email).toLowerCase() === userName.toLowerCase())
      if (exists) {
        setMsg('Account already exists')
        return
      }
      users.push({
        id: crypto.randomUUID(),
        email: userName,
        password: pass,
        name: name.trim() || userName
      })
      localStorage.setItem('localAuthUsers', JSON.stringify(users))
      const nextToken = `local-${crypto.randomUUID()}`
      setToken(nextToken)
      setTab('me')
      return
    }
    const found = users.find(u => String(u.email).toLowerCase() === userName.toLowerCase() && u.password === pass)
    if (!found) {
      setMsg('Invalid account or password')
      return
    }
    const nextToken = `local-${found.id}`
    setToken(nextToken)
    setTab('me')
  }

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div className="brand-chip"><StarIcon /></div>
        <div className="brand-text">Field Report PWA</div>
      </div>
      <div className="auth-stage">
        <div className="auth-card">
          <div className="auth-title">
            <LockIcon style={{ marginRight: 6 }} />
            {tab === 'register' ? 'Create Account' : 'Welcome Back'}
          </div>
          <div className="auth-sub">
            {tab === 'register' ? 'Create your report workspace account' : 'Sign in to continue to your report workspace'}
          </div>
          <div className="auth-social">
            <button className="social-btn"><GIcon />G</button>
            <button className="social-btn"><FIcon />f</button>
          </div>
          {tab !== 'me' && (
            <div className="auth-form">
              {tab === 'register' && (
                <div className="auth-field">
                  <label>Name</label>
                  <input placeholder="Enter name" value={name} onChange={e => setName(e.target.value)} />
                </div>
              )}
              <div className="auth-field">
                <label>Username</label>
                <input placeholder="Enter username" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="auth-field">
                <label>Password</label>
                <input placeholder="Enter password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="auth-actions">
                {tab === 'login' ? (
                  <>
                    <button className="btn-ghost" onClick={() => setTab('register')}>← Go to Sign Up</button>
                    <button className="btn-primary" onClick={() => submit('login')}>Sign In</button>
                  </>
                ) : (
                  <>
                    <button className="btn-ghost" onClick={() => setTab('login')}>← Go to Sign In</button>
                    <button className="btn-primary" onClick={() => submit('register')}>Create Account</button>
                  </>
                )}
              </div>
              {msg && <div className="msg">{msg}</div>}
            </div>
          )}
          {tab === 'me' && (
            <div className="auth-actions">
              <button className="btn-primary" onClick={onLogout}>Sign Out</button>
            </div>
          )}
        </div>
      </div>
      <div className="auth-footer">
        <div className="auth-footer-text">
          Sign in to create and manage reports.
        </div>
      </div>
    </div>
  )
}
