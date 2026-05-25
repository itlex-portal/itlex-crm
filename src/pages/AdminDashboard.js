import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { differenceInDays, format, parseISO } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const SECTIONS = [
  { id: 'dashboard', label: 'Resumen' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'garantias', label: 'Garantías' },
  { id: 'licitaciones', label: 'Licitaciones' },
  { id: 'subsanes', label: 'Subsanes' },
  { id: 'alertas', label: 'Alertas' },
]

function daysUntil(d) { if (!d) return null; return differenceInDays(parseISO(d), new Date()) }

function DaysBadge({ days }) {
  if (days === null) return null
  if (days < 0) return <span className="days-pill days-critical">Vencido</span>
  if (days <= 30) return <span className="days-pill days-critical">{days}d</span>
  if (days <= 90) return <span className="days-pill days-warning">{days}d</span>
  return <span className="days-pill days-ok">{days}d</span>
}

function StatusBadge({ status }) {
  const map = {
    activo: ['badge-green','Activo'], vencido: ['badge-red','Vencido'], pendiente: ['badge-yellow','Pendiente'],
    adjudicado: ['badge-green','Adjudicado'], perdido: ['badge-red','Perdido'],
    en_proceso: ['badge-blue','En proceso'], resuelto: ['badge-green','Resuelto'], abierto: ['badge-yellow','Abierto'],
  }
  const [cls, label] = map[status] || ['badge-gray', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div className="modal-title">{title}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--gray)', fontSize:'1.5rem', cursor:'pointer', lineHeight:1, padding:'0 4px' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function DashboardSection({ clientes, garantias, licitaciones, subsanes }) {
  const urgentes = [
    ...garantias.filter(g => { const d = daysUntil(g.fecha_vencimiento); return d !== null && d <= 90 })
      .map(g => ({ tipo:'Garantía', cliente:g.clientes?.nombre, texto:g.nombre, dias:daysUntil(g.fecha_vencimiento), nivel: daysUntil(g.fecha_vencimiento)<=30?'danger':'warning' })),
    ...licitaciones.filter(l => { const d = daysUntil(l.fecha_cierre); return d!==null && d<=30 })
      .map(l => ({ tipo:'Licitación', cliente:l.clientes?.nombre, texto:l.nombre, dias:daysUntil(l.fecha_cierre), nivel:'info' })),
    ...subsanes.filter(s => s.status==='abierto')
      .map(s => ({ tipo:'Subsane', cliente:s.clientes?.nombre, texto:s.descripcion, dias:daysUntil(s.fecha_limite), nivel:'warning' })),
  ].sort((a,b) => (a.dias??999)-(b.dias??999)).slice(0,6)

  const chartData = [
    { name:'Garantías', valor: garantias.length },
    { name:'Licitaciones', valor: licitaciones.filter(l=>l.status==='en_proceso').length },
    { name:'Subsanes', valor: subsanes.filter(s=>s.status==='abierto').length },
    { name:'Adjudicadas', valor: licitaciones.filter(l=>l.status==='adjudicado').length },
  ]

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="card-title">Clientes</div>
          <div className="stat-number">{clientes.length}</div>
          <div className="stat-accent">cartera activa</div>
        </div>
        <div className="stat-card">
          <div className="card-title">Garantías por vencer</div>
          <div className="stat-number" style={{color:'var(--warning)'}}>
            {garantias.filter(g=>{ const d=daysUntil(g.fecha_vencimiento); return d!==null&&d>=0&&d<=90 }).length}
          </div>
          <div className="stat-accent">próximos 90 días</div>
        </div>
        <div className="stat-card">
          <div className="card-title">Licitaciones abiertas</div>
          <div className="stat-number" style={{color:'var(--info)'}}>
            {licitaciones.filter(l=>l.status==='en_proceso').length}
          </div>
          <div className="stat-accent">en proceso</div>
        </div>
        <div className="stat-card">
          <div className="card-title">Subsanes pendientes</div>
          <div className="stat-number" style={{color:'var(--danger)'}}>
            {subsanes.filter(s=>s.status==='abierto').length}
          </div>
          <div className="stat-accent">requieren atención</div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:16, marginBottom:24}}>
        <div className="card">
          <div className="card-title">Actividad general</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={32}>
              <XAxis dataKey="name" tick={{fill:'var(--gray-light)', fontSize:11, fontFamily:'DM Sans'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'var(--gray-light)', fontSize:11}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{background:'var(--white)', border:'1px solid var(--border)', borderRadius:6, fontSize:12, fontFamily:'DM Sans', boxShadow:'var(--shadow)'}} cursor={{fill:'var(--cream)'}} />
              <Bar dataKey="valor" radius={[3,3,0,0]}>
                <Cell fill="var(--ink)" />
                <Cell fill="var(--info)" />
                <Cell fill="var(--warning)" />
                <Cell fill="var(--success)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title" style={{marginBottom:14}}>Alertas prioritarias</div>
          {urgentes.length === 0
            ? <p style={{color:'var(--gray-light)', fontSize:'0.85rem', paddingTop:8}}>Sin alertas activas</p>
            : urgentes.map((a,i) => (
              <div key={i} className={`alert-strip alert-${a.nivel}`} style={{marginBottom:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:'0.68rem', opacity:0.7, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:2}}>{a.tipo} · {a.cliente}</div>
                  <div style={{fontWeight:500, fontSize:'0.83rem'}}>{a.texto}</div>
                </div>
                {a.dias !== null && <DaysBadge days={a.dias} />}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

function ClientesSection({ clientes, refresh }) {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nombre:'', email:'', telefono:'', empresa:'', notas:'' })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('clientes').insert([form])
    setSaving(false); setModal(false); refresh()
    setForm({ nombre:'', email:'', telefono:'', empresa:'', notas:'' })
  }

  async function createLogin(cliente) {
    const pass = Math.random().toString(36).slice(-10)
    const { data, error } = await supabase.auth.admin.createUser({ email: cliente.email, password: pass, email_confirm: true })
    if (!error) {
      await supabase.from('profiles').insert([{ id: data.user.id, role:'client', client_id: cliente.id }])
      alert(`✅ Acceso creado\nEmail: ${cliente.email}\nContraseña temporal: ${pass}`)
    } else alert('Error: ' + error.message)
  }

  return (
    <div>
      <div className="section-header">
        <span className="section-count">{clientes.length} registros</span>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nuevo cliente</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Cliente</th><th>Empresa</th><th>Contacto</th><th>Acceso</th></tr></thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.id}>
                  <td style={{fontWeight:500}}>{c.nombre}</td>
                  <td style={{color:'var(--gray)', fontSize:'0.84rem'}}>{c.empresa || '—'}</td>
                  <td>
                    <div style={{fontSize:'0.83rem'}}>{c.email}</div>
                    <div style={{fontSize:'0.75rem', color:'var(--gray-light)'}}>{c.telefono}</div>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => createLogin(c)}>🔑 Crear acceso</button>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && <tr><td colSpan={4} style={{textAlign:'center', color:'var(--gray-light)', padding:40}}>Sin clientes registrados</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title="Nuevo cliente" onClose={() => setModal(false)}>
          {['nombre','empresa','email','telefono'].map(f => (
            <div className="form-group" key={f}>
              <label>{f.charAt(0).toUpperCase()+f.slice(1)}</label>
              <input type={f==='email'?'email':'text'} value={form[f]} onChange={e => setForm({...form,[f]:e.target.value})} />
            </div>
          ))}
          <div className="form-group"><label>Notas internas</label><textarea value={form.notas} onChange={e => setForm({...form,notas:e.target.value})} /></div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Guardando...':'Guardar cliente'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function GarantiasSection({ garantias, clientes, refresh }) {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ cliente_id:'', nombre:'', descripcion:'', fecha_inicio:'', fecha_vencimiento:'', monto:'', status:'activo' })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('garantias').insert([form])
    setSaving(false); setModal(false); refresh()
  }

  const sorted = [...garantias].sort((a,b) => (daysUntil(a.fecha_vencimiento)??9999)-(daysUntil(b.fecha_vencimiento)??9999))

  return (
    <div>
      <div className="section-header">
        <span className="section-count">{garantias.length} garantías</span>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nueva garantía</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Garantía</th><th>Cliente</th><th>Vencimiento</th><th>Días</th><th>Monto</th><th>Estado</th></tr></thead>
            <tbody>
              {sorted.map(g => (
                <tr key={g.id}>
                  <td>
                    <div style={{fontWeight:500}}>{g.nombre}</div>
                    <div style={{fontSize:'0.75rem', color:'var(--gray-light)'}}>{g.descripcion}</div>
                  </td>
                  <td style={{color:'var(--gray)', fontSize:'0.84rem'}}>{g.clientes?.nombre}</td>
                  <td style={{fontFamily:'var(--font-mono)', fontSize:'0.82rem'}}>
                    {g.fecha_vencimiento ? format(parseISO(g.fecha_vencimiento),'dd/MM/yyyy') : '—'}
                  </td>
                  <td><DaysBadge days={daysUntil(g.fecha_vencimiento)} /></td>
                  <td style={{fontFamily:'var(--font-mono)', fontSize:'0.82rem'}}>
                    {g.monto ? `₡${Number(g.monto).toLocaleString()}` : '—'}
                  </td>
                  <td><StatusBadge status={g.status} /></td>
                </tr>
              ))}
              {garantias.length === 0 && <tr><td colSpan={6} style={{textAlign:'center', color:'var(--gray-light)', padding:40}}>Sin garantías registradas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title="Nueva garantía" onClose={() => setModal(false)}>
          <div className="form-group">
            <label>Cliente</label>
            <select value={form.cliente_id} onChange={e => setForm({...form,cliente_id:e.target.value})}>
              <option value="">Seleccionar...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Nombre de la garantía</label><input type="text" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} /></div>
          <div className="form-group"><label>Descripción</label><textarea value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} /></div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
            <div className="form-group"><label>Fecha inicio</label><input type="date" value={form.fecha_inicio} onChange={e=>setForm({...form,fecha_inicio:e.target.value})} /></div>
            <div className="form-group"><label>Fecha vencimiento</label><input type="date" value={form.fecha_vencimiento} onChange={e=>setForm({...form,fecha_vencimiento:e.target.value})} /></div>
          </div>
          <div className="form-group"><label>Monto (₡)</label><input type="number" value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})} /></div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Guardando...':'Guardar'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function LicitacionesSection({ licitaciones, clientes, refresh }) {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ cliente_id:'', nombre:'', numero_expediente:'', entidad:'', monto_estimado:'', fecha_publicacion:'', fecha_cierre:'', status:'en_proceso', oportunidad:'' })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('licitaciones').insert([form])
    setSaving(false); setModal(false); refresh()
  }

  return (
    <div>
      <div className="section-header">
        <span className="section-count">{licitaciones.length} expedientes</span>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nueva licitación</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Expediente</th><th>Cliente</th><th>Entidad</th><th>Cierre</th><th>Monto</th><th>Estado</th></tr></thead>
            <tbody>
              {licitaciones.map(l => (
                <tr key={l.id}>
                  <td>
                    <div style={{fontFamily:'var(--font-mono)', fontSize:'0.72rem', color:'var(--gray-light)', marginBottom:2}}>{l.numero_expediente}</div>
                    <div style={{fontWeight:500}}>{l.nombre}</div>
                    {l.oportunidad && <div style={{fontSize:'0.72rem', color:'var(--gold)', marginTop:2}}>★ {l.oportunidad}</div>}
                  </td>
                  <td style={{color:'var(--gray)', fontSize:'0.84rem'}}>{l.clientes?.nombre}</td>
                  <td style={{fontSize:'0.82rem', color:'var(--gray)'}}>{l.entidad}</td>
                  <td>
                    <div style={{fontFamily:'var(--font-mono)', fontSize:'0.78rem'}}>{l.fecha_cierre ? format(parseISO(l.fecha_cierre),'dd/MM/yyyy') : '—'}</div>
                    <DaysBadge days={daysUntil(l.fecha_cierre)} />
                  </td>
                  <td style={{fontFamily:'var(--font-mono)', fontSize:'0.78rem'}}>{l.monto_estimado ? `₡${Number(l.monto_estimado).toLocaleString()}` : '—'}</td>
                  <td><StatusBadge status={l.status} /></td>
                </tr>
              ))}
              {licitaciones.length === 0 && <tr><td colSpan={6} style={{textAlign:'center', color:'var(--gray-light)', padding:40}}>Sin licitaciones registradas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title="Nueva licitación" onClose={() => setModal(false)}>
          <div className="form-group"><label>Cliente</label>
            <select value={form.cliente_id} onChange={e=>setForm({...form,cliente_id:e.target.value})}>
              <option value="">Seleccionar...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Número de expediente</label><input type="text" value={form.numero_expediente} onChange={e=>setForm({...form,numero_expediente:e.target.value})} placeholder="2026LD-00001" /></div>
          <div className="form-group"><label>Nombre / descripción</label><input type="text" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} /></div>
          <div className="form-group"><label>Entidad licitante</label><input type="text" value={form.entidad} onChange={e=>setForm({...form,entidad:e.target.value})} /></div>
          <div className="form-group"><label>Oportunidad estratégica</label><input type="text" value={form.oportunidad} onChange={e=>setForm({...form,oportunidad:e.target.value})} placeholder="Alta probabilidad — proveedor único..." /></div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
            <div className="form-group"><label>Fecha publicación</label><input type="date" value={form.fecha_publicacion} onChange={e=>setForm({...form,fecha_publicacion:e.target.value})} /></div>
            <div className="form-group"><label>Fecha cierre</label><input type="date" value={form.fecha_cierre} onChange={e=>setForm({...form,fecha_cierre:e.target.value})} /></div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
            <div className="form-group"><label>Monto estimado (₡)</label><input type="number" value={form.monto_estimado} onChange={e=>setForm({...form,monto_estimado:e.target.value})} /></div>
            <div className="form-group"><label>Estado</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="en_proceso">En proceso</option>
                <option value="adjudicado">Adjudicado</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Guardando...':'Guardar'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SubsanesSection({ subsanes, clientes, refresh }) {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ cliente_id:'', descripcion:'', origen:'', fecha_limite:'', status:'abierto', notas:'' })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('subsanes').insert([form])
    setSaving(false); setModal(false); refresh()
  }

  async function toggleStatus(s) {
    await supabase.from('subsanes').update({ status: s.status==='abierto'?'resuelto':'abierto' }).eq('id', s.id)
    refresh()
  }

  return (
    <div>
      <div className="section-header">
        <span className="section-count">{subsanes.filter(s=>s.status==='abierto').length} abiertos · {subsanes.filter(s=>s.status==='resuelto').length} resueltos</span>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nuevo subsane</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Descripción</th><th>Cliente</th><th>Origen</th><th>Límite</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {subsanes.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{fontWeight:500, maxWidth:260}}>{s.descripcion}</div>
                    {s.notas && <div style={{fontSize:'0.73rem', color:'var(--gray-light)', marginTop:3}}>{s.notas}</div>}
                  </td>
                  <td style={{color:'var(--gray)', fontSize:'0.84rem'}}>{s.clientes?.nombre}</td>
                  <td style={{fontSize:'0.82rem', color:'var(--gray)'}}>{s.origen || '—'}</td>
                  <td>
                    <div style={{fontFamily:'var(--font-mono)', fontSize:'0.78rem'}}>{s.fecha_limite ? format(parseISO(s.fecha_limite),'dd/MM/yyyy') : '—'}</div>
                    <DaysBadge days={daysUntil(s.fecha_limite)} />
                  </td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    <button className={`btn btn-sm ${s.status==='abierto'?'btn-primary':'btn-ghost'}`} onClick={() => toggleStatus(s)}>
                      {s.status==='abierto' ? '✓ Resolver' : '↩ Reabrir'}
                    </button>
                  </td>
                </tr>
              ))}
              {subsanes.length === 0 && <tr><td colSpan={6} style={{textAlign:'center', color:'var(--gray-light)', padding:40}}>Sin subsanes registrados</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title="Nuevo subsane" onClose={() => setModal(false)}>
          <div className="form-group"><label>Cliente</label>
            <select value={form.cliente_id} onChange={e=>setForm({...form,cliente_id:e.target.value})}>
              <option value="">Seleccionar...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Descripción del subsane</label><textarea value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} /></div>
          <div className="form-group"><label>Origen</label><input type="text" value={form.origen} onChange={e=>setForm({...form,origen:e.target.value})} /></div>
          <div className="form-group"><label>Fecha límite</label><input type="date" value={form.fecha_limite} onChange={e=>setForm({...form,fecha_limite:e.target.value})} /></div>
          <div className="form-group"><label>Notas adicionales</label><textarea value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} /></div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Guardando...':'Guardar'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function AlertasSection({ garantias, licitaciones, subsanes }) {
  const vencidas = garantias.filter(g => daysUntil(g.fecha_vencimiento) < 0)
  const criticas = garantias.filter(g => { const d=daysUntil(g.fecha_vencimiento); return d!==null&&d>=0&&d<=30 })
  const advertencias = garantias.filter(g => { const d=daysUntil(g.fecha_vencimiento); return d!==null&&d>30&&d<=90 })
  const litCierran = licitaciones.filter(l => { const d=daysUntil(l.fecha_cierre); return d!==null&&d>=0&&d<=30 })
  const subsAbiertos = subsanes.filter(s => s.status==='abierto')

  function Group({ title, color, bg, items, render }) {
    if (!items.length) return null
    return (
      <div style={{marginBottom:28}}>
        <div style={{fontSize:'0.7rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color, marginBottom:10, display:'flex', alignItems:'center', gap:8}}>
          {title} <span style={{background:bg, color, padding:'1px 8px', borderRadius:20, fontFamily:'var(--font-mono)'}}>{items.length}</span>
        </div>
        {items.map((item,i) => render(item,i))}
      </div>
    )
  }

  const total = vencidas.length + criticas.length + advertencias.length + litCierran.length + subsAbiertos.length

  return (
    <div>
      <div className="info-box" style={{marginBottom:20}}>
        💡 Para envíos automáticos de email configure Supabase Edge Functions con Resend (gratuito hasta 3,000 emails/mes). Ver <code style={{fontFamily:'var(--font-mono)', fontSize:'0.8rem'}}>/supabase/functions/</code> en el repositorio.
      </div>
      <div className="card">
        {total === 0 && (
          <div style={{textAlign:'center', padding:'48px 0', color:'var(--gray-light)'}}>
            <div style={{fontFamily:'var(--font-display)', fontSize:'1.5rem', marginBottom:8}}>✓</div>
            Sin alertas activas en este momento
          </div>
        )}
        <Group title="Garantías vencidas" color="var(--danger)" bg="#FDF4F4" items={vencidas}
          render={(g,i) => <div key={i} className="alert-strip alert-danger">
            <div style={{flex:1}}><strong>{g.nombre}</strong> · {g.clientes?.nombre}</div>
            <span style={{fontFamily:'var(--font-mono)', fontSize:'0.75rem'}}>venció {g.fecha_vencimiento ? format(parseISO(g.fecha_vencimiento),'dd/MM/yyyy') : ''}</span>
          </div>} />
        <Group title="Vencen en ≤ 30 días" color="var(--danger)" bg="#FDF4F4" items={criticas}
          render={(g,i) => <div key={i} className="alert-strip alert-danger">
            <div style={{flex:1}}><strong>{g.nombre}</strong> · {g.clientes?.nombre}</div>
            <DaysBadge days={daysUntil(g.fecha_vencimiento)} />
          </div>} />
        <Group title="Vencen en 31–90 días" color="var(--warning)" bg="#FDF8EE" items={advertencias}
          render={(g,i) => <div key={i} className="alert-strip alert-warning">
            <div style={{flex:1}}><strong>{g.nombre}</strong> · {g.clientes?.nombre}</div>
            <DaysBadge days={daysUntil(g.fecha_vencimiento)} />
          </div>} />
        <Group title="Licitaciones por cerrar" color="var(--info)" bg="#EEF4FD" items={litCierran}
          render={(l,i) => <div key={i} className="alert-strip alert-info">
            <div style={{flex:1}}><strong>{l.nombre}</strong> · {l.clientes?.nombre}</div>
            <DaysBadge days={daysUntil(l.fecha_cierre)} />
          </div>} />
        <Group title="Subsanes abiertos" color="var(--warning)" bg="#FDF8EE" items={subsAbiertos}
          render={(s,i) => <div key={i} className="alert-strip alert-warning">
            <div style={{flex:1}}><strong>{s.clientes?.nombre}</strong>: {s.descripcion}</div>
            {s.fecha_limite && <DaysBadge days={daysUntil(s.fecha_limite)} />}
          </div>} />
      </div>
    </div>
  )
}

export default function AdminDashboard({ user }) {
  const [section, setSection] = useState('dashboard')
  const [clientes, setClientes] = useState([])
  const [garantias, setGarantias] = useState([])
  const [licitaciones, setLicitaciones] = useState([])
  const [subsanes, setSubsanes] = useState([])

  async function loadAll() {
    const [c,g,l,s] = await Promise.all([
      supabase.from('clientes').select('*').order('nombre'),
      supabase.from('garantias').select('*, clientes(nombre)').order('fecha_vencimiento'),
      supabase.from('licitaciones').select('*, clientes(nombre)').order('fecha_cierre'),
      supabase.from('subsanes').select('*, clientes(nombre)').order('fecha_limite'),
    ])
    setClientes(c.data||[]); setGarantias(g.data||[])
    setLicitaciones(l.data||[]); setSubsanes(s.data||[])
  }

  useEffect(() => { loadAll() }, [])

  const pageTitles = {
    dashboard: ['Resumen', <><em>general</em> del CRM</>],
    clientes: ['Clientes', 'Gestión de cartera'],
    garantias: ['Garantías', 'Control de vencimientos'],
    licitaciones: ['Licitaciones', 'Oportunidades y seguimiento'],
    subsanes: ['Subsanes', 'Pendientes y correcciones'],
    alertas: ['Alertas', 'Centro de alertas activas'],
  }

  const alertCount = garantias.filter(g=>{ const d=daysUntil(g.fecha_vencimiento); return d!==null&&d<=90 }).length
    + licitaciones.filter(l=>{ const d=daysUntil(l.fecha_cierre); return d!==null&&d<=30 }).length
    + subsanes.filter(s=>s.status==='abierto').length

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          it.<em>lex</em>
          <span>Portal CRM</span>
        </div>
        <nav className="sidebar-nav">
          {SECTIONS.map(s => (
            <button key={s.id} className={`nav-item ${section===s.id?'active':''}`} onClick={() => setSection(s.id)}>
              {s.label}
              {s.id==='alertas' && alertCount > 0 && (
                <span style={{marginLeft:'auto', background:'var(--danger)', color:'#fff', fontSize:'0.65rem', padding:'1px 7px', borderRadius:10, fontFamily:'var(--font-mono)'}}>{alertCount}</span>
              )}
              {section===s.id && s.id!=='alertas' && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>Administrador</strong>
            {user.email}
          </div>
          <button className="btn-logout" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <div className="page-title">{pageTitles[section][1]}</div>
          <div className="page-subtitle">{pageTitles[section][0]} · it.lex CRM</div>
        </div>
        <div className="page-body">
          {section==='dashboard' && <DashboardSection clientes={clientes} garantias={garantias} licitaciones={licitaciones} subsanes={subsanes} />}
          {section==='clientes' && <ClientesSection clientes={clientes} refresh={loadAll} />}
          {section==='garantias' && <GarantiasSection garantias={garantias} clientes={clientes} refresh={loadAll} />}
          {section==='licitaciones' && <LicitacionesSection licitaciones={licitaciones} clientes={clientes} refresh={loadAll} />}
          {section==='subsanes' && <SubsanesSection subsanes={subsanes} clientes={clientes} refresh={loadAll} />}
          {section==='alertas' && <AlertasSection garantias={garantias} licitaciones={licitaciones} subsanes={subsanes} />}
        </div>
      </main>
    </div>
  )
}
