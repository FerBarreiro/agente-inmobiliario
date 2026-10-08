import { useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import './index.css'

type User = { id: string; name: string; email: string; isDemo: boolean }
type Task = {
  id: string
  opportunityId: string
  title: string
  contact: string
  due: string
  dueAt: string
  channel: string
  state: 'pending' | 'done'
  priority: 'Alta' | 'Media'
}
type OpportunityEvent = {
  id: string
  opportunityId: string
  eventType: string
  label: string
  notes: string
  channel: string
  createdAt: string
}
type Opportunity = {
  id: string
  name: string
  neighborhood: string
  operation: 'Venta' | 'Alquiler'
  propertyType: string
  status: string
  reason: string
  score: number
  source: string
  sourceUrl: string
  contactDetail: string
  contactPermission: 'unknown' | 'inbound' | 'explicit' | 'do_not_contact'
  notes: string
  nextStep: string
  nextStepDate: string
  createdAt: string
  updatedAt: string
  closedAt: string | null
  externalSource: string
  externalId: string
  events: OpportunityEvent[]
}
type Dashboard = { user: User; tasks: Task[]; opportunities: Opportunity[] }
type AuthMode = 'login' | 'register'
type View = 'Hoy' | 'Radar' | 'Oportunidades' | 'Contactos' | 'Campañas' | 'Métricas'
type RadarResult = {
  externalId: string
  title: string
  neighborhood: string
  operation: 'Venta' | 'Alquiler'
  propertyType: string
  price: number
  currency: 'USD' | 'ARS'
  rooms: number | null
  area: number | null
  publishedAt: string
  url: string
  synthetic: boolean
  saved: boolean
}
type RadarResponse = { mode: 'demo' | 'live'; provider: string; notice: string; results: RadarResult[] }

const neighborhoods = ['Núñez', 'Saavedra', 'Villa Urquiza', 'Coghlan', 'Belgrano']
const propertyTypes = ['Departamento', 'Casa', 'PH', 'Terreno', 'Local', 'Otro']
const sources = ['Referido', 'Recorrido de zona', 'Formulario entrante', 'Llamada entrante', 'Enlace compartido', 'Mercado Libre', 'Otro']
const channels = ['WhatsApp', 'Llamada', 'Instagram', 'Email', 'Presencial', 'Sin canal']
const eventTypes = [
  ['contact_attempted', 'Contacto intentado'],
  ['conversation_started', 'Conversación iniciada'],
  ['valuation_scheduled', 'Tasación agendada'],
  ['valuation_completed', 'Tasación realizada'],
  ['proposal_sent', 'Propuesta enviada'],
  ['property_captured', 'Propiedad captada'],
  ['opportunity_lost', 'Oportunidad perdida'],
] as const
const permissionLabels = {
  unknown: 'Permiso no confirmado',
  inbound: 'Consulta entrante',
  explicit: 'Permiso explícito',
  do_not_contact: 'No contactar',
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) }, ...options })
  const payload = response.status === 204 ? null : await response.json()
  if (!response.ok) throw new Error(payload?.error ?? 'No se pudo completar la operación.')
  return payload as T
}

function localDateValue(date = new Date()) {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

function formatDate(value: string) {
  if (!value) return 'Sin fecha'
  const date = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: value.length > 10 ? undefined : 'numeric' }).format(date)
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

