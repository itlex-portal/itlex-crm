import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { differenceInDays, format, parseISO } from 'date-fns'

function daysUntil(d) { if (!d) return null; return differenceInDays(parseISO(d), new Date()) }

function DaysBadge({ days }) {
  if (days === null) return null
  if (days < 0) return <span className="days-pill days-critical">Vencido</span>
  if (days <= 30) return <span className="days-pill days-critical">{days} días</span>
  if (days <= 90) return <span className="days-pill days-warning">{days} días</span>
  return <span className="days-pill days-ok">{days} días</span>
}

export default function ClientPortal({ user, clientId }) {
  const [cliente, setCliente] = useState(null)
  const [garantias, setGarantias] = useState([])
  const [licitaciones, setLicitaciones] = useState([])
  const [subsanes, setSubsanes] = useState([])
  const [tab, setTab] = useState('inicio')

  useEffect(() => {
    async function load() {
      const [cl,g,l,s] = await Promise.all([
        supabase.from('clientes').select('*').eq('id', clientId).single(),
        supabase.from('garantias').select('*').eq('cliente_id', clientId).order('fecha_vencimiento'),
        supabase.from('licitaciones').select('*').eq('cliente_id', clientId).order('fecha_cierre'),
        supabase.from('subsanes').select('*').eq('cliente_id', clientId).order('fecha_limite'),
      ])
      setCliente(cl.data); setGarantias(g.data||[]); setLicitaciones(l.data||[]); setSubsanes(s.data||[])
    }
    if (clientId) load()
  }, [clientId])

  const alertas = [
    ...garantias.filter(g=>{ const d=daysUntil(g.fecha_vencimiento); return d!==null&&d<=90 })
      .map(g=>({ tipo:'Garantía', texto:g.nombre, dias:daysUntil(g.fecha_vencimiento), nivel:daysUntil(g.fecha_vencimiento)<=30?'danger':'warning' })),
    ...licitaciones.filter(l=>{ const d=daysUntil(l.fecha_cierre); return d!==null&&d<=30&&l.status==='en_proceso' })
      .map(l=>({ tipo:'Licitación', texto:l.nombre, dias:daysUntil(l.fecha_cierre), nivel:'info' })),
    ...subsanes.filter(s=>s.status==='abierto')
      .map(s=>({ tipo:'Subsane pendiente', texto:s.descripcion, dias:daysUntil(s.fecha_limite), nivel:'warning' })),
  ]

  const TABS = [
    { id:'inicio', label:'Mi resumen' },
    { id:'garantias', label:`Garantías (${garantias.length})` },
    { id:'licitaciones', label:`Licitaciones (${licitaciones.length})` },
    { id:'subsanes', label:`Subsanes (${subsanes.filter(s=>s.status==='abierto').length} abiertos)` },
  ]

  return (
    <div style={{minHeight:'100vh', background:'var(--cream)'}}>
      <header style={{background:'var(--white)', borderBottom:'1px solid var(--border)', padding:'18px 40px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, letterSpacing:'-0.02em'}}>
          it.<em style={{fontStyle:'italic', color:'var(--gold)'}}>lex</em>
          <span style={{fontFamily:'var(--font-body)', fontSize:'0.7rem', display:'block', color:'var(--gray-light)', fontWeight:400, letterSpacing:'0.1em', textTransform:'uppercase', marginTop:1}}>Portal del cliente</span>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontWeight:500, fontSize:'0.9rem'}}>{cliente?.nombre || cliente?.empresa}</div>
          <button onClick={() => supabase.auth.signOut()} style={{background:'none', border:'none', color:'var(--gray-light)', fontSize:'0.75rem', cursor:'pointer', marginTop:2, fontFamily:'var(--font-body)'}}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <div style={{background:'var(--white)', borderBottom:'1px solid var(--border)', padding:'0 40px', display:'flex', gap:0}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{background:'none', border:'none', borderBottom:`2px solid ${tab===t.id?'var(--ink)':'transparent'}`, color:tab===t.id?'var(--ink)':'var(--gray)', padding:'14px 18px', cursor:'pointer', fontSize:'0.86rem', fontFamily:'var(--font-body)', fontWeight:tab===t.id?500:400, transition:'all 0.15s', letterSpacing:'0.01em'}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{padding:'32px 40px', maxWidth:960, margin:'0 auto'}}>

        {tab === 'inicio' && (
          <div>
            {alertas.length > 0 && (
              <div style={{marginBottom:28}}>
                <div style={{fontSize:'0.7rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gray-light)', marginBottom:12}}>Atención requerida</div>
                {alertas.map((a,i) => (
                  <div key={i} className={`alert-strip alert-${a.nivel}`}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'0.68rem', opacity:0.7, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:2}}>{a.tipo}</div>
                      <div style={{fontWeight:500, fontSize:'0.84rem'}}>{a.texto}</div>
                    </div>
                    {a.dias !== null && <DaysBadge days={a.dias} />}
                  </div>
                ))}
              </div>
            )}

            <div className="stats-grid" style={{marginBottom:28}}>
              <div className="stat-card">
                <div className="card-title">Garantías activas</div>
                <div className="stat-number">{garantias.filter(g=>g.status==='activo').length}</div>
              </div>
              <div className="stat-card">
                <div className="card-title">En proceso</div>
                <div className="stat-number" style={{color:'var(--info)'}}>{licitaciones.filter(l=>l.status==='en_proceso').length}</div>
                <div className="stat-accent">licitaciones</div>
              </div>
              <div className="stat-card">
                <div className="card-title">Adjudicadas</div>
                <div className="stat-number" style={{color:'var(--success)'}}>{licitaciones.filter(l=>l.status==='adjudicado').length}</div>
              </div>
              <div className="stat-card">
                <div className="card-title">Subsanes abiertos</div>
                <div className="stat-number" style={{color:'var(--warning)'}}>{subsanes.filter(s=>s.status==='abierto').length}</div>
              </div>
            </div>

            {licitaciones.filter(l=>l.oportunidad).length > 0 && (
              <div className="card" style={{marginBottom:20}}>
                <div className="card-title" style={{marginBottom:16}}>Oportunidades de negocio</div>
                {licitaciones.filter(l=>l.oportunidad).map(l => (
                  <div key={l.id} style={{padding:'14px 0', borderBottom:'1px solid var(--cream)', display:'flex', gap:16, alignItems:'flex-start'}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:500}}>{l.nombre}</div>
                      <div style={{fontSize:'0.78rem', color:'var(--gold)', marginTop:3, fontStyle:'italic'}}>★ {l.oportunidad}</div>
                      {l.entidad && <div style={{fontSize:'0.75rem', color:'var(--gray-light)', marginTop:2}}>{l.entidad}</div>}
                    </div>
                    {l.fecha_cierre && (
                      <div style={{textAlign:'right', flexShrink:0}}>
                        <div style={{fontSize:'0.7rem', color:'var(--gray-light)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2}}>Cierre</div>
                        <div style={{fontFamily:'var(--font-mono)', fontSize:'0.8rem'}}>{format(parseISO(l.fecha_cierre),'dd/MM/yy')}</div>
                        <DaysBadge days={daysUntil(l.fecha_cierre)} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="info-box">
              Para consultas, comuníquese con nosotros: <a href="mailto:info@itlex.cr">info@itlex.cr</a> · <a href="tel:+50661590000">+506 6159-0000</a>
            </div>
          </div>
        )}

        {tab === 'garantias' && (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Garantía</th><th>Vigencia</th><th>Vencimiento</th><th>Días restantes</th><th>Estado</th></tr></thead>
                <tbody>
                  {garantias.map(g => (
                    <tr key={g.id}>
                      <td>
                        <div style={{fontWeight:500}}>{g.nombre}</div>
                        {g.descripcion && <div style={{fontSize:'0.75rem', color:'var(--gray-light)'}}>{g.descripcion}</div>}
                      </td>
                      <td style={{fontFamily:'var(--font-mono)', fontSize:'0.78rem', color:'var(--gray-light)'}}>
                        {g.fecha_inicio ? format(parseISO(g.fecha_inicio),'dd/MM/yy') : '—'} →
                      </td>
                      <td style={{fontFamily:'var(--font-mono)', fontSize:'0.82rem'}}>
                        {g.fecha_vencimiento ? format(parseISO(g.fecha_vencimiento),'dd/MM/yyyy') : '—'}
                      </td>
                      <td><DaysBadge days={daysUntil(g.fecha_vencimiento)} /></td>
                      <td><span className={`badge ${g.status==='activo'?'badge-green':'badge-red'}`}>{g.status}</span></td>
                    </tr>
                  ))}
                  {garantias.length === 0 && <tr><td colSpan={5} style={{textAlign:'center', color:'var(--gray-light)', padding:40}}>Sin garantías registradas</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'licitaciones' && (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Expediente</th><th>Entidad</th><th>Cierre</th><th>Estado</th></tr></thead>
                <tbody>
                  {licitaciones.map(l => (
                    <tr key={l.id}>
                      <td>
                        <div style={{fontFamily:'var(--font-mono)', fontSize:'0.72rem', color:'var(--gray-light)', marginBottom:2}}>{l.numero_expediente}</div>
                        <div style={{fontWeight:500}}>{l.nombre}</div>
                        {l.oportunidad && <div style={{fontSize:'0.72rem', color:'var(--gold)', marginTop:2, fontStyle:'italic'}}>★ {l.oportunidad}</div>}
                      </td>
                      <td style={{fontSize:'0.83rem', color:'var(--gray)'}}>{l.entidad || '—'}</td>
                      <td>
                        <div style={{fontFamily:'var(--font-mono)', fontSize:'0.78rem'}}>{l.fecha_cierre ? format(parseISO(l.fecha_cierre),'dd/MM/yyyy') : '—'}</div>
                        <DaysBadge days={daysUntil(l.fecha_cierre)} />
                      </td>
                      <td>
                        <span className={`badge ${l.status==='adjudicado'?'badge-green':l.status==='perdido'?'badge-red':'badge-blue'}`}>
                          {l.status==='en_proceso'?'En proceso':l.status==='adjudicado'?'Adjudicado':'Perdido'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {licitaciones.length === 0 && <tr><td colSpan={4} style={{textAlign:'center', color:'var(--gray-light)', padding:40}}>Sin licitaciones registradas</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'subsanes' && (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Descripción</th><th>Origen</th><th>Fecha límite</th><th>Estado</th></tr></thead>
                <tbody>
                  {subsanes.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{fontWeight:500}}>{s.descripcion}</div>
                        {s.notas && <div style={{fontSize:'0.75rem', color:'var(--gray-light)', marginTop:3}}>{s.notas}</div>}
                      </td>
                      <td style={{fontSize:'0.83rem', color:'var(--gray)'}}>{s.origen || '—'}</td>
                      <td>
                        <div style={{fontFamily:'var(--font-mono)', fontSize:'0.78rem'}}>{s.fecha_limite ? format(parseISO(s.fecha_limite),'dd/MM/yyyy') : '—'}</div>
                        <DaysBadge days={daysUntil(s.fecha_limite)} />
                      </td>
                      <td><span className={`badge ${s.status==='resuelto'?'badge-green':'badge-yellow'}`}>{s.status==='resuelto'?'Resuelto':'Pendiente'}</span></td>
                    </tr>
                  ))}
                  {subsanes.length === 0 && <tr><td colSpan={4} style={{textAlign:'center', color:'var(--gray-light)', padding:40}}>Sin subsanes registrados</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
