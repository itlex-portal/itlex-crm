import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import AdminDashboard from './pages/AdminDashboard'
import ClientPortal from './pages/ClientPortal'
import LoginPage from './pages/LoginPage'
import './App.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else { setUserRole(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchRole(userId) {
    const { data } = await supabase.from('profiles').select('role, client_id').eq('id', userId).single()
    setUserRole(data)
    setLoading(false)
  }

  if (loading) return (
    <div className="splash">
      <div className="splash-logo">it.<em>lex</em></div>
      <div className="splash-bar"><div className="splash-progress" /></div>
    </div>
  )

  if (!session) return <LoginPage />
  if (userRole?.role === 'admin') return <AdminDashboard user={session.user} />
  if (userRole?.role === 'client') return <ClientPortal user={session.user} clientId={userRole.client_id} />
  return <div className="splash"><p style={{color:'var(--gray)'}}>Configurando acceso...</p></div>
}