function App() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  const loadDashboard = async () => setDashboard(await api<Dashboard>('/api/dashboard'))

  useEffect(() => {
    api<{ user: User | null }>('/api/auth/me')
      .then(async ({ user }) => { if (user) await loadDashboard() })
      .catch(() => setNotice('No se pudo conectar con la base local. Iniciá el servidor con npm run dev.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-screen">Cargando Agente<span>+</span>…</div>
  if (!dashboard) return <AuthScreen onAuthenticated={async () => { await loadDashboard(); setNotice('Sesión iniciada correctamente.') }} />
  return <DashboardScreen dashboard={dashboard} setDashboard={setDashboard} notice={notice} setNotice={setNotice} onLogout={() => { setDashboard(null); setNotice('') }} />
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: () => Promise<void> }) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    const data = new FormData(event.currentTarget)
    try {
      await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify({ name: data.get('name'), email: data.get('email'), password: data.get('password') }) })
      await onAuthenticated()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo iniciar la sesión.')
    } finally { setBusy(false) }
  }
  const enterDemo = async () => {
    setError('')
    setBusy(true)
    try { await api('/api/auth/demo', { method: 'POST' }); await onAuthenticated() } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo abrir la demo.') } finally { setBusy(false) }
  }
  return <main className="auth-shell">
    <section className="auth-brand">
      <Brand />
      <div><p className="eyebrow light">PRODUCTIVIDAD PARA AGENTES INMOBILIARIOS</p><h1>Tu cartera crece con cada próximo paso.</h1><p>Organizá captación, seguimientos y objetivos sin mezclar tus datos con la demostración.</p></div>
      <ul><li>Datos separados por cuenta</li><li>Sesiones seguras y privadas</li><li>Sin automatizaciones de contacto</li></ul>
    </section>
    <section className="auth-panel">
      <div className="auth-card">
        <p className="eyebrow">COMENZAR</p><h2>Entrá a tu espacio</h2><p className="auth-description">Usá la demo para recorrer el flujo o creá una cuenta privada para tu base.</p>
        <button type="button" className="demo-login" onClick={enterDemo} disabled={busy}><span className="avatar demo">FM</span><span><strong>Explorar cuenta demo</strong><small>Datos semilla ficticios</small></span><span>→</span></button>
        <div className="auth-separator"><span>o</span></div>
        <div className="auth-toggle"><button className={mode === 'login' ? 'selected' : ''} onClick={() => setMode('login')} type="button">Ingresar</button><button className={mode === 'register' ? 'selected' : ''} onClick={() => setMode('register')} type="button">Crear cuenta</button></div>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && <label>Tu nombre<input name="name" autoComplete="name" minLength={2} required /></label>}
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Contraseña<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={12} required />{mode === 'register' && <small>Al menos 12 caracteres.</small>}</label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button auth-submit" disabled={busy} type="submit">{busy ? 'Procesando…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta privada'}</button>
        </form>
      </div>
      <p className="auth-footnote">La demo está aislada de tu cuenta. Tus datos no se comparten entre usuarios.</p>
    </section>
  </main>
}

function Brand() {
  return <div className="brand"><span className="brand-mark">A</span><span>agente<span>+</span></span></div>
}

function DashboardScreen({ dashboard, setDashboard, notice, setNotice, onLogout }: { dashboard: Dashboard; setDashboard: (value: Dashboard) => void; notice: string; setNotice: (value: string) => void; onLogout: () => void }) {
  const [view, setView] = useState<View>('Hoy')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { user } = dashboard
  const selectedOpportunity = dashboard.opportunities.find((item) => item.id === selectedId) ?? null
  const logout = async () => { await api('/api/auth/logout', { method: 'POST' }); onLogout() }
  const updateDashboard = (data: Dashboard, message: string) => { setDashboard(data); setNotice(message) }
  const titles: Record<View, string> = { Hoy: user.isDemo ? 'Buen día, Florencia' : `Buen día, ${user.name}`, Radar: 'Radar de oportunidades', Oportunidades: 'Tu cartera de oportunidades', Contactos: 'Contactos registrados', Campañas: 'Campañas', Métricas: 'Métricas' }
  const navigation: Array<[View, string]> = [['Hoy', '◈'], ['Radar', '⌁'], ['Oportunidades', '◎'], ['Contactos', '◉'], ['Campañas', '◐'], ['Métricas', '◌']]

  return <main className="app-shell">
    <aside className="sidebar">
      <Brand />
      <div className="account-card"><span className={`avatar ${user.isDemo ? 'demo' : 'personal'}`}>{user.name.slice(0, 2).toUpperCase()}</span><div><strong>{user.name}</strong><small>{user.isDemo ? 'Cuenta demo · datos sintéticos' : 'Cuenta privada'}</small></div></div>
      <nav aria-label="Navegación principal">{navigation.map(([item, icon]) => <button className={item === view ? 'nav-item active' : 'nav-item'} key={item} onClick={() => { setView(item); setNotice('') }} type="button"><span aria-hidden="true">{icon}</span>{item}</button>)}</nav>
      <button className="logout-button" type="button" onClick={logout}>Cerrar sesión</button>
      <div className="sidebar-foot"><span className={user.isDemo ? 'demo-dot' : 'personal-dot'} />{user.isDemo ? 'Datos demo aislados' : 'Datos guardados en tu cuenta'}</div>
    </aside>
    <section className="workspace">
      <header className="topbar"><div><p className="eyebrow">{view === 'Hoy' ? 'TU ACTIVIDAD Y PRÓXIMOS PASOS' : view.toUpperCase()}</p><h1>{titles[view]}</h1></div><button className="primary-button" type="button" onClick={() => setIsCreateOpen(true)}><span>＋</span> Nueva oportunidad</button></header>
      {notice && <div className="notice" role="status"><span>✓</span> {notice}</div>}
      {view === 'Hoy' && <TodayView dashboard={dashboard} onOpen={setSelectedId} onCreate={() => setIsCreateOpen(true)} onDashboard={(data, message) => updateDashboard(data, message)} />}
      {view === 'Radar' && <RadarView onDashboard={(data, message) => updateDashboard(data, message)} />}
      {view === 'Oportunidades' && <OpportunitiesView opportunities={dashboard.opportunities} onOpen={setSelectedId} />}
      {view === 'Contactos' && <ContactsView opportunities={dashboard.opportunities} onOpen={setSelectedId} />}
      {(view === 'Campañas' || view === 'Métricas') && <PlannedView view={view} />}
    </section>
    {isCreateOpen && <OpportunityModal isDemo={user.isDemo} onClose={() => setIsCreateOpen(false)} onSaved={(data) => { setIsCreateOpen(false); updateDashboard(data, 'Oportunidad y próximo paso guardados.') }} />}
    {selectedOpportunity && <OpportunityDetail opportunity={selectedOpportunity} onClose={() => setSelectedId(null)} onSaved={(data) => updateDashboard(data, 'Resultado registrado y próximo paso actualizado.')} />}
  </main>
}

