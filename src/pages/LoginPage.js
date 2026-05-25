import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-box">
          <div className="login-logo">it.<em>lex</em></div>
          <div className="login-tagline">Portal CRM · Gestión de clientes</div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@empresa.com" required />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 20px' }} disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar →'}
            </button>
            {error && <div className="login-error">⚠ {error}</div>}
          </form>

          <div className="login-divider" />

          <div style={{ fontSize: '0.78rem', color: 'var(--gray-light)', lineHeight: 1.8 }}>
            <div style={{ marginBottom: 6, fontWeight: 500, color: 'var(--gray)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tipos de acceso</div>
            <div><span style={{ color: 'var(--ink)', fontWeight: 500 }}>Administrador</span> — Panel completo del CRM</div>
            <div><span style={{ color: 'var(--ink)', fontWeight: 500 }}>Cliente</span> — Vista de su información exclusivamente</div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-right-quote">
          "Ganar en el mercado estatal es nuestra <em>especialidad.</em>"
        </div>
        <div className="login-right-caption">it.lex · Costa Rica</div>
      </div>
    </div>
  )
}
