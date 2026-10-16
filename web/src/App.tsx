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
  contactResult: ContactResult | ''
  createdAt: string
}
type OwnerDirectStatus = 'a_verificar' | 'declarado_en_aviso' | 'no_aplica'
type ContactResult = 'sin_respuesta' | 'interesado' | 'seguimiento_acordado' | 'latente' | 'no_continuar' | 'no_contactar'
type PriceObservation = {
  id: string
  opportunityId: string
  amount: number
  currency: 'USD' | 'ARS'
  observedAt: string
  createdAt: string
}
type Client = {
  id: string
  opportunityId: string
  conversionReason: 'captacion_confirmada' | 'tasacion_solicitada' | 'acuerdo_comercial' | 'otro_confirmado'
  convertedAt: string
  name: string
  neighborhood: string
  operation: 'Venta' | 'Alquiler'
  propertyType: string
  status: string
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
  contactPhone: string
  contactEmail: string
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
  ownerDirectStatus: OwnerDirectStatus
  clientId: string
  events: OpportunityEvent[]
  priceObservations: PriceObservation[]
}
type Dashboard = { user: User; tasks: Task[]; opportunities: Opportunity[]; clients: Client[] }
type AuthMode = 'login' | 'register'
type View = 'Hoy' | 'Radar' | 'Oportunidades' | 'Clientes' | 'Contactos' | 'Campañas' | 'Métricas'
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
  contactPhone: string
  contactEmail: string
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
const ownerDirectLabels: Record<OwnerDirectStatus, string> = {
  a_verificar: 'A verificar',
  declarado_en_aviso: 'Declarado en aviso',
  no_aplica: 'No aplica',
}
const contactResultLabels: Record<ContactResult, string> = {
  sin_respuesta: 'Sin respuesta',
  interesado: 'Interesado',
  seguimiento_acordado: 'Seguimiento acordado',
  latente: 'Latente',
  no_continuar: 'No continuar',
  no_contactar: 'No contactar',
}
const clientConversionLabels: Record<Client['conversionReason'], string> = {
  captacion_confirmada: 'Captación confirmada',
  tasacion_solicitada: 'Tasación solicitada formalmente',
  acuerdo_comercial: 'Acuerdo comercial confirmado',
  otro_confirmado: 'Otro vínculo comercial confirmado',
}
const ownerDirectLabel = (status?: OwnerDirectStatus) => ownerDirectLabels[status ?? 'a_verificar']
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

function addDaysToLocalDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`)
  date.setDate(date.getDate() + days)
  return localDateValue(date)
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
  if (window.location.pathname === '/solicitar-asistencia') return <InboundRequestPage recipientToken={new URLSearchParams(window.location.search).get('para') ?? ''} />
  return <AppShell />
}

function AppShell() {
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

function InboundRequestPage({ recipientToken }: { recipientToken: string }) {
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    const data = new FormData(event.currentTarget)
    try {
      await api(`/api/inbound-requests/${encodeURIComponent(recipientToken)}`, { method: 'POST', body: JSON.stringify({ name: data.get('name'), contactDetail: data.get('contactDetail'), neighborhood: data.get('neighborhood'), operation: data.get('operation'), propertyType: data.get('propertyType'), message: data.get('message'), consent: data.get('consent') === 'on', company: data.get('company') }) })
      setSubmitted(true)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo enviar la solicitud. Intentá nuevamente más tarde.') } finally { setBusy(false) }
  }
  if (!recipientToken) return <main className="inbound-shell"><section className="inbound-card"><Brand /><h1>Este enlace no es válido.</h1><p>Pedí un enlace nuevo a la persona que te compartió este formulario.</p></section></main>
  return <main className="inbound-shell"><section className="inbound-card"><Brand /><p className="eyebrow">ASESORAMIENTO INMOBILIARIO</p><h1>¿Necesitás ayuda para vender o alquilar?</h1><p className="inbound-description">Dejá tus datos sólo si querés que te contacten para orientarte sobre tu propiedad. No implica contratación ni publicación.</p>{submitted ? <p className="inbound-success" role="status">Recibimos tu solicitud. Te responderán por el medio de contacto que indicaste.</p> : <form className="inbound-form" onSubmit={submit}><label>Nombre<input name="name" autoComplete="name" minLength={2} maxLength={80} required /></label><label>Email o teléfono<input name="contactDetail" autoComplete="email" minLength={6} maxLength={250} required /><small>Usaremos este dato sólo para responder tu solicitud.</small></label><div className="form-row"><label>Zona<select name="neighborhood" defaultValue="" required><option value="" disabled>Elegí una zona</option>{neighborhoods.map((item) => <option key={item}>{item}</option>)}</select></label><label>Operación<select name="operation" defaultValue="Venta"><option>Venta</option><option>Alquiler</option></select></label></div><label>Tipo de inmueble<select name="propertyType" defaultValue="Departamento">{propertyTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>Contanos brevemente qué necesitás <span className="optional">opcional</span><textarea name="message" rows={4} maxLength={1000} placeholder="Ej. Quiero saber cómo valuar mi departamento." /></label><input className="inbound-honeypot" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" /><label className="inbound-consent"><input name="consent" type="checkbox" required />Autorizo que usen estos datos para responder esta solicitud de asesoramiento.</label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button inbound-submit" type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar solicitud'}</button></form>}<p className="inbound-footnote">Podés pedir que no vuelvan a contactarte en cualquier momento.</p></section></main>
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
  const titles: Record<View, string> = { Hoy: user.isDemo ? 'Buen día, Florencia' : `Buen día, ${user.name}`, Radar: 'Radar de oportunidades', Oportunidades: 'Tu cartera de oportunidades', Clientes: 'Relaciones comerciales confirmadas', Contactos: 'Contactos registrados', Campañas: 'Campañas', Métricas: 'Métricas' }
  const navigation: Array<[View, string]> = [['Hoy', '◈'], ['Radar', '⌁'], ['Oportunidades', '◎'], ['Clientes', '◆'], ['Contactos', '◉'], ['Campañas', '◐'], ['Métricas', '◌']]

  return <main className="app-shell">
    <aside className="sidebar">
      <Brand />
      <button className="account-card account-button" type="button" onClick={() => setIsProfileOpen(true)} aria-label="Abrir perfil de usuario"><span className={`avatar ${user.isDemo ? 'demo' : 'personal'}`}>{user.name.slice(0, 2).toUpperCase()}</span><span><strong>{user.name}</strong><small>{user.isDemo ? 'Cuenta demo · datos sintéticos' : 'Cuenta privada'}</small></span><span className="account-chevron" aria-hidden="true">›</span></button>
      <nav aria-label="Navegación principal">{navigation.map(([item, icon]) => <button className={item === view ? 'nav-item active' : 'nav-item'} key={item} onClick={() => { setView(item); setNotice('') }} type="button"><span aria-hidden="true">{icon}</span>{item}</button>)}</nav>
      <div className="account-actions"><button className="profile-button" type="button" onClick={() => setIsProfileOpen(true)}>Perfil</button><button className="logout-button" type="button" onClick={() => void logout()} disabled={loggingOut}>{loggingOut ? 'Cerrando…' : 'Cerrar sesión'}</button></div>
      <div className="sidebar-foot"><span className={user.isDemo ? 'demo-dot' : 'personal-dot'} />{user.isDemo ? 'Datos demo aislados' : 'Datos guardados en tu cuenta'}</div>
    </aside>
    <section className="workspace">
      <header className="topbar"><div><p className="eyebrow">{view === 'Hoy' ? 'TU ACTIVIDAD Y PRÓXIMOS PASOS' : view.toUpperCase()}</p><h1>{titles[view]}</h1></div>{view === 'Radar' ? <button className="primary-button" type="button" onClick={() => setIsRadarCreateOpen(true)}><span>＋</span> Cargar hallazgo</button> : view === 'Clientes' ? null : <button className="primary-button" type="button" onClick={() => setIsCreateOpen(true)}><span>＋</span> Nueva oportunidad</button>}</header>
      {notice && <div className="notice" role="status"><span>✓</span> {notice}</div>}
      {view === 'Hoy' && <TodayView dashboard={dashboard} onOpen={setSelectedId} onCreate={() => setIsCreateOpen(true)} onDashboard={(data, message) => updateDashboard(data, message)} />}
      {view === 'Radar' && <RadarView isCreateOpen={isRadarCreateOpen} onCloseCreate={() => setIsRadarCreateOpen(false)} onDashboard={(data, message) => updateDashboard(data, message)} />}
      {view === 'Oportunidades' && <OpportunitiesView opportunities={dashboard.opportunities} tasks={dashboard.tasks} onOpen={setSelectedId} />}
      {view === 'Clientes' && <ClientsView clients={dashboard.clients} onOpen={setSelectedId} />}
      {view === 'Contactos' && <ContactsView opportunities={dashboard.opportunities} onOpen={setSelectedId} />}
      {view === 'Campañas' && <PlannedView />}
      {view === 'Métricas' && <MetricsView dashboard={dashboard} onOpen={setSelectedId} />}
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
  const [searchNeighborhood, setSearchNeighborhood] = useState('Núñez')
  const [searchOperation, setSearchOperation] = useState<'Venta' | 'Alquiler'>('Venta')
  const [searchPropertyType, setSearchPropertyType] = useState('Departamento')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [editingItem, setEditingItem] = useState<RadarItem | null>(null)

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
  const directOwnerSearchQuery = `"dueño directo" ${searchOperation.toLowerCase()} ${searchPropertyType.toLowerCase()} ${searchNeighborhood} Buenos Aires`
  const directOwnerSearchHref = `https://duckduckgo.com/?q=${encodeURIComponent(directOwnerSearchQuery)}`

  return <section className="radar-page">
    <section className="panel radar-search-panel">
      <section className="radar-web-search" aria-label="Búsqueda asistida de avisos"><div><p className="eyebrow">RADAR PRIVADO · SIN LECTURA DE PORTALES</p><h3>Buscar avisos de dueño directo en la web</h3><p>Abre el listado del buscador con estos criterios. Agente+ no recibe, lee ni guarda resultados; revisá el aviso original antes de cargar su enlace.</p></div><div className="radar-web-search-controls"><label>Zona<select value={searchNeighborhood} onChange={(event) => setSearchNeighborhood(event.target.value)}>{neighborhoods.map((item) => <option key={item}>{item}</option>)}</select></label><label>Operación<select value={searchOperation} onChange={(event) => setSearchOperation(event.target.value as 'Venta' | 'Alquiler')}><option>Venta</option><option>Alquiler</option></select></label><label>Tipo<select value={searchPropertyType} onChange={(event) => setSearchPropertyType(event.target.value)}>{propertyTypes.map((item) => <option key={item}>{item}</option>)}</select></label><a className="primary-button" href={directOwnerSearchHref} target="_blank" rel="noreferrer">Buscar en la web ↗</a></div></section>
      <div className="portal-launchers" aria-label="Portales sugeridos"><a href="https://inmuebles.mercadolibre.com.ar/dueno-directo/" target="_blank" rel="noreferrer">Abrir Mercado Libre ↗</a><a href="https://www.zonaprop.com.ar/" target="_blank" rel="noreferrer">Abrir Zonaprop ↗</a><a href="https://www.argenprop.com/" target="_blank" rel="noreferrer">Abrir Argenprop ↗</a></div>
    </section>
    <div className="radar-notice"><span>i</span><p>Usá los portales en forma manual y respetá las restricciones de cada aviso. El Radar no lee ni extrae teléfonos, emails, fotos ni descripciones completas; cualquier contacto se carga manualmente y requiere verificación.</p></div>
    {error && <p className="form-error radar-error" role="alert">{error}</p>}
    <section className="radar-results-heading"><div><p className="eyebrow">TU BANDEJA PRIVADA</p><h2>{visibleItems.length} {visibleItems.length === 1 ? 'hallazgo' : 'hallazgos'}</h2></div><select aria-label="Filtrar hallazgos" value={filter} onChange={(event) => setFilter(event.target.value as 'all' | RadarState)}><option value="all">Todos</option><option value="detected">Hallazgos</option><option value="reviewing">En revisión</option><option value="discarded">Descartadas</option></select></section>
    <div className="radar-grid">{visibleItems.map((item) => <article className="radar-card manual-card" key={item.id}>
      <div className="radar-card-header"><span className="radar-source">{item.source}</span><span className={`radar-state radar-state-${item.state}`}>{stateLabels[item.state]}</span></div>
      <div className="radar-card-body">
        <p className="radar-capture-method">{radarCaptureMethodLabels[item.captureMethod]}</p>
        <h3>{item.title}</h3><p className="radar-location">{item.neighborhood} · {item.propertyType} · {item.operation}</p>
        {item.priceAmount !== null && <strong className="radar-price">{formatMoney(item.priceAmount, item.currency)}</strong>}
        {item.notes && <p className="radar-note-indicator">Observación privada disponible al editar</p>}
      </div>
      <div className="radar-card-footer">
        <div className="radar-card-utilities"><a href={item.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Abrir aviso original: ${item.title}`}>Abrir aviso original ↗</a><button type="button" className="radar-text-action" disabled={busyId === item.id} onClick={() => setEditingItem(item)} aria-label={`Editar hallazgo: ${item.title}`}>Editar</button></div>
        {item.state === 'detected' && <button type="button" className="radar-primary-action" disabled={busyId === item.id} onClick={() => void changeState(item, 'review')}>{busyId === item.id ? 'Actualizando…' : 'Revisar hallazgo'}</button>}
        {item.state === 'reviewing' && <><button type="button" className="radar-primary-action" disabled={busyId === item.id} onClick={() => void convertToOpportunity(item)}>{busyId === item.id ? 'Convirtiendo…' : 'Convertir en oportunidad'}</button><button type="button" className="radar-danger-action" disabled={busyId === item.id} onClick={() => void changeState(item, 'discard')}>Descartar hallazgo</button></>}
        {item.state === 'discarded' && <button type="button" className="radar-primary-action" disabled={busyId === item.id} onClick={() => void changeState(item, 'restore')}>Volver a hallazgos</button>}
      </div>
    </article>)}
    {visibleItems.length === 0 && <div className="empty-card radar-empty"><strong>Tu Radar todavía está vacío</strong><p>Abrí un portal, elegí un aviso de forma manual y cargá un enlace para revisarlo después.</p></div>}</div>
    <p className="radar-legal-note">Un aviso público no confirma que sea dueño directo ni que acepte intermediación. Antes de crear una oportunidad, verificá el aviso, sus restricciones y el canal de contacto.</p>
    {(isCreateOpen || editingItem) && <RadarItemModal item={editingItem ?? undefined} onClose={() => { setEditingItem(null); onCloseCreate() }} onSaved={(nextItems) => { setItems(nextItems); setEditingItem(null); onCloseCreate() }} />}
  </section>
}

function OpportunitiesView({ opportunities, tasks, onOpen }: { opportunities: Opportunity[]; tasks: Task[]; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Todas')
  const [neighborhood, setNeighborhood] = useState('Todos')
  const [source, setSource] = useState('Todas')
  const [ownerDirectFilter, setOwnerDirectFilter] = useState<'all' | OwnerDirectStatus>('all')
  const [contactFilter, setContactFilter] = useState<'all' | 'pending' | 'contacted' | 'response'>('all')
  const [resultFilter, setResultFilter] = useState<'all' | ContactResult>('all')
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'overdue' | 'today' | 'week' | 'future' | 'unscheduled'>('all')
  const [sort, setSort] = useState<'priority' | 'newest' | 'oldest'>('priority')
  const statuses = ['Todas', ...Array.from(new Set(opportunities.map((item) => item.status)))]
  const sources = ['Todas', ...Array.from(new Set(opportunities.map((item) => item.source)))]
  const [today] = useState(localDateValue)
  const weekEnd = addDaysToLocalDate(today, 7)
  const pendingTasks = new Map<string, Task>()
  for (const task of tasks.filter((item) => item.state === 'pending' && item.opportunityId)) {
    const current = pendingTasks.get(task.opportunityId)
    if (!current || (task.dueAt || '9999-12-31') < (current.dueAt || '9999-12-31')) pendingTasks.set(task.opportunityId, task)
  }
  const contactEventTypes = ['contact_attempted', 'conversation_started', 'valuation_scheduled', 'valuation_completed', 'proposal_sent']
  const responseEventTypes = ['conversation_started', 'valuation_scheduled', 'valuation_completed', 'proposal_sent']
  const scheduleState = (date: string) => !date ? 'unscheduled' : date < today ? 'overdue' : date === today ? 'today' : date <= weekEnd ? 'week' : 'future'
  const actionLabel = (item: Opportunity, contacted: boolean) => {
    if (item.closedAt) return 'Ver historial'
    if (item.contactPreference === 'do_not_contact') return 'Ver restricción'
    if (['Mercado Libre', 'Zonaprop', 'Argenprop', 'Otro'].includes(item.source) && item.contactPreparationStatus !== 'ready') return 'Preparar contacto'
    return contacted ? 'Registrar resultado' : 'Preparar contacto'
  }
  const filtered = opportunities.filter((item) => {
    const haystack = `${item.name} ${item.source} ${item.propertyType}`.toLowerCase()
    const contacted = item.events.some((event) => contactEventTypes.includes(event.eventType))
    const hasResponse = item.events.some((event) => responseEventTypes.includes(event.eventType))
    const latestResult = item.events.find((event) => event.contactResult)?.contactResult
    const nextTask = pendingTasks.get(item.id)
    const nextSchedule = scheduleState(nextTask?.dueAt || item.nextStepDate)
    return haystack.includes(query.toLowerCase()) && (status === 'Todas' || item.status === status) && (neighborhood === 'Todos' || item.neighborhood === neighborhood) && (source === 'Todas' || item.source === source) && (ownerDirectFilter === 'all' || (item.ownerDirectStatus ?? 'a_verificar') === ownerDirectFilter) && (contactFilter === 'all' || contactFilter === 'pending' && !contacted || contactFilter === 'contacted' && contacted || contactFilter === 'response' && hasResponse) && (resultFilter === 'all' || latestResult === resultFilter) && (scheduleFilter === 'all' || nextSchedule === scheduleFilter)
  }).sort((left, right) => {
    if (sort === 'newest') return right.createdAt.localeCompare(left.createdAt)
    if (sort === 'oldest') return left.createdAt.localeCompare(right.createdAt)
    const leftTask = pendingTasks.get(left.id); const rightTask = pendingTasks.get(right.id)
    const leftPriority = leftTask?.priority === 'Alta' ? 0 : 1; const rightPriority = rightTask?.priority === 'Alta' ? 0 : 1
    return leftPriority - rightPriority || (leftTask?.dueAt || left.nextStepDate || '9999-12-31').localeCompare(rightTask?.dueAt || right.nextStepDate || '9999-12-31')
  })
  return <section className="panel directory-panel">
    <div className="directory-heading"><div><p className="eyebrow">CRM DE CAPTACIÓN · BANDEJA OPERATIVA</p><h2>{filtered.length} oportunidades</h2><p className="crm-description">Priorizá el próximo paso; los teléfonos, emails y notas privadas sólo se consultan dentro de cada ficha.</p></div></div>
    <div className="filters crm-filters"><input aria-label="Buscar oportunidades" placeholder="Buscar por referencia, fuente o tipo…" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filtrar por estado" value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filtrar por barrio" value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)}><option>Todos</option>{neighborhoods.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filtrar por fuente" value={source} onChange={(event) => setSource(event.target.value)}>{sources.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filtrar por dueño directo" value={ownerDirectFilter} onChange={(event) => setOwnerDirectFilter(event.target.value as typeof ownerDirectFilter)}><option value="all">Todo dueño directo</option>{Object.entries(ownerDirectLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><select aria-label="Filtrar por contacto" value={contactFilter} onChange={(event) => setContactFilter(event.target.value as typeof contactFilter)}><option value="all">Todo contacto</option><option value="pending">Sin contacto</option><option value="contacted">Contactadas</option><option value="response">Con respuesta</option></select><select aria-label="Filtrar por resultado" value={resultFilter} onChange={(event) => setResultFilter(event.target.value as typeof resultFilter)}><option value="all">Todo resultado</option>{Object.entries(contactResultLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><select aria-label="Filtrar por próxima acción" value={scheduleFilter} onChange={(event) => setScheduleFilter(event.target.value as typeof scheduleFilter)}><option value="all">Toda próxima acción</option><option value="overdue">Vencidas</option><option value="today">Para hoy</option><option value="week">Esta semana</option><option value="future">Futuras</option><option value="unscheduled">Sin fecha</option></select><select aria-label="Ordenar oportunidades" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="priority">Prioridad y fecha</option><option value="newest">Más recientes</option><option value="oldest">Más antiguas</option></select></div>
    <div className="crm-list">{filtered.map((item) => {
      const contactEvents = item.events.filter((event) => contactEventTypes.includes(event.eventType))
      const lastContact = contactEvents[0]
      const lastResponse = item.events.find((event) => event.contactResult) ?? item.events.find((event) => responseEventTypes.includes(event.eventType))
      const task = pendingTasks.get(item.id)
      const dueAt = task?.dueAt || item.nextStepDate
      const nextSchedule = scheduleState(dueAt)
      const contacted = contactEvents.length > 0
      return <article className="crm-row" key={item.id}><button type="button" className="crm-main" onClick={() => onOpen(item.id)}><div className="opportunity-title"><h3>{item.name}</h3><span>{item.status}</span></div><p>{item.propertyType} · {item.neighborhood} · {item.operation} · {item.source}</p><small>Dueño directo: {ownerDirectLabel(item.ownerDirectStatus)} · Detectada {formatDate(item.createdAt)}</small></button><div className="crm-status"><small>ÚLTIMO CONTACTO</small><strong>{lastContact ? `${lastContact.channel} · ${formatDate(lastContact.createdAt)}` : 'Sin contacto registrado'}</strong><small>{lastResponse ? `Resultado: ${lastResponse.contactResult ? contactResultLabels[lastResponse.contactResult] : lastResponse.label}` : item.contactPreference === 'do_not_contact' ? 'No contactar' : 'Sin respuesta registrada'}</small></div><div className={`crm-next ${nextSchedule}`}><small>PRÓXIMA ACCIÓN</small><strong>{task?.title || item.nextStep || 'Sin próximo paso'}</strong><span>{dueAt ? formatDate(dueAt) : 'Sin fecha'}{task?.priority ? ` · ${task.priority}` : ''}</span></div><button className="next-step crm-action" type="button" onClick={() => onOpen(item.id)}>{actionLabel(item, contacted)} <span>→</span></button></article>
    })}{filtered.length === 0 && <p className="empty-state">No hay oportunidades que coincidan con estos filtros.</p>}</div>
  </section>
}

function ClientsView({ clients, onOpen }: { clients: Client[]; onOpen: (id: string) => void }) {
  return <section className="panel directory-panel clients-panel"><div className="directory-heading"><div><p className="eyebrow">CRM DE CAPTACIÓN · RELACIONES CONFIRMADAS</p><h2>{clients.length} {clients.length === 1 ? 'cliente confirmado' : 'clientes confirmados'}</h2><p className="crm-description">Esta vista no duplica teléfonos, emails ni notas: cada cliente conserva como fuente su oportunidad de origen.</p></div></div><div className="client-list">
    {clients.map((client) => <button className="client-row" type="button" key={client.id} onClick={() => onOpen(client.opportunityId)}><span className="contact-avatar client-avatar">{client.name.slice(0, 2).toUpperCase()}</span><span><strong>{client.name}</strong><small>{client.propertyType} · {client.neighborhood} · {client.operation}</small></span><span><small>VÍNCULO CONFIRMADO</small><strong>{clientConversionLabels[client.conversionReason]}</strong><small>{formatDate(client.convertedAt)}</small></span><span>→</span></button>)}
    {clients.length === 0 && <div className="empty-card"><strong>Aún no hay clientes confirmados</strong><p>Convertí una oportunidad sólo después de registrar una relación comercial real, su motivo y fecha. La ficha conservará el historial completo.</p></div>}
  </div></section>
}

function ContactsView({ opportunities, onOpen }: { opportunities: Opportunity[]; onOpen: (id: string) => void }) {
  const contacts = opportunities.filter((item) => item.contactDetail || item.contactPhone || item.contactEmail)
  return <section className="panel directory-panel"><div className="panel-heading"><div><p className="eyebrow">DATOS APORTADOS MANUALMENTE</p><h2>{contacts.length} contactos registrados</h2></div></div><div className="contact-list">
    {contacts.map((item) => <button type="button" className="contact-row" key={item.id} onClick={() => onOpen(item.id)}><span className="contact-avatar">{item.name.slice(0, 2).toUpperCase()}</span><span><strong>{item.name}</strong><small>{[item.contactPhone, item.contactEmail].filter(Boolean).join(' · ') || item.contactDetail}</small></span><span className={`permission-chip ${item.contactPreference}`}>{contactPreferenceLabels[item.contactPreference]}</span><span>→</span></button>)}
    {contacts.length === 0 && <div className="empty-card"><strong>No hay contactos cargados</strong><p>Podés conservar una oportunidad sin datos personales y agregarlos solo cuando sean necesarios y legítimos.</p></div>}
  </div></section>
}

function PlannedView() {
  return <section className="panel planned-view"><span>◐</span><p className="eyebrow">SIGUIENTE ETAPA</p><h2>Captación entrante</h2><p>Las campañas y formularios entrantes se construirán después de validar la carga y el seguimiento manual.</p></section>
}

function MetricsView({ dashboard, onOpen }: { dashboard: Dashboard; onOpen: (id: string) => void }) {
  const [period, setPeriod] = useState<'30' | '90' | 'all'>('all')
  const [today] = useState(localDateValue)
  const since = period === 'all' ? '' : addDaysToLocalDate(today, -Number(period))
  const inPeriod = (date: string) => !since || date.slice(0, 10) >= since
  const opportunities = dashboard.opportunities.filter((item) => inPeriod(item.createdAt))
  const events = opportunities.flatMap((item) => item.events.filter((event) => inPeriod(event.createdAt)))
  const contactEventTypes = ['contact_attempted', 'conversation_started', 'valuation_scheduled', 'valuation_completed', 'proposal_sent']
  const contacts = events.filter((event) => contactEventTypes.includes(event.eventType))
  const results = events.filter((event) => event.contactResult)
  const clients = dashboard.clients.filter((item) => inPeriod(item.convertedAt))
  const actionableTasks = dashboard.tasks.filter((task) => task.state === 'pending' && task.opportunityId)
  const overdue = actionableTasks.filter((task) => task.dueAt && task.dueAt < today)
  const enoughForRates = opportunities.length >= 10 && contacts.length >= 3
  const firstContactDays = opportunities.flatMap((item) => {
    const first = item.events.filter((event) => contactEventTypes.includes(event.eventType)).at(-1)
    if (!first) return []
    const milliseconds = new Date(first.createdAt).getTime() - new Date(item.createdAt).getTime()
    return Number.isFinite(milliseconds) && milliseconds >= 0 ? [Math.round(milliseconds / 86_400_000)] : []
  }).sort((left, right) => left - right)
  const medianDays = firstContactDays.length >= 3 ? firstContactDays[Math.floor(firstContactDays.length / 2)] : null
  const priorities = actionableTasks.map((task) => ({ task, opportunity: dashboard.opportunities.find((item) => item.id === task.opportunityId) })).filter((item): item is { task: Task; opportunity: Opportunity } => item.opportunity !== undefined && item.opportunity.contactPreference !== 'do_not_contact').sort((left, right) => {
    const leftDue = left.task.dueAt || '9999-12-31'; const rightDue = right.task.dueAt || '9999-12-31'
    const leftPriority = left.task.priority === 'Alta' ? 0 : 1; const rightPriority = right.task.priority === 'Alta' ? 0 : 1
    return (leftDue < today ? 0 : 1) - (rightDue < today ? 0 : 1) || leftPriority - rightPriority || leftDue.localeCompare(rightDue)
  }).slice(0, 5)
  const responseRate = contacts.length ? Math.round((results.length / contacts.length) * 100) : 0
  const conversionRate = opportunities.length ? Math.round((clients.length / opportunities.length) * 100) : 0
  const periodLabel = period === 'all' ? 'Todo el historial' : `Últimos ${period} días`
  const priorityReason = (task: Task) => task.dueAt && task.dueAt < today ? `Vencida desde ${formatDate(task.dueAt)}` : task.dueAt === today ? 'Para hoy' : task.priority === 'Alta' ? 'Prioridad alta' : `Prevista para ${formatDate(task.dueAt)}`
  return <section className="metrics-page"><section className="panel metrics-intro"><div><p className="eyebrow">CRM DE CAPTACIÓN · DATOS DERIVADOS</p><h2>Actividad y prioridades con evidencia</h2><p>Las cifras se calculan a partir de oportunidades, tareas y eventos guardados. No leen portales, no evalúan mensajes ni generan contactos.</p></div><label>Período<select value={period} onChange={(event) => setPeriod(event.target.value as typeof period)}><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option><option value="all">Todo el historial</option></select></label></section>
    {!enoughForRates && <div className="metrics-caution"><strong>Muestra todavía exploratoria</strong><span>{opportunities.length} oportunidades y {contacts.length} eventos de contacto en {periodLabel.toLowerCase()}. Se muestran conteos operativos; las tasas aparecen recién desde 10 oportunidades y 3 contactos.</span></div>}
    <section className="metrics-grid"><MetricCard label="Oportunidades registradas" value={String(opportunities.length)} detail={periodLabel} /><MetricCard label="Contactos registrados" value={String(contacts.length)} detail="Eventos manuales" /><MetricCard label="Resultados estructurados" value={String(results.length)} detail="Con respuesta o preferencia" /><MetricCard label="Clientes confirmados" value={String(clients.length)} detail="Relación comercial registrada" /></section>
    <section className="metrics-detail-grid"><section className="panel metrics-panel"><p className="eyebrow">INDICADORES CON UMBRAL</p><h3>Lecturas comparables</h3><div className="metric-reading"><div><small>Tasa de resultado registrado</small><strong>{enoughForRates ? `${responseRate}%` : '—'}</strong><span>{enoughForRates ? `${results.length} de ${contacts.length} contactos con resultado estructurado.` : 'Requiere muestra mínima para evitar conclusiones.'}</span></div><div><small>Conversión a cliente</small><strong>{enoughForRates ? `${conversionRate}%` : '—'}</strong><span>{enoughForRates ? `${clients.length} clientes sobre ${opportunities.length} oportunidades del período.` : 'No se presenta como tasa con pocos casos.'}</span></div><div><small>Mediana hasta primer contacto</small><strong>{medianDays === null ? '—' : `${medianDays} d`}</strong><span>{medianDays === null ? 'Requiere al menos 3 oportunidades con contacto.' : `Calculada sobre ${firstContactDays.length} oportunidades con evento de contacto.`}</span></div></div></section><section className="panel metrics-panel"><p className="eyebrow">CONTROL OPERATIVO</p><h3>Próximos pasos</h3><div className="metric-reading compact"><div><small>Tareas pendientes</small><strong>{actionableTasks.length}</strong><span>Acciones que todavía requieren revisión manual.</span></div><div><small>Vencidas</small><strong>{overdue.length}</strong><span>Se priorizan abajo, sin enviar recordatorios ni contactos.</span></div><div><small>Bloqueadas por No contactar</small><strong>{dashboard.opportunities.filter((item) => item.contactPreference === 'do_not_contact').length}</strong><span>Se excluyen de las prioridades comerciales.</span></div></div></section></section>
    <section className="panel priorities-panel"><div className="panel-heading"><div><p className="eyebrow">PRIORIDADES SUGERIDAS</p><h2>Qué revisar primero</h2><p>El orden se explica por vencimiento, prioridad y fecha. No es una recomendación de contactar a nadie.</p></div></div><div className="priority-list">{priorities.map(({ task, opportunity }) => <button type="button" key={task.id} className="priority-row" onClick={() => onOpen(opportunity.id)}><span className={task.dueAt && task.dueAt < today ? 'priority-marker overdue' : task.priority === 'Alta' ? 'priority-marker high' : 'priority-marker'} /><span><strong>{task.title}</strong><small>{opportunity.name} · {opportunity.neighborhood}</small></span><span><small>{priorityReason(task)}</small><strong>{task.priority}</strong></span><span>→</span></button>)}{priorities.length === 0 && <div className="empty-card"><strong>No hay acciones comerciales pendientes</strong><p>Cuando exista una tarea con próximo paso, aparecerá aquí con el motivo de su prioridad.</p></div>}</div></section>
  </section>
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="metric-card"><small>{label}</small><strong>{value}</strong><span>{detail}</span></article>
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

function RadarItemModal({ item, onClose, onSaved }: { item?: RadarItem; onClose: () => void; onSaved: (items: RadarItem[]) => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState(item?.title ?? '')
  const [sourceUrl, setSourceUrl] = useState(item?.sourceUrl ?? '')
  const [source, setSource] = useState(item?.source ?? 'Otro')
  const [neighborhood, setNeighborhood] = useState(item?.neighborhood ?? neighborhoods[0])
  const [operation, setOperation] = useState(item?.operation ?? 'Venta')
  const [propertyType, setPropertyType] = useState(item?.propertyType ?? propertyTypes[0])
  const [captureMethod, setCaptureMethod] = useState<RadarCaptureMethod>(item?.captureMethod ?? 'manual')
  const [urlSuggestion, setUrlSuggestion] = useState<ReturnType<typeof inferRadarUrl>>(item?.captureMethod === 'url_assisted' ? inferRadarUrl(item.sourceUrl) : null)
  const [titleEdited, setTitleEdited] = useState(Boolean(item))

  const updateFromUrl = (value: string) => {
    setSourceUrl(value)
    const suggestion = inferRadarUrl(value)
    setUrlSuggestion(suggestion)
    if (!suggestion) { setCaptureMethod('manual'); return }
    setCaptureMethod('url_assisted')
    setSource(suggestion.source)
    if (suggestion.neighborhood) setNeighborhood(suggestion.neighborhood)
    if (suggestion.operation) setOperation(suggestion.operation as 'Venta' | 'Alquiler')
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
    try { onSaved((await api<RadarItemsResponse>(item ? `/api/radar-items/${item.id}` : '/api/radar-items', { method: item ? 'PUT' : 'POST', body: JSON.stringify(Object.fromEntries(data.entries())) })).items) } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar el hallazgo.') } finally { setBusy(false) }
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="radar-modal-title" onMouseDown={(event) => event.stopPropagation()}>
    <button className="modal-close" type="button" onClick={onClose}>×</button><p className="eyebrow">{item ? 'EDICIÓN PRIVADA · CONTACTO MANUAL' : 'CARGA PRIVADA · CONTACTO MANUAL'}</p><h2 id="radar-modal-title">{item ? 'Editar hallazgo' : 'Cargar hallazgo'}</h2><p className="modal-description">Pegá primero el enlace. La app interpreta localmente el texto de la URL para sugerir datos; no abre ni lee el aviso del portal. Los contactos son opcionales, sólo se cargan manualmente y requieren verificación antes de usarse.</p>
    <form onSubmit={save}>
      <label>Enlace de la publicación<input name="sourceUrl" value={sourceUrl} onChange={(event) => updateFromUrl(event.target.value)} type="url" placeholder="https://…" autoFocus required /></label>
      {urlSuggestion && <p className="url-assist-notice"><strong>Asistencia desde enlace</strong> · {source} detectado{urlSuggestion.neighborhood ? ` · ${urlSuggestion.neighborhood}` : ''}{urlSuggestion.operation ? ` · ${urlSuggestion.operation}` : ''}. Verificá las sugerencias frente al aviso original antes de guardar. <button className="text-button" type="button" onClick={switchToManualEntry}>Completar manualmente</button></p>}
      <input name="captureMethod" type="hidden" value={captureMethod} />
      <div className="form-row"><label>Referencia del aviso<input name="title" value={title} onChange={(event) => { setTitle(event.target.value); setTitleEdited(true) }} placeholder="Ej. Depto 3 amb. con balcón" minLength={2} required /></label><label>Portal<select name="source" value={source} onChange={(event) => setSource(event.target.value)}><option>Mercado Libre</option><option>Zonaprop</option><option>Argenprop</option><option>Otro</option></select></label></div>
      <div className="form-row"><label>Barrio<select name="neighborhood" value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)}>{neighborhoods.map((item) => <option key={item}>{item}</option>)}</select></label><label>Operación<select name="operation" value={operation} onChange={(event) => setOperation(event.target.value as 'Venta' | 'Alquiler')}><option>Venta</option><option>Alquiler</option></select></label></div>
      <div className="form-row"><label>Tipo de propiedad<select name="propertyType" value={propertyType} onChange={(event) => setPropertyType(event.target.value)}>{propertyTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>Precio orientativo <span className="optional">opcional</span><input name="priceAmount" type="number" min="1" step="1" inputMode="numeric" defaultValue={item?.priceAmount ?? ''} placeholder="Ej. 185000" /></label></div>
      <div className="form-row"><label>Moneda<select name="currency" defaultValue={item?.currency ?? 'USD'}><option>USD</option><option>ARS</option></select></label><span /></div>
      <fieldset><legend>Contacto manual privado <span className="optional">opcional</span></legend><p className="contact-warning">No se extrae ni interpreta desde el aviso. Si lo cargás, se trasladará a la oportunidad como “Aviso a verificar”, sin habilitar contacto ni envío.</p><div className="form-row"><label>WhatsApp o teléfono<input name="contactPhone" type="tel" defaultValue={item?.contactPhone ?? ''} maxLength={100} placeholder="Ej. +54 11 1234 5678" /></label><label>Email<input name="contactEmail" type="email" defaultValue={item?.contactEmail ?? ''} maxLength={254} placeholder="nombre@ejemplo.com" /></label></div></fieldset>
      <label>Notas <span className="optional">opcionales</span><textarea name="notes" defaultValue={item?.notes ?? ''} rows={3} placeholder="Sólo observaciones propias y necesarias para decidir si revisarlo." /></label>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={busy} type="submit">{busy ? 'Guardando…' : item ? 'Guardar cambios' : 'Guardar hallazgo'}</button></div>
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
    <section className="detail-section"><h3>Información de origen</h3><dl className="detail-grid"><div><dt>Operación</dt><dd>{opportunity.operation}</dd></div><div><dt>Fuente</dt><dd>{opportunity.source}</dd></div><div><dt>WhatsApp o teléfono</dt><dd>{opportunity.contactPhone || 'No cargado'}</dd></div><div><dt>Email</dt><dd>{opportunity.contactEmail || (opportunity.contactPhone ? 'No cargado' : opportunity.contactDetail || 'No cargado')}</dd></div><div><dt>Origen del dato</dt><dd>{contactOriginLabels[opportunity.contactOrigin]}</dd></div><div><dt>Seguimiento</dt><dd>{contactPreferenceLabels[opportunity.contactPreference]}</dd></div><div><dt>Detectada</dt><dd>{formatDate(opportunity.createdAt)}</dd></div></dl>{opportunity.sourceUrl && <a className="source-link" href={opportunity.sourceUrl} target="_blank" rel="noreferrer">Abrir fuente original ↗</a>}{opportunity.notes && <details className="detail-notes"><summary>Ver observación privada</summary><p>{opportunity.notes}</p></details>}</section>
    {!opportunity.closedAt && <OwnerDirectRecord opportunity={opportunity} onSaved={onSaved} />}
    {opportunity.clientId ? <ClientConfirmedRecord /> : !opportunity.closedAt && opportunity.contactPreference !== 'do_not_contact' && <ClientConversion opportunity={opportunity} onSaved={onSaved} />}
    {!opportunity.closedAt && <ContactRecord opportunity={opportunity} onSaved={onSaved} />}
    {!opportunity.closedAt && <PriceObservations opportunity={opportunity} onSaved={onSaved} />}
    {isPortalOpportunity && !opportunity.closedAt && <ContactPreparation opportunity={opportunity} agentName={agentName} onSaved={onSaved} />}
    {!opportunity.closedAt && <section className="next-callout"><small>PRÓXIMO PASO</small><strong>{opportunity.nextStep}</strong><span>{formatDate(opportunity.nextStepDate)}</span></section>}
    {!opportunity.closedAt && <EventForm opportunity={opportunity} onSaved={onSaved} />}
    <section className="detail-section timeline-section"><h3>Historial comercial</h3><div className="timeline">{opportunity.events.map((event) => <article key={event.id}><span className="timeline-dot" /><div><strong>{event.label}</strong><small>{formatDateTime(event.createdAt)} · {event.channel}</small>{event.notes && <p>{event.notes}</p>}</div></article>)}</div></section>
  </section></div>
}

function ClientConfirmedRecord() {
  return <section className="detail-section client-confirmed-box"><div className="preparation-heading"><div><h3>Cliente confirmado</h3><p>La relación comercial se registró sin duplicar datos personales. Esta oportunidad conserva su fuente, contacto e historial.</p></div><span className="preparation-status ready">Confirmado</span></div></section>
}

function ClientConversion({ opportunity, onSaved }: { opportunity: Opportunity; onSaved: (data: Dashboard, message?: string) => void }) {
  const [conversionReason, setConversionReason] = useState<Client['conversionReason']>('captacion_confirmada')
  const [convertedAt, setConvertedAt] = useState(localDateValue())
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await api<Dashboard>(`/api/opportunities/${opportunity.id}/convert-client`, { method: 'POST', body: JSON.stringify({ conversionReason, convertedAt, confirmed }) })
      onSaved(data, 'Cliente confirmado. Se conserva el historial y se creó el próximo paso de captación.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo confirmar el cliente.') } finally { setBusy(false) }
  }
  return <section className="detail-section client-conversion-box"><div className="preparation-heading"><div><h3>Convertir en cliente</h3><p>Usalo sólo si existe una relación comercial real. No convierte una respuesta, un aviso ni una intención informal en cliente.</p></div></div><form onSubmit={save}><div className="form-row"><label>Motivo<select value={conversionReason} onChange={(event) => setConversionReason(event.target.value as Client['conversionReason'])}>{Object.entries(clientConversionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Fecha de confirmación<input value={convertedAt} onChange={(event) => setConvertedAt(event.target.value)} type="date" required /></label></div><label className="check-row"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />Confirmo que existe una relación comercial real y que este registro es correcto.</label><p className="contact-warning">Esta acción no envía mensajes ni copia teléfonos, emails u observaciones a otra base de datos.</p>{error && <p className="form-error">{error}</p>}<div className="preparation-actions"><button className="primary-button" type="submit" disabled={busy || !confirmed}>{busy ? 'Convirtiendo…' : 'Confirmar cliente'}</button></div></form></section>
}

function OwnerDirectRecord({ opportunity, onSaved }: { opportunity: Opportunity; onSaved: (data: Dashboard, message?: string) => void }) {
  const [ownerDirectStatus, setOwnerDirectStatus] = useState<OwnerDirectStatus>(opportunity.ownerDirectStatus ?? 'a_verificar')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await api<Dashboard>(`/api/opportunities/${opportunity.id}/owner-direct-status`, { method: 'PUT', body: JSON.stringify({ ownerDirectStatus }) })
      onSaved(data, 'Señal de dueño directo actualizada. No modifica permisos ni habilita contacto.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo actualizar la señal.') } finally { setBusy(false) }
  }
  return <section className="detail-section owner-direct-box"><div className="preparation-heading"><div><h3>Señal de dueño directo</h3><p>Es una clasificación manual para ordenar el CRM; no infiere identidad ni autorización de contacto.</p></div></div><form onSubmit={save}><label>Estado<select value={ownerDirectStatus} onChange={(event) => setOwnerDirectStatus(event.target.value as OwnerDirectStatus)}>{Object.entries(ownerDirectLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{ownerDirectStatus === 'declarado_en_aviso' && <p className="contact-warning">“Declarado en aviso” sólo describe el aviso. Antes de cualquier contacto, verificá sus restricciones y el canal.</p>}{error && <p className="form-error">{error}</p>}<div className="preparation-actions"><button className="secondary-button" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar señal'}</button></div></form></section>
}

function ContactRecord({ opportunity, onSaved }: { opportunity: Opportunity; onSaved: (data: Dashboard, message?: string) => void }) {
  const [contactPhone, setContactPhone] = useState(opportunity.contactPhone)
  const [contactEmail, setContactEmail] = useState(opportunity.contactEmail)
  const [legacyContactDetail] = useState(opportunity.contactDetail)
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
      const data = await api<Dashboard>(`/api/opportunities/${opportunity.id}/contact-record`, { method: 'PUT', body: JSON.stringify({ contactPhone, contactEmail, contactDetail: legacyContactDetail, contactOrigin, contactPreference, contactFollowUpAt, contactPreferenceNote }) })
      onSaved(data, contactPreference === 'do_not_contact' ? 'La oportunidad quedó bloqueada para nuevos contactos.' : contactPreference === 'follow_up_agreed' ? 'Seguimiento agendado según lo acordado.' : contactPreference === 'latent' ? 'Oportunidad marcada como latente para revisión manual.' : 'Datos de contacto y preferencia actualizados.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el contacto.') } finally { setBusy(false) }
  }

  return <section className="detail-section contact-record-box"><div className="preparation-heading"><div><h3>Contacto y preferencia</h3><p>Cargá sólo datos obtenidos manualmente. La app no extrae datos ni envía mensajes.</p></div><span className={`preparation-status ${contactPreference}`}>{contactPreferenceLabels[contactPreference]}</span></div>
    {immutableNoContact ? <p className="contact-warning">La persona pidió no recibir más contacto. Esta marca se conserva y bloquea acciones comerciales.</p> : <form onSubmit={save}>
      <div className="form-row"><label>WhatsApp o teléfono <span className="optional">opcional</span><input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} type="tel" maxLength={100} placeholder="Ej. +54 11 1234 5678" /></label><label>Email <span className="optional">opcional</span><input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} type="email" maxLength={254} placeholder="nombre@ejemplo.com" /></label></div><label>Origen del dato<select value={contactOrigin} onChange={(event) => setContactOrigin(event.target.value as Opportunity['contactOrigin'])}>{Object.entries(contactOriginLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
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
  const [formUrl, setFormUrl] = useState('')
  const needsNoLlame = channel === 'WhatsApp' || channel === 'Llamada'
  const storedReady = opportunity.contactPreparationStatus === 'ready'
  const statusLabels = { not_started: 'Pendiente', pending: 'Pendiente', ready: 'Lista para copiar', blocked: 'No contactar' }
  const status = opportunity.contactPreparationStatus
  const defaultDraft = `Hola [nombre], vi tu publicación de ${opportunity.propertyType.toLowerCase()} en ${opportunity.neighborhood}. Soy ${agentName}, agente inmobiliario. Si estás evaluando recibir asesoramiento o una tasación, puedo contarte cómo trabajo.${formUrl ? ` Si preferís, también podés solicitarla sin compromiso acá: ${formUrl}` : ''} Si preferís no recibir más mensajes, avisame y lo respeto. Gracias.`

  useEffect(() => {
    let current = true
    void api<{ url: string }>('/api/account/inbound-form').then((data) => { if (current) setFormUrl(data.url) }).catch(() => { if (current) setFormUrl('') })
    return () => { current = false }
  }, [])

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
  const copyFormLink = async () => {
    try { await navigator.clipboard.writeText(formUrl); setNotice('Enlace del formulario copiado. Compartilo sólo cuando corresponda.') } catch { setError('No se pudo copiar el enlace. Seleccionalo y copialo manualmente.') }
  }

  return <section className="detail-section preparation-box"><div className="preparation-heading"><div><h3>Verificación antes de contactar</h3><p>Este control no consulta registros ni envía mensajes por vos.</p></div><span className={`preparation-status ${status}`}>{statusLabels[status]}</span></div>
    <form onSubmit={save}>
      <label className="check-row"><input type="checkbox" checked={sourceReviewed} onChange={(event) => setSourceReviewed(event.target.checked)} />Revisé el aviso original y sus restricciones.</label>
      <label>Restricción del aviso<select value={listingPolicy} onChange={(event) => setListingPolicy(event.target.value as Opportunity['contactListingPolicy'])}><option value="not_started">No está confirmada</option><option value="allows_agents">Admite contacto de inmobiliarias</option><option value="no_agents">Inmobiliarias abstenerse / no contactar</option></select></label>
      <label>Canal previsto<select value={channel} onChange={(event) => setChannel(event.target.value)}><option>WhatsApp</option><option>Llamada</option><option>Instagram</option><option>Email</option></select></label>
      {needsNoLlame && <label>Registro No Llame verificado el<input type="date" value={noLlameCheckedAt} onChange={(event) => setNoLlameCheckedAt(event.target.value)} /><small>La app no realiza esta consulta: registrá sólo la fecha luego de verificarla.</small></label>}
      {listingPolicy === 'no_agents' && <p className="contact-warning">El aviso indica que no debe iniciarse contacto. Guardalo como referencia o descartalo, pero no prepares ni envíes un mensaje.</p>}
      <label>Nota de verificación <span className="optional">opcional</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Ej. el aviso aclara que acepta intermediación." /></label>
      {listingPolicy !== 'no_agents' && <>{formUrl && <div className="inbound-form-link"><div><strong>Formulario de asistencia</strong><small>La persona interesada puede iniciar el contacto por este enlace. No se envía automáticamente.</small></div><button type="button" className="text-button" onClick={() => void copyFormLink()}>Copiar enlace</button></div>}<div className="draft-heading"><strong>Borrador de primer mensaje</strong><button type="button" className="text-button" disabled={!storedReady} onClick={() => setDraft(defaultDraft)}>Generar borrador</button></div><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={5} placeholder="Guardá una verificación completa para generar un borrador editable." disabled={!storedReady} /><small className="draft-note">No se envía desde Agente+. La persona usuaria debe editarlo, copiarlo y decidir manualmente si corresponde enviarlo.</small></>}
      {error && <p className="form-error">{error}</p>}{notice && <p className="preparation-notice">{notice}</p>}
      <div className="preparation-actions"><button className="secondary-button" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar verificación'}</button><button className="primary-button" type="button" disabled={!storedReady || !draft.trim()} onClick={() => void copy()}>Copiar borrador</button></div>
    </form>
  </section>
}

function EventForm({ opportunity, onSaved }: { opportunity: Opportunity; onSaved: (data: Dashboard) => void }) {
  const restricted = opportunity.contactPreference === 'do_not_contact' || opportunity.contactPermission === 'do_not_contact'
  const [eventType, setEventType] = useState(restricted ? 'opportunity_lost' : 'contact_attempted')
  const [contactResult, setContactResult] = useState<ContactResult | ''>(restricted ? '' : 'sin_respuesta')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isClosing = eventType === 'property_captured' || eventType === 'opportunity_lost' || contactResult === 'no_continuar'
  const isNoContact = contactResult === 'no_contactar'
  const needsReviewDate = contactResult === 'seguimiento_acordado' || contactResult === 'latente'
  const changeEventType = (value: string) => {
    setEventType(value)
    if (value === 'property_captured' || value === 'opportunity_lost') setContactResult('')
    if (value === 'contact_attempted') setContactResult('sin_respuesta')
    if (value === 'conversation_started') setContactResult('interesado')
  }
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try { onSaved(await api<Dashboard>(`/api/opportunities/${opportunity.id}/events`, { method: 'POST', body: JSON.stringify(Object.fromEntries(data.entries())) })) } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo registrar el resultado.') } finally { setBusy(false) }
  }
  return <section className="detail-section event-box"><h3>Registrar resultado</h3><form onSubmit={save}>
    {restricted && <p className="contact-warning">La oportunidad está marcada como “No contactar”. No se pueden registrar acciones comerciales hasta que exista un mecanismo auditado para cambiar esa condición.</p>}
    <div className="form-row"><label>Evento<select name="eventType" value={eventType} onChange={(event) => changeEventType(event.target.value)}>{eventTypes.filter(([value]) => !restricted || value === 'opportunity_lost').map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Canal<select name="channel" defaultValue={restricted ? 'Sin canal' : 'WhatsApp'} disabled={restricted}>{channels.map((item) => <option key={item}>{item}</option>)}</select>{restricted && <input type="hidden" name="channel" value="Sin canal" />}</label></div>
    {!restricted && !['property_captured', 'opportunity_lost'].includes(eventType) && <label>Resultado estructurado<select name="contactResult" value={contactResult} onChange={(event) => setContactResult(event.target.value as ContactResult)}>{Object.entries(contactResultLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>}
    {(contactResult === 'latente' || contactResult === 'seguimiento_acordado') && <p className="contact-warning">Este resultado agenda una revisión manual. No programa ni habilita un nuevo contacto automático.</p>}
    {isNoContact && <p className="contact-warning">Al registrar este resultado, la oportunidad quedará bloqueada para todo contacto comercial posterior.</p>}
    <label>Nota del resultado <span className="optional">opcional</span><textarea name="notes" rows={2} placeholder="Qué ocurrió y qué información es relevante." /></label>
    {!isClosing && !isNoContact && <div className="form-row"><label>{needsReviewDate ? 'Próxima revisión' : 'Nuevo próximo paso'}<input name="nextStep" value={needsReviewDate ? (contactResult === 'latente' ? 'Revisar oportunidad latente' : 'Retomar conversación acordada') : undefined} placeholder="Ej. Confirmar tasación" minLength={2} required readOnly={needsReviewDate} /></label><label>Fecha<input name="nextStepDate" type="date" defaultValue={localDateValue()} required={needsReviewDate} /></label></div>}
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