function TodayView({ dashboard, onOpen, onCreate, onDashboard }: { dashboard: Dashboard; onOpen: (id: string) => void; onCreate: () => void; onDashboard: (data: Dashboard, message: string) => void }) {
  const { user, tasks, opportunities } = dashboard
  const remainingTasks = tasks.filter((task) => task.state === 'pending')
  const captured = opportunities.filter((item) => item.status === 'Captada').length
  const conversations = opportunities.filter((item) => ['En conversación', 'Tasación agendada', 'Tasación realizada', 'Propuesta enviada', 'Captada'].includes(item.status)).length
  const completeTask = async (id: string) => {
    try { onDashboard(await api<Dashboard>(`/api/tasks/${id}/complete`, { method: 'POST' }), 'Acción completada. El resultado comercial se registra desde la ficha.') } catch (reason) { onDashboard(dashboard, reason instanceof Error ? reason.message : 'No se pudo actualizar la acción.') }
  }
  const summary = [
    { icon: '↗', tone: 'amber', label: 'Oportunidades', value: String(opportunities.length), detail: 'cargadas', width: opportunities.length ? '55%' : '0%' },
    { icon: '◷', tone: 'rose', label: 'Conversaciones', value: String(conversations), detail: 'iniciadas', width: conversations ? '45%' : '0%' },
    { icon: '◉', tone: 'mint', label: 'Captaciones', value: String(captured), detail: 'logradas', width: captured ? '40%' : '0%' },
  ]
  return <>
    {user.isDemo ? <DemoGoal /> : <PersonalWelcome hasOpportunities={opportunities.length > 0} onCreate={onCreate} />}
    <section className="dashboard-grid">{summary.map((item) => <SummaryCard key={item.label} {...item} />)}</section>
    <section className="content-grid">
      <section className="panel tasks-panel"><div className="panel-heading"><div><p className="eyebrow">TU FOCO</p><h2>Próximos pasos <span>{remainingTasks.length}</span></h2></div></div><div className="task-list">
        {remainingTasks.map((task) => <article className="task" key={task.id}><button className="task-check" type="button" aria-label={`Completar: ${task.title}`} onClick={() => completeTask(task.id)} /><div className="task-copy"><h3>{task.title}</h3><p>{task.contact} <span>·</span> {task.channel}</p>{task.opportunityId && <button type="button" className="task-link" onClick={() => onOpen(task.opportunityId)}>Abrir ficha</button>}</div><div className="task-meta"><span className={task.dueAt && task.dueAt < localDateValue() ? 'due overdue' : 'due'}>{formatDate(task.dueAt || task.due)}</span><span className={task.priority === 'Alta' ? 'priority high' : 'priority'}>{task.priority}</span></div></article>)}
        {remainingTasks.length === 0 && <p className="empty-state">No hay acciones pendientes. Creá una oportunidad o registrá el próximo resultado.</p>}
      </div></section>
      <aside className="panel demand-panel"><p className="eyebrow">PRIVACIDAD OPERATIVA</p><h2>Registrar solo lo necesario</h2><p>La fuente, el permiso de contacto y el próximo paso quedan visibles en cada ficha. <strong>“No contactar”</strong> debe respetarse aunque exista un dato público.</p><span className="privacy-note">Esta base local es para desarrollo. Los datos personales reales requieren un despliegue productivo protegido.</span></aside>
    </section>
    <section className="panel opportunities-panel"><div className="panel-heading"><div><p className="eyebrow">ACTIVIDAD RECIENTE</p><h2>Oportunidades de captación</h2></div></div><OpportunityList opportunities={opportunities.slice(0, 5)} onOpen={onOpen} /></section>
  </>
}

