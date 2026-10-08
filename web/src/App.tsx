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
type PriceObservation = {
  id: string
  opportunityId: string
  amount: number
  currency: 'USD' | 'ARS'
  observedAt: string
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
  contactSourceReviewed: number
  contactListingPolicy: 'not_started' | 'allows_agents' | 'no_agents'
  noLlameCheckedAt: string
  plannedContactChannel: string
  contactDraft: string
  contactPreparationNotes: string
  contactPreparationStatus: 'not_started' | 'pending' | 'ready' | 'blocked'
  contactPreparationUpdatedAt: string
  contactOrigin: 'not_recorded' | 'directly_provided' | 'inbound' | 'prior_relationship' | 'listing_to_verify' | 'other'
  contactPreference: 'not_contacted' | 'follow_up_agreed' | 'latent' | 'not_continue' | 'do_not_contact'
  contactFollowUpAt: string
  contactPreferenceNote: string
  events: OpportunityEvent[]
  priceObservations: PriceObservation[]
}
type Dashboard = { user: User; tasks: Task[]; opportunities: Opportunity[] }
type AuthMode = 'login' | 'register'
type View = 'Hoy' | 'Radar' | 'Oportunidades' | 'Contactos' | 'Campañas' | 'Métricas'
type RadarState = 'detected' | 'reviewing' | 'converted' | 'discarded'
type RadarCaptureMethod = 'manual' | 'url_assisted'
type RadarItem = {
  id: string
  title: string
  neighborhood: string
  operation: 'Venta' | 'Alquiler'
  propertyType: string
  source: string
  sourceUrl: string
  priceAmount: number | null
  currency: 'USD' | 'ARS'
  notes: string
  captureMethod: RadarCaptureMethod
  state: RadarState
  createdAt: string
  updatedAt: string
}
type RadarItemsResponse = { items: RadarItem[] }

const neighborhoods = ['Núñez', 'Saavedra', 'Villa Urquiza', 'Coghlan', 'Belgrano']
const propertyTypes = ['Departamento', 'Casa', 'PH', 'Terreno', 'Local', 'Otro']
const sources = ['Carga manual', 'Referido', 'Recorrido de zona', 'Formulario entrante', 'Llamada entrante', 'Enlace compartido', 'Mercado Libre', 'Zonaprop', 'Argenprop', 'Otro']
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
const contactOriginLabels = {
  not_recorded: 'No cargado',
  directly_provided: 'Aportado directamente',
  inbound: 'Consulta entrante',
  prior_relationship: 'Relación previa',
  listing_to_verify: 'Aviso a verificar',
  other: 'Otro origen manual',
}
const contactPreferenceLabels = {
  not_contacted: 'Sin contacto aún',
  follow_up_agreed: 'Seguimiento acordado',
  latent: 'Latente',
  not_continue: 'No continuar',
  do_not_contact: 'No contactar',
}
const radarCaptureMethodLabels: Record<RadarCaptureMethod, string> = {
  manual: 'Carga manual',
  url_assisted: 'Asistida por URL',
}

function normalizeUrlHint(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-_/]+/g, ' ').replace(/\s+/g, ' ')
}