function RadarView({ onDashboard }: { onDashboard: (data: Dashboard, message: string) => void }) {
  const [neighborhood, setNeighborhood] = useState('Núñez')
  const [operation, setOperation] = useState('Venta')
  const [propertyType, setPropertyType] = useState('Departamento')
  const [currency, setCurrency] = useState('USD')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [radar, setRadar] = useState<RadarResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState('')

  const loadResults = async (filters: { neighborhood: string; operation: string; propertyType: string; currency: string; minPrice?: string; maxPrice?: string }) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ neighborhood: filters.neighborhood, operation: filters.operation, propertyType: filters.propertyType, currency: filters.currency })
    if (filters.minPrice) params.set('minPrice', filters.minPrice)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    try { setRadar(await api<RadarResponse>(`/api/radar?${params}`)) } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo consultar el radar.') } finally { setLoading(false) }
  }

  useEffect(() => {
    const params = new URLSearchParams({ neighborhood: 'Núñez', operation: 'Venta', propertyType: 'Departamento', currency: 'USD' })
    api<RadarResponse>(`/api/radar?${params}`)
      .then(setRadar)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo consultar el radar.'))
      .finally(() => setLoading(false))
  }, [])

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void loadResults({ neighborhood, operation, propertyType, currency, minPrice, maxPrice })
  }

  const saveOpportunity = async (result: RadarResult) => {
    setSavingId(result.externalId)
    setError('')
    try {
      const data = await api<Dashboard>('/api/opportunities', {
        method: 'POST',
        body: JSON.stringify({
          name: result.title,
          neighborhood: result.neighborhood,
          operation: result.operation,
          propertyType: propertyTypes.includes(result.propertyType) ? result.propertyType : 'Otro',
          source: 'Mercado Libre',
          sourceUrl: result.synthetic ? '' : result.url,
          contactDetail: '',
          contactPermission: 'unknown',
          notes: result.synthetic
            ? `Ejemplo sintético ${result.externalId} creado para validar el radar. No corresponde a una publicación real.`
            : `Publicación ${result.externalId} detectada por el radar. Precio observado: ${formatMoney(result.price, result.currency)}. Verificar vigencia y condiciones en la fuente original.`,
          nextStep: 'Revisar publicación original',
          nextStepDate: localDateValue(),
          channel: 'Sin canal',
          externalId: result.externalId,
        }),
      })
      setRadar((current) => current ? { ...current, results: current.results.map((item) => item.externalId === result.externalId ? { ...item, saved: true } : item) } : current)
      onDashboard(data, 'Publicación guardada como oportunidad para revisión manual.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar la oportunidad.') } finally { setSavingId('') }
  }

  return <section className="radar-page">
    <section className="panel radar-search-panel">
      <div className="radar-intro"><div><p className="eyebrow">BÚSQUEDA AUTORIZADA · SIN CONTACTOS</p><h2>Explorá publicaciones por zona</h2><p>El radar muestra metadatos y siempre conserva el enlace al aviso original. Guardar un resultado no autoriza contactar al anunciante.</p></div><span className={`radar-mode ${radar?.mode ?? 'demo'}`}>{radar?.mode === 'live' ? 'API oficial activa' : 'Modo Demo'}</span></div>
      <form className="radar-filters" onSubmit={search}>
        <label>Barrio<select value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)}>{neighborhoods.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Operación<select value={operation} onChange={(event) => { setOperation(event.target.value); setCurrency(event.target.value === 'Venta' ? 'USD' : 'ARS') }}><option>Venta</option><option>Alquiler</option></select></label>
        <label>Propiedad<select value={propertyType} onChange={(event) => setPropertyType(event.target.value)}>{propertyTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Moneda<select value={currency} onChange={(event) => setCurrency(event.target.value)}><option>USD</option><option>ARS</option></select></label>
        <label>Precio mínimo<input type="number" min="0" inputMode="numeric" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Sin mínimo" /></label>
        <label>Precio máximo<input type="number" min="0" inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Sin máximo" /></label>
        <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Buscando…' : 'Buscar oportunidades'}</button>
      </form>
    </section>
    {radar && <div className="radar-notice"><span>i</span><p>{radar.notice}</p></div>}
    {error && <p className="form-error radar-error" role="alert">{error}</p>}
    <section className="radar-results-heading"><div><p className="eyebrow">RESULTADOS</p><h2>{loading ? 'Consultando…' : `${radar?.results.length ?? 0} publicaciones`}</h2></div><small>Sin teléfonos, emails ni dirección exacta</small></section>
    <div className="radar-grid">{radar?.results.map((result) => <article className="radar-card" key={result.externalId}>
      <div className="radar-card-top"><span>{result.synthetic ? 'EJEMPLO SINTÉTICO' : 'MERCADO LIBRE'}</span><small>{formatDate(result.publishedAt)}</small></div>
      <h3>{result.title}</h3><p className="radar-location">{result.neighborhood} · {result.propertyType} · {result.operation}</p>
      <strong className="radar-price">{formatMoney(result.price, result.currency)}</strong>
      <div className="radar-features"><span>{result.rooms ? `${result.rooms} ambientes` : 'Ambientes no informados'}</span><span>{result.area ? `${result.area} m²` : 'Superficie no informada'}</span></div>
      <div className="radar-actions">{result.synthetic ? <span className="radar-demo-link">Sin publicación real en Demo</span> : <a href={result.url} target="_blank" rel="noreferrer">Abrir publicación ↗</a>}<button type="button" disabled={result.saved || savingId === result.externalId} onClick={() => saveOpportunity(result)}>{result.saved ? 'Ya guardada' : savingId === result.externalId ? 'Guardando…' : 'Guardar oportunidad'}</button></div>
    </article>)}
    {!loading && radar?.results.length === 0 && <div className="empty-card radar-empty"><strong>No encontramos ejemplos con estos filtros</strong><p>Probá otra combinación de barrio, tipo, moneda o rango de precio.</p></div>}</div>
    <p className="radar-legal-note">El radar sirve para revisar mercado y organizar enlaces. No determina que el anunciante sea propietario ni que acepte intermediación. Toda acción requiere revisar el aviso original, sus restricciones y la base legal del contacto.</p>
  </section>
}

function OpportunitiesView({ opportunities, onOpen }: { opportunities: Opportunity[]; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Todas')
  const [neighborhood, setNeighborhood] = useState('Todos')
  const statuses = ['Todas', ...Array.from(new Set(opportunities.map((item) => item.status)))]
  const filtered = opportunities.filter((item) => {
    const haystack = `${item.name} ${item.source} ${item.propertyType}`.toLowerCase()
    return haystack.includes(query.toLowerCase()) && (status === 'Todas' || item.status === status) && (neighborhood === 'Todos' || item.neighborhood === neighborhood)
  })
  return <section className="panel directory-panel">
    <div className="directory-heading"><div><p className="eyebrow">BASE MANUAL</p><h2>{filtered.length} oportunidades</h2></div><div className="filters"><input aria-label="Buscar oportunidades" placeholder="Buscar por nombre, fuente o tipo…" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filtrar por estado" value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filtrar por barrio" value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)}><option>Todos</option>{neighborhoods.map((item) => <option key={item}>{item}</option>)}</select></div></div>
    <OpportunityList opportunities={filtered} onOpen={onOpen} />
  </section>
}

function ContactsView({ opportunities, onOpen }: { opportunities: Opportunity[]; onOpen: (id: string) => void }) {
  const contacts = opportunities.filter((item) => item.contactDetail)
  return <section className="panel directory-panel"><div className="panel-heading"><div><p className="eyebrow">DATOS APORTADOS MANUALMENTE</p><h2>{contacts.length} contactos registrados</h2></div></div><div className="contact-list">
    {contacts.map((item) => <button type="button" className="contact-row" key={item.id} onClick={() => onOpen(item.id)}><span className="contact-avatar">{item.name.slice(0, 2).toUpperCase()}</span><span><strong>{item.name}</strong><small>{item.contactDetail}</small></span><span className={`permission-chip ${item.contactPermission}`}>{permissionLabels[item.contactPermission]}</span><span>→</span></button>)}
    {contacts.length === 0 && <div className="empty-card"><strong>No hay contactos cargados</strong><p>Podés conservar una oportunidad sin datos personales y agregarlos solo cuando sean necesarios y legítimos.</p></div>}
  </div></section>
}

function PlannedView({ view }: { view: 'Campañas' | 'Métricas' }) {
  return <section className="panel planned-view"><span>{view === 'Campañas' ? '◐' : '◌'}</span><p className="eyebrow">SIGUIENTE ETAPA</p><h2>{view === 'Campañas' ? 'Captación entrante' : 'Embudo basado en eventos'}</h2><p>{view === 'Campañas' ? 'Las campañas y formularios entrantes se construirán después de validar la carga y el seguimiento manual.' : 'Los eventos ya se registran. El tablero de métricas se habilitará cuando exista actividad suficiente para evitar conclusiones prematuras.'}</p></section>
}