function inferRadarUrl(urlValue: string) {
  try {
    const url = new URL(urlValue)
    const host = url.hostname.toLowerCase()
    const source = host.endsWith('zonaprop.com.ar') ? 'Zonaprop' : host.endsWith('argenprop.com') ? 'Argenprop' : host.includes('mercadolibre.com') ? 'Mercado Libre' : 'Otro'
    const hint = normalizeUrlHint(`${url.pathname} ${url.search}`)
    const neighborhood = neighborhoods.find((item) => hint.includes(normalizeUrlHint(item)))
    const operation = hint.includes('alquiler') ? 'Alquiler' : hint.includes('venta') ? 'Venta' : undefined
    const propertyType = hint.includes('departamento') || hint.includes('depto') ? 'Departamento'
      : hint.includes('casa') ? 'Casa'
        : /(^| )ph( |$)/.test(hint) ? 'PH'
          : hint.includes('terreno') || hint.includes('lote') ? 'Terreno'
            : hint.includes('local') ? 'Local' : undefined
    const reference = `${url.pathname}${url.search}`.match(/(?:MLA[-_]?|propiedad(?:es)?[-_/]?)(\d{6,})/i)?.[0]?.toUpperCase()
    return { source, neighborhood, operation, propertyType, title: `Aviso para revisar · ${source}${reference ? ` · ${reference}` : ''}` }
  } catch { return null }
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
  const resetToken = new URLSearchParams(window.location.search).get('reset') ?? ''

  const loadDashboard = async () => setDashboard(await api<Dashboard>('/api/dashboard'))

  useEffect(() => {
    api<{ user: User | null }>('/api/auth/me')
      .then(async ({ user }) => { if (user) await loadDashboard() })
      .catch(() => setNotice('No se pudo conectar con la base local. Iniciá el servidor con npm run dev.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-screen">Cargando Agente<span>+</span>…</div>
  if (resetToken || !dashboard) return <AuthScreen resetToken={resetToken} onAuthenticated={async (message = 'Sesión iniciada correctamente.') => { await loadDashboard(); setNotice(message) }} />
  return <DashboardScreen dashboard={dashboard} setDashboard={setDashboard} notice={notice} setNotice={setNotice} onLogout={() => { setDashboard(null); setNotice('') }} />
}

function AuthScreen({ onAuthenticated, resetToken }: { onAuthenticated: (message?: string) => Promise<void>; resetToken: string }) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [recoveryMode, setRecoveryMode] = useState(false)
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
  if (resetToken) return <PasswordResetScreen token={resetToken} onAuthenticated={onAuthenticated} />
  if (recoveryMode) return <PasswordRecoveryScreen onBack={() => setRecoveryMode(false)} />
  return <main className="auth-shell">
    <section className="auth-brand">
      <Brand />
      <div><p className="eyebrow light">PRODUCTIVIDAD PARA USUARIOS INMOBILIARIOS</p><h1>Tu cartera crece con cada próximo paso.</h1><p>Organizá captación, seguimientos y objetivos sin mezclar tus datos con la demostración.</p></div>
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
          {mode === 'login' && <button className="auth-link" type="button" onClick={() => { setError(''); setRecoveryMode(true) }}>Olvidé mi contraseña</button>}
        </form>
      </div>
      <p className="auth-footnote">La demo está aislada de tu cuenta. Tus datos no se comparten entre usuarios.</p>
    </section>
  </main>
}

function PasswordRecoveryScreen({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try { await api('/api/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }); setSubmitted(true) } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo iniciar la recuperación.') } finally { setBusy(false) }
  }
  return <main className="auth-shell"><section className="auth-brand"><Brand /><div><p className="eyebrow light">RECUPERACIÓN DE ACCESO</p><h1>Volvé a entrar de forma segura.</h1><p>El enlace es de un solo uso, vence en 30 minutos y nunca se muestra dentro de la aplicación.</p></div><ul><li>Sin revelar si un email existe</li><li>Contraseña nueva de 12 caracteres</li><li>Sesiones anteriores invalidadas</li></ul></section><section className="auth-panel"><div className="auth-card"><p className="eyebrow">RECUPERAR ACCESO</p><h2>Olvidé mi contraseña</h2><p className="auth-description">Ingresá el email con el que creaste tu cuenta. Si existe y el correo está configurado, recibirás un enlace de recuperación.</p>{submitted ? <><p className="recovery-notice" role="status">Si existe una cuenta asociada y el correo de recuperación está configurado, se enviarán las instrucciones. Revisá también la carpeta de spam.</p><button className="secondary-button" type="button" onClick={onBack}>Volver a ingresar</button></> : <form className="auth-form" onSubmit={submit}><label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required autoFocus /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button auth-submit" disabled={busy} type="submit">{busy ? 'Enviando…' : 'Enviar enlace de recuperación'}</button><button className="auth-link" type="button" onClick={onBack}>Volver a ingresar</button></form>}</div><p className="auth-footnote">La recuperación no comparte datos de tu cuenta ni revela si el email está registrado.</p></section></main>
}

function PasswordResetScreen({ token, onAuthenticated }: { token: string; onAuthenticated: (message?: string) => Promise<void> }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const leaveReset = () => window.location.assign(window.location.pathname)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password') ?? '')
    const confirmation = String(data.get('confirmation') ?? '')
    if (password !== confirmation) { setError('La confirmación no coincide con la nueva contraseña.'); return }
    setBusy(true)
    try {
      await api('/api/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, password }) })
      window.history.replaceState({}, '', window.location.pathname)
      await onAuthenticated('Contraseña restablecida. Las demás sesiones se cerraron por seguridad.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo restablecer la contraseña.') } finally { setBusy(false) }
  }
  return <main className="auth-shell"><section className="auth-brand"><Brand /><div><p className="eyebrow light">RECUPERACIÓN DE ACCESO</p><h1>Creá una contraseña nueva.</h1><p>Al confirmarla, todas las otras sesiones de esta cuenta se cerrarán.</p></div><ul><li>Enlace de un solo uso</li><li>Vencimiento de 30 minutos</li><li>Sesión segura al finalizar</li></ul></section><section className="auth-panel"><div className="auth-card"><p className="eyebrow">RESTABLECER CONTRASEÑA</p><h2>Elegí una contraseña nueva</h2><p className="auth-description">Usá al menos 12 caracteres. No reutilices una contraseña de otro servicio.</p><form className="auth-form" onSubmit={submit}><label>Nueva contraseña<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={256} required autoFocus /><small>Entre 12 y 256 caracteres.</small></label><label>Confirmar contraseña<input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={256} required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button auth-submit" disabled={busy} type="submit">{busy ? 'Restableciendo…' : 'Restablecer contraseña'}</button><button className="auth-link" type="button" onClick={leaveReset}>Volver a ingresar</button></form></div><p className="auth-footnote">El enlace no se puede usar más de una vez.</p></section></main>
}

function Brand() {
  return <div className="brand"><span className="brand-mark">A</span><span>agente<span>+</span></span></div>
}

function DashboardScreen({ dashboard, setDashboard, notice, setNotice, onLogout }: { dashboard: Dashboard; setDashboard: (value: Dashboard) => void; notice: string; setNotice: (value: string) => void; onLogout: () => void }) {
  const [view, setView] = useState<View>('Hoy')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isRadarCreateOpen, setIsRadarCreateOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const { user } = dashboard
  const selectedOpportunity = dashboard.opportunities.find((item) => item.id === selectedId) ?? null
  const logout = async () => {
    setLoggingOut(true)
    try { await api('/api/auth/logout', { method: 'POST' }); onLogout() } catch (reason) { setNotice(reason instanceof Error ? reason.message : 'No se pudo cerrar la sesión.') } finally { setLoggingOut(false) }
  }
  const updateDashboard = (data: Dashboard, message: string) => { setDashboard(data); setNotice(message) }
  const updateProfile = (updatedUser: User, message: string) => { setDashboard({ ...dashboard, user: updatedUser }); setIsProfileOpen(false); setNotice(message) }
  const titles: Record<View, string> = { Hoy: user.isDemo ? 'Buen día, Florencia' : `Buen día, ${user.name}`, Radar: 'Radar de oportunidades', Oportunidades: 'Tu cartera de oportunidades', Contactos: 'Contactos registrados', Campañas: 'Campañas', Métricas: 'Métricas' }
  const navigation: Array<[View, string]> = [['Hoy', '◈'], ['Radar', '⌁'], ['Oportunidades', '◎'], ['Contactos', '◉'], ['Campañas', '◐'], ['Métricas', '◌']]

  return <main className="app-shell">
    <aside className="sidebar">
      <Brand />
      <button className="account-card account-button" type="button" onClick={() => setIsProfileOpen(true)} aria-label="Abrir perfil de usuario"><span className={`avatar ${user.isDemo ? 'demo' : 'personal'}`}>{user.name.slice(0, 2).toUpperCase()}</span><span><strong>{user.name}</strong><small>{user.isDemo ? 'Cuenta demo · datos sintéticos' : 'Cuenta privada'}</small></span><span className="account-chevron" aria-hidden="true">›</span></button>
      <nav aria-label="Navegación principal">{navigation.map(([item, icon]) => <button className={item === view ? 'nav-item active' : 'nav-item'} key={item} onClick={() => { setView(item); setNotice('') }} type="button"><span aria-hidden="true">{icon}</span>{item}</button>)}</nav>
      <div className="account-actions"><button className="profile-button" type="button" onClick={() => setIsProfileOpen(true)}>Perfil</button><button className="logout-button" type="button" onClick={() => void logout()} disabled={loggingOut}>{loggingOut ? 'Cerrando…' : 'Cerrar sesión'}</button></div>
      <div className="sidebar-foot"><span className={user.isDemo ? 'demo-dot' : 'personal-dot'} />{user.isDemo ? 'Datos demo aislados' : 'Datos guardados en tu cuenta'}</div>
    </aside>
    <section className="workspace">
      <header className="topbar"><div><p className="eyebrow">{view === 'Hoy' ? 'TU ACTIVIDAD Y PRÓXIMOS PASOS' : view.toUpperCase()}</p><h1>{titles[view]}</h1></div>{view === 'Radar' ? <button className="primary-button" type="button" onClick={() => setIsRadarCreateOpen(true)}><span>＋</span> Cargar hallazgo</button> : <button className="primary-button" type="button" onClick={() => setIsCreateOpen(true)}><span>＋</span> Nueva oportunidad</button>}</header>
      {notice && <div className="notice" role="status"><span>✓</span> {notice}</div>}
      {view === 'Hoy' && <TodayView dashboard={dashboard} onOpen={setSelectedId} onCreate={() => setIsCreateOpen(true)} onDashboard={(data, message) => updateDashboard(data, message)} />}
      {view === 'Radar' && <RadarView isCreateOpen={isRadarCreateOpen} onCloseCreate={() => setIsRadarCreateOpen(false)} onDashboard={(data, message) => updateDashboard(data, message)} />}
      {view === 'Oportunidades' && <OpportunitiesView opportunities={dashboard.opportunities} onOpen={setSelectedId} />}
      {view === 'Contactos' && <ContactsView opportunities={dashboard.opportunities} onOpen={setSelectedId} />}
      {(view === 'Campañas' || view === 'Métricas') && <PlannedView view={view} />}
    </section>
    {isCreateOpen && <OpportunityModal isDemo={user.isDemo} onClose={() => setIsCreateOpen(false)} onSaved={(data) => { setIsCreateOpen(false); updateDashboard(data, 'Oportunidad y próximo paso guardados.') }} />}
    {selectedOpportunity && <OpportunityDetail opportunity={selectedOpportunity} agentName={user.name} onClose={() => setSelectedId(null)} onSaved={(data, message = 'Resultado registrado y próximo paso actualizado.') => updateDashboard(data, message)} />}
    {isProfileOpen && <ProfileModal user={user} onClose={() => setIsProfileOpen(false)} onSaved={updateProfile} />}
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

function RadarView({ isCreateOpen, onCloseCreate, onDashboard }: { isCreateOpen: boolean; onCloseCreate: () => void; onDashboard: (data: Dashboard, message: string) => void }) {
  const [items, setItems] = useState<RadarItem[]>([])
  const [filter, setFilter] = useState<'all' | RadarState>('all')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const loadItems = async () => {
    try { setItems((await api<RadarItemsResponse>('/api/radar-items')).items) } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo cargar el Radar.') }
  }

  useEffect(() => {
    let current = true
    void api<RadarItemsResponse>('/api/radar-items')
      .then((data) => { if (current) setItems(data.items) })
      .catch((reason) => { if (current) setError(reason instanceof Error ? reason.message : 'No se pudo cargar el Radar.') })
    return () => { current = false }
  }, [])

  const changeState = async (item: RadarItem, action: 'review' | 'discard' | 'restore') => {
    setBusyId(item.id)
    setError('')
    try { setItems((await api<RadarItemsResponse>(`/api/radar-items/${item.id}/state`, { method: 'POST', body: JSON.stringify({ action }) })).items) } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el hallazgo.') } finally { setBusyId('') }
  }

  const convertToOpportunity = async (item: RadarItem) => {
    setBusyId(item.id)
    setError('')
    try {
      const data = await api<Dashboard>(`/api/radar-items/${item.id}/convert`, { method: 'POST' })
      onDashboard(data, 'Hallazgo convertido en oportunidad. Completá la verificación antes de cualquier contacto.')
      await loadItems()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo convertir el hallazgo.') } finally { setBusyId('') }
  }

  const visibleItems = items.filter((item) => item.state !== 'converted' && (filter === 'all' || item.state === filter))
  const stateLabels: Record<RadarState, string> = { detected: 'Hallazgo', reviewing: 'En revisión', converted: 'Oportunidad creada', discarded: 'Descartada' }

  return <section className="radar-page">
    <section className="panel radar-search-panel">
      <div className="radar-intro"><div><p className="eyebrow">RADAR PRIVADO · SIN LECTURA DE PORTALES</p><h2>Revisá avisos sin copiar catálogos</h2><p>Abrí un portal como usuario y pegá el enlace. Agente+ puede interpretar localmente el texto de esa URL para sugerir datos, pero no abre, consulta ni extrae el contenido del portal.</p></div><span className="radar-mode manual">Enlace asistido</span></div>
      <div className="portal-launchers" aria-label="Portales sugeridos"><a href="https://inmuebles.mercadolibre.com.ar/dueno-directo/" target="_blank" rel="noreferrer">Abrir Mercado Libre ↗</a><a href="https://www.zonaprop.com.ar/" target="_blank" rel="noreferrer">Abrir Zonaprop ↗</a><a href="https://www.argenprop.com/" target="_blank" rel="noreferrer">Abrir Argenprop ↗</a></div>
    </section>
    <div className="radar-notice"><span>i</span><p>Usá los portales en forma manual y respetá las restricciones de cada aviso. El Radar no guarda teléfonos, fotos ni descripciones completas.</p></div>
    {error && <p className="form-error radar-error" role="alert">{error}</p>}
    <section className="radar-results-heading"><div><p className="eyebrow">TU BANDEJA PRIVADA</p><h2>{visibleItems.length} {visibleItems.length === 1 ? 'hallazgo' : 'hallazgos'}</h2></div><select aria-label="Filtrar hallazgos" value={filter} onChange={(event) => setFilter(event.target.value as 'all' | RadarState)}><option value="all">Todos</option><option value="detected">Hallazgos</option><option value="reviewing">En revisión</option><option value="discarded">Descartadas</option></select></section>
    <div className="radar-grid">{visibleItems.map((item) => <article className="radar-card manual-card" key={item.id}>
      <div className="radar-card-top"><span>{item.source.toUpperCase()}</span><small>{radarCaptureMethodLabels[item.captureMethod]} · {stateLabels[item.state]}</small></div>
      <h3>{item.title}</h3><p className="radar-location">{item.neighborhood} · {item.propertyType} · {item.operation}</p>
      {item.priceAmount !== null && <strong className="radar-price">{formatMoney(item.priceAmount, item.currency)}</strong>}
      {item.notes && <p className="radar-card-notes">{item.notes}</p>}
      <div className="radar-actions radar-actions-stack"><a href={item.sourceUrl} target="_blank" rel="noreferrer">Ver oportunidad ↗</a>{item.state === 'detected' && <button type="button" disabled={busyId === item.id} onClick={() => void changeState(item, 'review')}>{busyId === item.id ? 'Actualizando…' : 'Marcar para revisar'}</button>}{item.state === 'reviewing' && <><button type="button" disabled={busyId === item.id} onClick={() => void convertToOpportunity(item)}>{busyId === item.id ? 'Convirtiendo…' : 'Convertir en oportunidad'}</button><button type="button" className="radar-text-action" disabled={busyId === item.id} onClick={() => void changeState(item, 'discard')}>Descartar</button></>}{item.state === 'discarded' && <button type="button" className="radar-text-action" disabled={busyId === item.id} onClick={() => void changeState(item, 'restore')}>Volver a hallazgos</button>}</div>
    </article>)}
    {visibleItems.length === 0 && <div className="empty-card radar-empty"><strong>Tu Radar todavía está vacío</strong><p>Abrí un portal, elegí un aviso de forma manual y cargá un enlace para revisarlo después.</p></div>}</div>
    <p className="radar-legal-note">Un aviso público no confirma que sea dueño directo ni que acepte intermediación. Antes de crear una oportunidad, verificá el aviso, sus restricciones y el canal de contacto.</p>
    {isCreateOpen && <RadarItemModal onClose={onCloseCreate} onSaved={(nextItems) => { setItems(nextItems); onCloseCreate() }} />}
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
    {contacts.map((item) => <button type="button" className="contact-row" key={item.id} onClick={() => onOpen(item.id)}><span className="contact-avatar">{item.name.slice(0, 2).toUpperCase()}</span><span><strong>{item.name}</strong><small>{item.contactDetail}</small></span><span className={`permission-chip ${item.contactPreference}`}>{contactPreferenceLabels[item.contactPreference]}</span><span>→</span></button>)}
    {contacts.length === 0 && <div className="empty-card"><strong>No hay contactos cargados</strong><p>Podés conservar una oportunidad sin datos personales y agregarlos solo cuando sean necesarios y legítimos.</p></div>}
  </div></section>
}

function PlannedView({ view }: { view: 'Campañas' | 'Métricas' }) {
  return <section className="panel planned-view"><span>{view === 'Campañas' ? '◐' : '◌'}</span><p className="eyebrow">SIGUIENTE ETAPA</p><h2>{view === 'Campañas' ? 'Captación entrante' : 'Embudo basado en eventos'}</h2><p>{view === 'Campañas' ? 'Las campañas y formularios entrantes se construirán después de validar la carga y el seguimiento manual.' : 'Los eventos ya se registran. El tablero de métricas se habilitará cuando exista actividad suficiente para evitar conclusiones prematuras.'}</p></section>
}

function OpportunityList({ opportunities, onOpen }: { opportunities: Opportunity[]; onOpen: (id: string) => void }) {
  return <div className="opportunity-list">{opportunities.map((opportunity) => <article className="opportunity" key={opportunity.id}>
    <div className="opportunity-score" style={{ '--score': opportunity.score } as CSSProperties}><span>{opportunity.score}</span></div>
    <button type="button" className="opportunity-copy" onClick={() => onOpen(opportunity.id)}><div className="opportunity-title"><h3>{opportunity.name}</h3><span>{opportunity.status}</span></div><p>{opportunity.propertyType} · {opportunity.neighborhood} · {opportunity.operation}</p><small>{opportunity.source} · {contactPreferenceLabels[opportunity.contactPreference]}</small></button>
    <button className="next-step" type="button" onClick={() => onOpen(opportunity.id)}>{opportunity.closedAt ? 'Ver historial' : opportunity.nextStep} <span>→</span></button>
  </article>)}{opportunities.length === 0 && <p className="empty-state">No hay oportunidades que coincidan con estos filtros.</p>}</div>
}

function ProfileModal({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: (user: User, message: string) => void }) {
  const [name, setName] = useState(user.name)
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileError('')
    setSavingProfile(true)
    try {
      const result = await api<{ user: User }>('/api/account/profile', { method: 'PUT', body: JSON.stringify({ name }) })
      onSaved(result.user, 'Perfil actualizado.')
    } catch (reason) { setProfileError(reason instanceof Error ? reason.message : 'No se pudo actualizar el perfil.') } finally { setSavingProfile(false) }
  }

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordError('')
    const data = new FormData(event.currentTarget)
    const currentPassword = String(data.get('currentPassword') ?? '')
    const newPassword = String(data.get('newPassword') ?? '')
    const confirmation = String(data.get('confirmation') ?? '')
    if (newPassword !== confirmation) { setPasswordError('La confirmación no coincide con la nueva contraseña.'); return }
    setSavingPassword(true)
    try {
      const result = await api<{ user: User }>('/api/account/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) })
      onSaved(result.user, 'Contraseña actualizada. Se cerraron las demás sesiones activas.')
    } catch (reason) { setPasswordError(reason instanceof Error ? reason.message : 'No se pudo actualizar la contraseña.') } finally { setSavingPassword(false) }
  }

  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" onMouseDown={(event) => event.stopPropagation()}>
    <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar perfil">×</button>
    <p className="eyebrow">CUENTA Y SEGURIDAD</p><h2 id="profile-modal-title">Perfil de usuario</h2>
    <p className="modal-description">Tu cuenta es privada. El email identifica el acceso y no se muestra en oportunidades ni contactos.</p>
    <section className="profile-identity"><span className={`avatar ${user.isDemo ? 'demo' : 'personal'}`}>{user.name.slice(0, 2).toUpperCase()}</span><div><strong>{user.isDemo ? 'Cuenta Demo' : 'Cuenta privada'}</strong><small>{user.isDemo ? 'Datos sintéticos para recorrer el producto.' : 'Tu información queda separada de las demás cuentas.'}</small></div></section>
    {user.isDemo ? <p className="profile-readonly">La Demo es compartida y se mantiene como referencia con datos ficticios. Para usar tu propia base, creá una cuenta privada desde la pantalla de acceso.</p> : <>
      <form onSubmit={saveProfile}>
        <label>Nombre visible<input value={name} onChange={(event) => setName(event.target.value)} autoFocus minLength={2} maxLength={80} required /></label>
        <label>Email de acceso<input value={user.email} readOnly aria-readonly="true" /><small>El cambio de email requerirá verificación en una próxima etapa.</small></label>
        {profileError && <p className="form-error" role="alert">{profileError}</p>}
        <div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit" disabled={savingProfile}>{savingProfile ? 'Guardando…' : 'Guardar perfil'}</button></div>
      </form>
      <section className="profile-password"><h3>Cambiar contraseña</h3><p>Al confirmarla, se cerrarán las demás sesiones activas de esta cuenta.</p>
        <form onSubmit={changePassword}>
          <label>Contraseña actual<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
          <div className="form-row"><label>Nueva contraseña<input name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={256} required /><small>Al menos 12 caracteres.</small></label><label>Confirmar contraseña<input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={256} required /></label></div>
          {passwordError && <p className="form-error" role="alert">{passwordError}</p>}
          <div className="modal-actions"><button className="secondary-button" type="submit" disabled={savingPassword}>{savingPassword ? 'Actualizando…' : 'Actualizar contraseña'}</button></div>
        </form>
      </section>
    </>}
  </section></div>
}

function RadarItemModal({ onClose, onSaved }: { onClose: () => void; onSaved: (items: RadarItem[]) => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [source, setSource] = useState('Otro')
  const [neighborhood, setNeighborhood] = useState(neighborhoods[0])
  const [operation, setOperation] = useState('Venta')
  const [propertyType, setPropertyType] = useState(propertyTypes[0])
  const [captureMethod, setCaptureMethod] = useState<RadarCaptureMethod>('manual')
  const [urlSuggestion, setUrlSuggestion] = useState<ReturnType<typeof inferRadarUrl>>(null)
  const [titleEdited, setTitleEdited] = useState(false)

  const updateFromUrl = (value: string) => {
    setSourceUrl(value)
    const suggestion = inferRadarUrl(value)
    setUrlSuggestion(suggestion)
    if (!suggestion) { setCaptureMethod('manual'); return }
    setCaptureMethod('url_assisted')
    setSource(suggestion.source)
    if (suggestion.neighborhood) setNeighborhood(suggestion.neighborhood)
    if (suggestion.operation) setOperation(suggestion.operation)
    if (suggestion.propertyType) setPropertyType(suggestion.propertyType)
    if (!titleEdited) setTitle(suggestion.title)
  }

  const switchToManualEntry = () => {
    setCaptureMethod('manual')
    setUrlSuggestion(null)
    setSource('Otro')
    setNeighborhood(neighborhoods[0])
    setOperation('Venta')
    setPropertyType(propertyTypes[0])
    if (!titleEdited) setTitle('')
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try { onSaved((await api<RadarItemsResponse>('/api/radar-items', { method: 'POST', body: JSON.stringify(Object.fromEntries(data.entries())) })).items) } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar el hallazgo.') } finally { setBusy(false) }
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="radar-modal-title" onMouseDown={(event) => event.stopPropagation()}>
    <button className="modal-close" type="button" onClick={onClose}>×</button><p className="eyebrow">CARGA PRIVADA · SIN CONTACTOS</p><h2 id="radar-modal-title">Cargar hallazgo</h2><p className="modal-description">Pegá primero el enlace. La app interpreta localmente el texto de la URL para sugerir datos; no abre ni lee el aviso del portal. No copies fotos, descripciones completas ni datos personales.</p>
    <form onSubmit={save}>
      <label>Enlace de la publicación<input name="sourceUrl" value={sourceUrl} onChange={(event) => updateFromUrl(event.target.value)} type="url" placeholder="https://…" autoFocus required /></label>
      {urlSuggestion && <p className="url-assist-notice"><strong>Asistencia desde enlace</strong> · {source} detectado{urlSuggestion.neighborhood ? ` · ${urlSuggestion.neighborhood}` : ''}{urlSuggestion.operation ? ` · ${urlSuggestion.operation}` : ''}. Verificá las sugerencias frente al aviso original antes de guardar. <button className="text-button" type="button" onClick={switchToManualEntry}>Completar manualmente</button></p>}
      <input name="captureMethod" type="hidden" value={captureMethod} />
      <div className="form-row"><label>Referencia del aviso<input name="title" value={title} onChange={(event) => { setTitle(event.target.value); setTitleEdited(true) }} placeholder="Ej. Depto 3 amb. con balcón" minLength={2} required /></label><label>Portal<select name="source" value={source} onChange={(event) => setSource(event.target.value)}><option>Mercado Libre</option><option>Zonaprop</option><option>Argenprop</option><option>Otro</option></select></label></div>
      <div className="form-row"><label>Barrio<select name="neighborhood" value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)}>{neighborhoods.map((item) => <option key={item}>{item}</option>)}</select></label><label>Operación<select name="operation" value={operation} onChange={(event) => setOperation(event.target.value)}><option>Venta</option><option>Alquiler</option></select></label></div>
      <div className="form-row"><label>Tipo de propiedad<select name="propertyType" value={propertyType} onChange={(event) => setPropertyType(event.target.value)}>{propertyTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>Precio orientativo <span className="optional">opcional</span><input name="priceAmount" type="number" min="1" step="1" inputMode="numeric" placeholder="Ej. 185000" /></label></div>
      <div className="form-row"><label>Moneda<select name="currency"><option>USD</option><option>ARS</option></select></label><span /></div>
      <label>Notas <span className="optional">opcionales</span><textarea name="notes" rows={3} placeholder="Sólo observaciones propias y necesarias para decidir si revisarlo." /></label>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={busy} type="submit">{busy ? 'Guardando…' : 'Guardar hallazgo'}</button></div>
    </form>
  </section></div>
}

function OpportunityModal({ isDemo, onClose, onSaved }: { isDemo: boolean; onClose: () => void; onSaved: (data: Dashboard) => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [contactOrigin, setContactOrigin] = useState<Opportunity['contactOrigin']>('not_recorded')
  const [contactPreference, setContactPreference] = useState<Opportunity['contactPreference']>('not_contacted')
  const [nextStep, setNextStep] = useState('Realizar primer contacto')
  const needsReviewDate = contactPreference === 'follow_up_agreed' || contactPreference === 'latent'
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
      <div className="form-row"><label>Origen del dato<select name="contactOrigin" value={contactOrigin} onChange={(event) => setContactOrigin(event.target.value as Opportunity['contactOrigin'])}>{Object.entries(contactOriginLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Dato de contacto <span className="optional">opcional</span><input name="contactDetail" placeholder="Teléfono, email o usuario" /></label></div>
      <div className="form-row"><label>Preferencia de seguimiento<select name="contactPreference" value={contactPreference} onChange={(event) => { const value = event.target.value as Opportunity['contactPreference']; setContactPreference(value); setNextStep(value === 'do_not_contact' ? 'No contactar' : value === 'follow_up_agreed' ? 'Retomar conversación acordada' : value === 'latent' ? 'Revisar oportunidad latente' : nextStep === 'No contactar' ? 'Realizar primer contacto' : nextStep) }}>{Object.entries(contactPreferenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{needsReviewDate ? <label>Fecha de revisión<input name="contactFollowUpAt" type="date" defaultValue={localDateValue()} required /></label> : <label>Fecha de revisión <span className="optional">opcional</span><input name="contactFollowUpAt" type="date" /></label>}</div>
      {contactPreference === 'do_not_contact' && <p className="contact-warning">Esta oportunidad quedará bloqueada para contactos comerciales. La marca no se podrá revertir desde esta pantalla.</p>}
      {contactPreference === 'latent' && <p className="contact-warning">“Latente” crea una revisión manual, no un contacto programado. Verificá otra vez el aviso y el canal antes de escribir.</p>}
      <label>Nota de contacto o seguimiento <span className="optional">opcional</span><textarea name="contactPreferenceNote" rows={2} placeholder="Ej. pidió retomar en noviembre; no incluir datos innecesarios." /></label>
      <label>Notas <span className="optional">opcionales</span><textarea name="notes" rows={3} placeholder="Contexto útil, sin copiar contenido innecesario del portal." /></label>
      <fieldset><legend>Próximo paso obligatorio</legend><div className="form-row"><label>Acción<input name="nextStep" value={nextStep} onChange={(event) => setNextStep(event.target.value)} minLength={2} required readOnly={contactPreference === 'do_not_contact'} /></label><label>Fecha<input name="nextStepDate" type="date" defaultValue={localDateValue()} /></label></div><label>Canal<select name="channel" defaultValue="WhatsApp" disabled={contactPreference === 'do_not_contact'}>{channels.map((item) => <option key={item}>{item}</option>)}</select>{contactPreference === 'do_not_contact' && <input type="hidden" name="channel" value="Sin canal" />}</label></fieldset>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={busy} type="submit">{busy ? 'Guardando…' : 'Guardar oportunidad'}</button></div>
    </form>
  </section></div>
}

function OpportunityDetail({ opportunity, agentName, onClose, onSaved }: { opportunity: Opportunity; agentName: string; onClose: () => void; onSaved: (data: Dashboard, message?: string) => void }) {
  const isPortalOpportunity = ['Mercado Libre', 'Zonaprop', 'Argenprop', 'Otro'].includes(opportunity.source)
  return <div className="modal-backdrop detail-backdrop" onMouseDown={onClose}><section className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="detail-title" onMouseDown={(event) => event.stopPropagation()}>
    <button className="modal-close" type="button" onClick={onClose}>×</button>
    <header className="detail-header"><p className="eyebrow">{opportunity.propertyType} · {opportunity.neighborhood}</p><h2 id="detail-title">{opportunity.name}</h2><div className="detail-badges"><span>{opportunity.status}</span><span className={`permission-chip ${opportunity.contactPreference}`}>{contactPreferenceLabels[opportunity.contactPreference]}</span></div></header>
    <section className="detail-section"><h3>Información de origen</h3><dl className="detail-grid"><div><dt>Operación</dt><dd>{opportunity.operation}</dd></div><div><dt>Fuente</dt><dd>{opportunity.source}</dd></div><div><dt>Contacto</dt><dd>{opportunity.contactDetail || 'No cargado'}</dd></div><div><dt>Origen del dato</dt><dd>{contactOriginLabels[opportunity.contactOrigin]}</dd></div><div><dt>Seguimiento</dt><dd>{contactPreferenceLabels[opportunity.contactPreference]}</dd></div><div><dt>Detectada</dt><dd>{formatDate(opportunity.createdAt)}</dd></div></dl>{opportunity.sourceUrl && <a className="source-link" href={opportunity.sourceUrl} target="_blank" rel="noreferrer">Abrir fuente original ↗</a>}{opportunity.notes && <p className="detail-notes">{opportunity.notes}</p>}</section>
    {!opportunity.closedAt && <ContactRecord opportunity={opportunity} onSaved={onSaved} />}
    {!opportunity.closedAt && <PriceObservations opportunity={opportunity} onSaved={onSaved} />}
    {isPortalOpportunity && !opportunity.closedAt && <ContactPreparation opportunity={opportunity} agentName={agentName} onSaved={onSaved} />}
    {!opportunity.closedAt && <section className="next-callout"><small>PRÓXIMO PASO</small><strong>{opportunity.nextStep}</strong><span>{formatDate(opportunity.nextStepDate)}</span></section>}
    {!opportunity.closedAt && <EventForm opportunity={opportunity} onSaved={onSaved} />}
    <section className="detail-section timeline-section"><h3>Historial comercial</h3><div className="timeline">{opportunity.events.map((event) => <article key={event.id}><span className="timeline-dot" /><div><strong>{event.label}</strong><small>{formatDateTime(event.createdAt)} · {event.channel}</small>{event.notes && <p>{event.notes}</p>}</div></article>)}</div></section>
  </section></div>
}

function ContactRecord({ opportunity, onSaved }: { opportunity: Opportunity; onSaved: (data: Dashboard, message?: string) => void }) {
  const [contactDetail, setContactDetail] = useState(opportunity.contactDetail)
  const [contactOrigin, setContactOrigin] = useState(opportunity.contactOrigin)
  const [contactPreference, setContactPreference] = useState(opportunity.contactPreference)
  const [contactFollowUpAt, setContactFollowUpAt] = useState(opportunity.contactFollowUpAt)
  const [contactPreferenceNote, setContactPreferenceNote] = useState(opportunity.contactPreferenceNote)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const needsReviewDate = contactPreference === 'follow_up_agreed' || contactPreference === 'latent'
  const immutableNoContact = opportunity.contactPreference === 'do_not_contact'

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await api<Dashboard>(`/api/opportunities/${opportunity.id}/contact-record`, { method: 'PUT', body: JSON.stringify({ contactDetail, contactOrigin, contactPreference, contactFollowUpAt, contactPreferenceNote }) })
      onSaved(data, contactPreference === 'do_not_contact' ? 'La oportunidad quedó bloqueada para nuevos contactos.' : contactPreference === 'follow_up_agreed' ? 'Seguimiento agendado según lo acordado.' : contactPreference === 'latent' ? 'Oportunidad marcada como latente para revisión manual.' : 'Datos de contacto y preferencia actualizados.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el contacto.') } finally { setBusy(false) }
  }

  return <section className="detail-section contact-record-box"><div className="preparation-heading"><div><h3>Contacto y preferencia</h3><p>Cargá sólo datos obtenidos manualmente. La app no extrae datos ni envía mensajes.</p></div><span className={`preparation-status ${contactPreference}`}>{contactPreferenceLabels[contactPreference]}</span></div>
    {immutableNoContact ? <p className="contact-warning">La persona pidió no recibir más contacto. Esta marca se conserva y bloquea acciones comerciales.</p> : <form onSubmit={save}>
      <div className="form-row"><label>Dato de contacto <span className="optional">opcional</span><input value={contactDetail} onChange={(event) => setContactDetail(event.target.value)} maxLength={250} placeholder="Teléfono, email o usuario" /></label><label>Origen del dato<select value={contactOrigin} onChange={(event) => setContactOrigin(event.target.value as Opportunity['contactOrigin'])}>{Object.entries(contactOriginLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
      <div className="form-row"><label>Preferencia de seguimiento<select value={contactPreference} onChange={(event) => setContactPreference(event.target.value as Opportunity['contactPreference'])}>{Object.entries(contactPreferenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{needsReviewDate ? <label>Fecha de revisión<input value={contactFollowUpAt} onChange={(event) => setContactFollowUpAt(event.target.value)} type="date" required /></label> : <label>Fecha de revisión <span className="optional">opcional</span><input value={contactFollowUpAt} onChange={(event) => setContactFollowUpAt(event.target.value)} type="date" /></label>}</div>
      {contactPreference === 'latent' && <p className="contact-warning">Una oportunidad latente sólo genera una revisión manual. Antes de otro contacto, verificá nuevamente el aviso, el canal y la preferencia de la persona.</p>}
      {contactPreference === 'do_not_contact' && <p className="contact-warning">Al guardar, se bloquearán los contactos comerciales y no podrá revertirse desde esta pantalla.</p>}
      <label>Nota <span className="optional">opcional</span><textarea value={contactPreferenceNote} onChange={(event) => setContactPreferenceNote(event.target.value)} maxLength={1000} rows={2} placeholder="Ej. pidió retomar en noviembre; no incluir datos innecesarios." /></label>
      {error && <p className="form-error">{error}</p>}
      <div className="preparation-actions"><button className="secondary-button" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar contacto y preferencia'}</button></div>
    </form>}
  </section>
}

function PriceObservations({ opportunity, onSaved }: { opportunity: Opportunity; onSaved: (data: Dashboard, message?: string) => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const observations = opportunity.priceObservations ?? []
  const latest = observations[0]
  const previous = observations[1]
  const variation = latest && previous && latest.currency === previous.currency ? latest.amount - previous.amount : null
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    const data = new FormData(event.currentTarget)
    try {
      onSaved(await api<Dashboard>(`/api/opportunities/${opportunity.id}/price-observations`, { method: 'POST', body: JSON.stringify(Object.fromEntries(data.entries())) }), 'Precio observado guardado. Revisá la fuente original antes de interpretar la variación.')
      event.currentTarget.reset()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar el precio.') } finally { setBusy(false) }
  }
  return <section className="detail-section price-box"><div className="preparation-heading"><div><h3>Precio observado</h3><p>Registro manual de referencia. No monitorea portales ni concluye por qué cambió un precio.</p></div>{latest && <span className="preparation-status ready">{formatMoney(latest.amount, latest.currency)}</span>}</div>
    {variation !== null && <p className={variation < 0 ? 'price-variation lower' : variation > 0 ? 'price-variation higher' : 'price-variation'}>{variation < 0 ? '↓ Bajó' : variation > 0 ? '↑ Subió' : '• Sin variación'} respecto de la observación anterior.</p>}
    {observations.length > 0 && <div className="price-history">{observations.slice(0, 3).map((item) => <span key={item.id}><strong>{formatMoney(item.amount, item.currency)}</strong> · {formatDate(item.observedAt)}</span>)}</div>}
    <form onSubmit={save}><div className="form-row"><label>Precio<input name="amount" type="number" min="1" step="1" inputMode="numeric" required /></label><label>Moneda<select name="currency" defaultValue={latest?.currency ?? 'USD'}><option>USD</option><option>ARS</option></select></label></div><label>Fecha observada<input name="observedAt" type="date" defaultValue={localDateValue()} required /></label>{error && <p className="form-error">{error}</p>}<div className="preparation-actions"><button className="secondary-button" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Registrar precio manualmente'}</button></div></form>
  </section>
}

function ContactPreparation({ opportunity, agentName, onSaved }: { opportunity: Opportunity; agentName: string; onSaved: (data: Dashboard, message?: string) => void }) {
  const [sourceReviewed, setSourceReviewed] = useState(Boolean(opportunity.contactSourceReviewed))
  const [listingPolicy, setListingPolicy] = useState(opportunity.contactListingPolicy)
  const [channel, setChannel] = useState(opportunity.plannedContactChannel === 'Sin canal' ? 'WhatsApp' : opportunity.plannedContactChannel)
  const [noLlameCheckedAt, setNoLlameCheckedAt] = useState(opportunity.noLlameCheckedAt)
  const [draft, setDraft] = useState(opportunity.contactDraft)
  const [notes, setNotes] = useState(opportunity.contactPreparationNotes)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const needsNoLlame = channel === 'WhatsApp' || channel === 'Llamada'
  const storedReady = opportunity.contactPreparationStatus === 'ready'
  const statusLabels = { not_started: 'Pendiente', pending: 'Pendiente', ready: 'Lista para copiar', blocked: 'No contactar' }
  const status = opportunity.contactPreparationStatus
  const defaultDraft = `Hola [nombre], vi tu publicación de ${opportunity.propertyType.toLowerCase()} en ${opportunity.neighborhood}. Soy ${agentName}, agente inmobiliario. Si estás evaluando recibir asesoramiento o una tasación, puedo contarte cómo trabajo. Si preferís no recibir más mensajes, avisame y lo respeto. Gracias.`

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const data = await api<Dashboard>(`/api/opportunities/${opportunity.id}/contact-preparation`, { method: 'PUT', body: JSON.stringify({ sourceReviewed, listingPolicy, channel, noLlameCheckedAt, draft, notes }) })
      onSaved(data, listingPolicy === 'no_agents' ? 'La oportunidad quedó bloqueada para contacto desde el aviso.' : 'Verificación de contacto guardada. No se envió ningún mensaje.')
      setNotice('Guardado. No se envió ningún mensaje.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar la verificación.') } finally { setBusy(false) }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(draft); setNotice('Borrador copiado. Revisalo antes de enviarlo manualmente.') } catch { setError('No se pudo copiar automáticamente. Seleccioná el texto y copialo de forma manual.') }
  }

  return <section className="detail-section preparation-box"><div className="preparation-heading"><div><h3>Verificación antes de contactar</h3><p>Este control no consulta registros ni envía mensajes por vos.</p></div><span className={`preparation-status ${status}`}>{statusLabels[status]}</span></div>
    <form onSubmit={save}>
      <label className="check-row"><input type="checkbox" checked={sourceReviewed} onChange={(event) => setSourceReviewed(event.target.checked)} />Revisé el aviso original y sus restricciones.</label>
      <label>Restricción del aviso<select value={listingPolicy} onChange={(event) => setListingPolicy(event.target.value as Opportunity['contactListingPolicy'])}><option value="not_started">No está confirmada</option><option value="allows_agents">Admite contacto de inmobiliarias</option><option value="no_agents">Inmobiliarias abstenerse / no contactar</option></select></label>
      <label>Canal previsto<select value={channel} onChange={(event) => setChannel(event.target.value)}><option>WhatsApp</option><option>Llamada</option><option>Instagram</option><option>Email</option></select></label>
      {needsNoLlame && <label>Registro No Llame verificado el<input type="date" value={noLlameCheckedAt} onChange={(event) => setNoLlameCheckedAt(event.target.value)} /><small>La app no realiza esta consulta: registrá sólo la fecha luego de verificarla.</small></label>}
      {listingPolicy === 'no_agents' && <p className="contact-warning">El aviso indica que no debe iniciarse contacto. Guardalo como referencia o descartalo, pero no prepares ni envíes un mensaje.</p>}
      <label>Nota de verificación <span className="optional">opcional</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Ej. el aviso aclara que acepta intermediación." /></label>
      {listingPolicy !== 'no_agents' && <><div className="draft-heading"><strong>Borrador de primer mensaje</strong><button type="button" className="text-button" disabled={!storedReady} onClick={() => setDraft(defaultDraft)}>Generar borrador</button></div><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={5} placeholder="Guardá una verificación completa para generar un borrador editable." disabled={!storedReady} /><small className="draft-note">No se envía desde Agente+. La persona usuaria debe editarlo, copiarlo y decidir manualmente si corresponde enviarlo.</small></>}
      {error && <p className="form-error">{error}</p>}{notice && <p className="preparation-notice">{notice}</p>}
      <div className="preparation-actions"><button className="secondary-button" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar verificación'}</button><button className="primary-button" type="button" disabled={!storedReady || !draft.trim()} onClick={() => void copy()}>Copiar borrador</button></div>
    </form>
  </section>
}

function EventForm({ opportunity, onSaved }: { opportunity: Opportunity; onSaved: (data: Dashboard) => void }) {
  const restricted = opportunity.contactPreference === 'do_not_contact' || opportunity.contactPermission === 'do_not_contact'
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