function OpportunityList({ opportunities, onOpen }: { opportunities: Opportunity[]; onOpen: (id: string) => void }) {
  return <div className="opportunity-list">{opportunities.map((opportunity) => <article className="opportunity" key={opportunity.id}>
    <div className="opportunity-score" style={{ '--score': opportunity.score } as CSSProperties}><span>{opportunity.score}</span></div>
    <button type="button" className="opportunity-copy" onClick={() => onOpen(opportunity.id)}><div className="opportunity-title"><h3>{opportunity.name}</h3><span>{opportunity.status}</span></div><p>{opportunity.propertyType} · {opportunity.neighborhood} · {opportunity.operation}</p><small>{opportunity.source} · {permissionLabels[opportunity.contactPermission]}</small></button>
    <button className="next-step" type="button" onClick={() => onOpen(opportunity.id)}>{opportunity.closedAt ? 'Ver historial' : opportunity.nextStep} <span>→</span></button>
  </article>)}{opportunities.length === 0 && <p className="empty-state">No hay oportunidades que coincidan con estos filtros.</p>}</div>
}

function OpportunityModal({ isDemo, onClose, onSaved }: { isDemo: boolean; onClose: () => void; onSaved: (data: Dashboard) => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [permission, setPermission] = useState('unknown')
  const [nextStep, setNextStep] = useState('Realizar primer contacto')
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    const payload = Object.fromEntries(data.entries())
    try { onSaved(await api<Dashboard>('/api/opportunities', { method: 'POST', body: JSON.stringify(payload) })) } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar.') } finally { setBusy(false) }
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
    <button className="modal-close" type="button" onClick={onClose}>×</button><p className="eyebrow">{isDemo ? 'CAPTACIÓN DEMO' : 'CAPTACIÓN · CUENTA PRIVADA'}</p><h2 id="modal-title">Nueva oportunidad</h2><p className="modal-description">Registrá el origen y el próximo paso. Los datos personales son opcionales.</p>
    <form onSubmit={save}>
      <div className="form-row"><label>Nombre o referencia<input name="name" placeholder="Ej. Andrea G. (referido)" autoFocus minLength={2} required /></label><label>Tipo de propiedad<select name="propertyType">{propertyTypes.map((item) => <option key={item}>{item}</option>)}</select></label></div>
      <div className="form-row"><label>Barrio<select name="neighborhood">{neighborhoods.map((item) => <option key={item}>{item}</option>)}</select></label><label>Operación<select name="operation"><option>Venta</option><option>Alquiler</option></select></label></div>
      <div className="form-row"><label>Fuente<select name="source">{sources.map((item) => <option key={item}>{item}</option>)}</select></label><label>Enlace original <span className="optional">opcional</span><input name="sourceUrl" type="url" placeholder="https://…" /></label></div>
      <div className="form-row"><label>Situación de contacto<select name="contactPermission" value={permission} onChange={(event) => { const value = event.target.value; setPermission(value); setNextStep(value === 'do_not_contact' ? 'Revisar sin contactar' : nextStep === 'Revisar sin contactar' ? 'Realizar primer contacto' : nextStep) }}><option value="unknown">Permiso no confirmado</option><option value="inbound">La persona inició la consulta</option><option value="explicit">Dio permiso explícito</option><option value="do_not_contact">No contactar</option></select></label><label>Dato de contacto <span className="optional">opcional</span><input name="contactDetail" placeholder="Teléfono, email o usuario" /></label></div>
      {permission === 'do_not_contact' && <p className="contact-warning">Esta oportunidad quedará identificada como “No contactar”. Usá el próximo paso para una revisión interna.</p>}
      <label>Notas <span className="optional">opcionales</span><textarea name="notes" rows={3} placeholder="Contexto útil, sin copiar contenido innecesario del portal." /></label>
      <fieldset><legend>Próximo paso obligatorio</legend><div className="form-row"><label>Acción<input name="nextStep" value={nextStep} onChange={(event) => setNextStep(event.target.value)} minLength={2} required readOnly={permission === 'do_not_contact'} /></label><label>Fecha<input name="nextStepDate" type="date" defaultValue={localDateValue()} /></label></div><label>Canal<select name="channel" defaultValue="WhatsApp" disabled={permission === 'do_not_contact'}>{channels.map((item) => <option key={item}>{item}</option>)}</select>{permission === 'do_not_contact' && <input type="hidden" name="channel" value="Sin canal" />}</label></fieldset>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={busy} type="submit">{busy ? 'Guardando…' : 'Guardar oportunidad'}</button></div>
    </form>
  </section></div>
}

function OpportunityDetail({ opportunity, onClose, onSaved }: { opportunity: Opportunity; onClose: () => void; onSaved: (data: Dashboard) => void }) {
  return <div className="modal-backdrop detail-backdrop" onMouseDown={onClose}><section className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="detail-title" onMouseDown={(event) => event.stopPropagation()}>
    <button className="modal-close" type="button" onClick={onClose}>×</button>
    <header className="detail-header"><p className="eyebrow">{opportunity.propertyType} · {opportunity.neighborhood}</p><h2 id="detail-title">{opportunity.name}</h2><div className="detail-badges"><span>{opportunity.status}</span><span className={`permission-chip ${opportunity.contactPermission}`}>{permissionLabels[opportunity.contactPermission]}</span></div></header>
    <section className="detail-section"><h3>Información de origen</h3><dl className="detail-grid"><div><dt>Operación</dt><dd>{opportunity.operation}</dd></div><div><dt>Fuente</dt><dd>{opportunity.source}</dd></div><div><dt>Contacto</dt><dd>{opportunity.contactDetail || 'No cargado'}</dd></div><div><dt>Detectada</dt><dd>{formatDate(opportunity.createdAt)}</dd></div></dl>{opportunity.sourceUrl && <a className="source-link" href={opportunity.sourceUrl} target="_blank" rel="noreferrer">Abrir fuente original ↗</a>}{opportunity.notes && <p className="detail-notes">{opportunity.notes}</p>}</section>
    {!opportunity.closedAt && <section className="next-callout"><small>PRÓXIMO PASO</small><strong>{opportunity.nextStep}</strong><span>{formatDate(opportunity.nextStepDate)}</span></section>}
    {!opportunity.closedAt && <EventForm opportunity={opportunity} onSaved={onSaved} />}
    <section className="detail-section timeline-section"><h3>Historial comercial</h3><div className="timeline">{opportunity.events.map((event) => <article key={event.id}><span className="timeline-dot" /><div><strong>{event.label}</strong><small>{formatDateTime(event.createdAt)} · {event.channel}</small>{event.notes && <p>{event.notes}</p>}</div></article>)}</div></section>
  </section></div>
}

function EventForm({ opportunity, onSaved }: { opportunity: Opportunity; onSaved: (data: Dashboard) => void }) {
  const restricted = opportunity.contactPermission === 'do_not_contact'
  const [eventType, setEventType] = useState(restricted ? 'opportunity_lost' : 'contact_attempted')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isClosing = eventType === 'property_captured' || eventType === 'opportunity_lost'
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try { onSaved(await api<Dashboard>(`/api/opportunities/${opportunity.id}/events`, { method: 'POST', body: JSON.stringify(Object.fromEntries(data.entries())) })) } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo registrar el resultado.') } finally { setBusy(false) }
  }
  return <section className="detail-section event-box"><h3>Registrar resultado</h3><form onSubmit={save}>
    {restricted && <p className="contact-warning">La oportunidad está marcada como “No contactar”. No se pueden registrar acciones comerciales hasta que exista un mecanismo auditado para cambiar esa condición.</p>}
    <div className="form-row"><label>Resultado<select name="eventType" value={eventType} onChange={(event) => setEventType(event.target.value)}>{eventTypes.filter(([value]) => !restricted || value === 'opportunity_lost').map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Canal<select name="channel" defaultValue={restricted ? 'Sin canal' : 'WhatsApp'} disabled={restricted}>{channels.map((item) => <option key={item}>{item}</option>)}</select>{restricted && <input type="hidden" name="channel" value="Sin canal" />}</label></div>
    <label>Nota del resultado <span className="optional">opcional</span><textarea name="notes" rows={2} placeholder="Qué ocurrió y qué información es relevante." /></label>
    {!isClosing && <div className="form-row"><label>Nuevo próximo paso<input name="nextStep" placeholder="Ej. Confirmar tasación" minLength={2} required /></label><label>Fecha<input name="nextStepDate" type="date" defaultValue={localDateValue()} /></label></div>}
    {isClosing && <p className="closing-note">Este resultado cerrará la oportunidad y completará sus tareas pendientes.</p>}
    {error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={busy} type="submit">{busy ? 'Registrando…' : 'Registrar y actualizar'}</button>
  </form></section>
}

function DemoGoal() {
  return <section className="goal-banner"><div className="goal-heading"><div><p className="eyebrow light">CAMPAÑA DEMO · DATOS SINTÉTICOS</p><h2>Captar 5 propiedades</h2><p>Núñez · Saavedra · Villa Urquiza · Coghlan · Belgrano</p></div><span className="goal-operation">Venta + alquiler</span></div><div className="goal-progress"><div className="progress-label"><span>Progreso ilustrativo</span><strong>2 de 5</strong></div><div className="progress-track"><span style={{ width: '40%' }} /></div></div><div className="goal-tip"><span>✦</span><p>Abrí una oportunidad para recorrer su fuente, permiso de contacto e historial.</p></div></section>
}

function PersonalWelcome({ hasOpportunities, onCreate }: { hasOpportunities: boolean; onCreate: () => void }) {
  return <section className="goal-banner personal-welcome"><div className="goal-heading"><div><p className="eyebrow light">CUENTA PRIVADA · BASE PERSONAL</p><h2>{hasOpportunities ? 'Continuá desde el próximo paso' : 'Empezá con tu primera oportunidad'}</h2><p>{hasOpportunities ? 'Cada resultado actualiza el historial y la acción siguiente.' : 'Tu base está separada de Demo y protegida por tu sesión.'}</p></div><span className="goal-operation">Privado</span></div><div className="goal-tip"><span>✦</span><p>La carga manual valida qué datos aportan valor. {!hasOpportunities && <button type="button" className="inline-action" onClick={onCreate}>Cargar oportunidad</button>}</p></div></section>
}

function SummaryCard({ icon, tone, label, value, detail, width }: { icon: string; tone: string; label: string; value: string; detail: string; width: string }) {
  return <article className="summary-card"><span className={`summary-icon ${tone}`}>{icon}</span><div><p>{label}</p><strong>{value} <small>{detail}</small></strong></div><div className="mini-track"><span style={{ width }} /></div></article>
}

export default App
