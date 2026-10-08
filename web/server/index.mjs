import { createServer } from 'node:http'
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { extname, isAbsolute, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { createDatabase } from './database.mjs'

const scrypt = promisify(scryptCallback)
const root = process.cwd()
const isProduction = process.env.NODE_ENV === 'production'
const configuredAppOrigin = process.env.APP_ORIGIN ?? (isProduction ? process.env.RENDER_EXTERNAL_URL ?? '' : '')
let appOrigin = ''
if (configuredAppOrigin) {
  try { appOrigin = new URL(configuredAppOrigin).origin } catch { throw new Error('APP_ORIGIN debe ser una URL absoluta válida.') }
}
if (isProduction && (!appOrigin || !appOrigin.startsWith('https://'))) throw new Error('En producción definí APP_ORIGIN HTTPS o ejecutá en Render con RENDER_EXTERNAL_URL disponible.')

const resendApiKey = String(process.env.RESEND_API_KEY ?? '').trim()
const emailFrom = String(process.env.EMAIL_FROM ?? '').trim()

const databaseUrl = process.env.DATABASE_URL ?? ''
const configuredDataDirectory = process.env.DATA_DIRECTORY ?? ''
if (isProduction && !databaseUrl && !configuredDataDirectory) throw new Error('En producción definí DATABASE_URL para PostgreSQL o DATA_DIRECTORY para un staging técnico.')
if (isProduction && !databaseUrl && !isAbsolute(configuredDataDirectory)) throw new Error('DATA_DIRECTORY debe ser una ruta absoluta en producción.')
if (isProduction && !databaseUrl && process.env.ALLOW_LOCAL_SQLITE_IN_PRODUCTION !== '1') throw new Error('SQLite local no está aprobado para datos personales. Para un staging sin datos reales, confirmá ALLOW_LOCAL_SQLITE_IN_PRODUCTION=1.')
const dataDirectory = configuredDataDirectory ? resolve(configuredDataDirectory) : join(root, 'data')
if (!databaseUrl) mkdirSync(dataDirectory, { recursive: true })

const db = createDatabase({ databaseUrl, sqliteFilename: join(dataDirectory, 'agente.sqlite') })
if (db.dialect === 'sqlite') await db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;')
await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, role TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, neighborhood TEXT NOT NULL, operation TEXT NOT NULL, status TEXT NOT NULL,
    reason TEXT NOT NULL, score INTEGER NOT NULL, next_step TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL, contact TEXT NOT NULL, due TEXT NOT NULL, channel TEXT NOT NULL,
    state TEXT NOT NULL, priority TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS radar_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    operation TEXT NOT NULL,
    property_type TEXT NOT NULL,
    source TEXT NOT NULL,
    source_url TEXT NOT NULL,
    price_amount INTEGER,
    currency TEXT NOT NULL,
    notes TEXT NOT NULL,
    state TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS opportunity_price_observations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    observed_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`)

async function ensureColumn(table, column, definition) {
  if (db.dialect === 'postgres') {
    await db.exec(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`)
    return
  }
  const exists = (await db.prepare(`PRAGMA table_info(${table})`).all()).some((item) => item.name === column)
  if (!exists) await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}

await ensureColumn('opportunities', 'property_type', "TEXT NOT NULL DEFAULT 'Departamento'")
await ensureColumn('opportunities', 'source', "TEXT NOT NULL DEFAULT 'Carga manual'")
await ensureColumn('opportunities', 'source_url', "TEXT NOT NULL DEFAULT ''")
await ensureColumn('opportunities', 'contact_detail', "TEXT NOT NULL DEFAULT ''")
await ensureColumn('opportunities', 'contact_permission', "TEXT NOT NULL DEFAULT 'unknown'")
await ensureColumn('opportunities', 'notes', "TEXT NOT NULL DEFAULT ''")
await ensureColumn('opportunities', 'next_step_date', "TEXT NOT NULL DEFAULT ''")
await ensureColumn('opportunities', 'updated_at', "TEXT NOT NULL DEFAULT ''")
await ensureColumn('opportunities', 'closed_at', 'TEXT')
await ensureColumn('opportunities', 'external_source', "TEXT NOT NULL DEFAULT ''")
await ensureColumn('opportunities', 'external_id', "TEXT NOT NULL DEFAULT ''")
await ensureColumn('opportunities', 'contact_source_reviewed', 'INTEGER NOT NULL DEFAULT 0')
await ensureColumn('opportunities', 'contact_listing_policy', "TEXT NOT NULL DEFAULT 'not_started'")
await ensureColumn('opportunities', 'no_llame_checked_at', "TEXT NOT NULL DEFAULT ''")
await ensureColumn('opportunities', 'planned_contact_channel', "TEXT NOT NULL DEFAULT 'Sin canal'")
await ensureColumn('opportunities', 'contact_draft', "TEXT NOT NULL DEFAULT ''")
await ensureColumn('opportunities', 'contact_preparation_notes', "TEXT NOT NULL DEFAULT ''")
await ensureColumn('opportunities', 'contact_preparation_status', "TEXT NOT NULL DEFAULT 'not_started'")
await ensureColumn('opportunities', 'contact_preparation_updated_at', "TEXT NOT NULL DEFAULT ''")
await ensureColumn('opportunities', 'contact_origin', "TEXT NOT NULL DEFAULT 'not_recorded'")
await ensureColumn('opportunities', 'contact_preference', "TEXT NOT NULL DEFAULT 'not_contacted'")
await ensureColumn('opportunities', 'contact_follow_up_at', "TEXT NOT NULL DEFAULT ''")
await ensureColumn('opportunities', 'contact_preference_note', "TEXT NOT NULL DEFAULT ''")
await ensureColumn('tasks', 'opportunity_id', 'TEXT')
await ensureColumn('tasks', 'due_at', "TEXT NOT NULL DEFAULT ''")
await db.prepare("UPDATE opportunities SET contact_preference = 'do_not_contact' WHERE contact_permission = 'do_not_contact' AND contact_preference = 'not_contacted'").run()

await db.exec(`
  CREATE TABLE IF NOT EXISTS opportunity_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    label TEXT NOT NULL,
    notes TEXT NOT NULL,
    channel TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS opportunities_user_index ON opportunities(user_id, created_at DESC);
  CREATE UNIQUE INDEX IF NOT EXISTS opportunities_external_unique ON opportunities(user_id, external_source, external_id) WHERE external_id <> '';
  CREATE INDEX IF NOT EXISTS tasks_user_index ON tasks(user_id, state, created_at DESC);
  CREATE INDEX IF NOT EXISTS events_opportunity_index ON opportunity_events(opportunity_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS radar_items_user_index ON radar_items(user_id, state, updated_at DESC);
  CREATE INDEX IF NOT EXISTS password_reset_tokens_user_index ON password_reset_tokens(user_id, expires_at DESC);
  CREATE INDEX IF NOT EXISTS price_observations_opportunity_index ON opportunity_price_observations(opportunity_id, observed_at DESC);
`)

const NEIGHBORHOODS = ['Núñez', 'Saavedra', 'Villa Urquiza', 'Coghlan', 'Belgrano']
const OPERATIONS = ['Venta', 'Alquiler']
const PROPERTY_TYPES = ['Departamento', 'Casa', 'PH', 'Terreno', 'Local', 'Otro']
const SOURCES = ['Carga manual', 'Referido', 'Recorrido de zona', 'Formulario entrante', 'Llamada entrante', 'Enlace compartido', 'Mercado Libre', 'Zonaprop', 'Argenprop', 'Otro']
const RADAR_SOURCES = ['Mercado Libre', 'Zonaprop', 'Argenprop', 'Otro']
const CONTACT_ORIGINS = ['not_recorded', 'directly_provided', 'inbound', 'prior_relationship', 'listing_to_verify', 'other']
const CONTACT_PREFERENCES = ['not_contacted', 'follow_up_agreed', 'latent', 'not_continue', 'do_not_contact']
const CHANNELS = ['WhatsApp', 'Llamada', 'Instagram', 'Email', 'Presencial', 'Sin canal']
const CONTACT_POLICIES = ['not_started', 'allows_agents', 'no_agents']
// "Otro" is deliberately included: a manually reviewed link from an
// unclassified portal should receive the same conservative contact controls.
const PORTAL_SOURCES = ['Mercado Libre', 'Zonaprop', 'Argenprop', 'Otro']
const EVENTS = {
  contact_attempted: { label: 'Contacto intentado', status: 'Contacto intentado', closed: false },
  conversation_started: { label: 'Conversación iniciada', status: 'En conversación', closed: false },
  valuation_scheduled: { label: 'Tasación agendada', status: 'Tasación agendada', closed: false },
  valuation_completed: { label: 'Tasación realizada', status: 'Tasación realizada', closed: false },
  proposal_sent: { label: 'Propuesta enviada', status: 'Propuesta enviada', closed: false },
  property_captured: { label: 'Propiedad captada', status: 'Captada', closed: true },
  opportunity_lost: { label: 'Oportunidad perdida', status: 'Perdida', closed: true },
}

const now = () => new Date().toISOString()
const hashToken = (token) => createHash('sha256').update(token).digest('hex')
const clean = (value, maximum = 500) => String(value ?? '').trim().slice(0, maximum)
const validUrl = (value) => {
  if (!value) return true
  try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
}
const validLocalDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime())
function contactPermissionFor(contactPreference, contactOrigin) {
  if (contactPreference === 'do_not_contact') return 'do_not_contact'
  if (contactOrigin === 'inbound') return 'inbound'
  return 'unknown'
}
function contactPreferenceSchedule(contactPreference) {
  if (contactPreference === 'follow_up_agreed') return { status: 'Seguimiento acordado', step: 'Retomar conversación acordada', task: 'Retomar conversación acordada', priority: 'Alta' }
  if (contactPreference === 'latent') return { status: 'Latente', step: 'Revisar oportunidad latente', task: 'Revisar oportunidad latente (sin contactar aún)', priority: 'Media' }
  return null
}
function preparationStatus({ sourceReviewed, listingPolicy, channel, noLlameCheckedAt }) {
  if (listingPolicy === 'no_agents') return 'blocked'
  if (!sourceReviewed || listingPolicy !== 'allows_agents' || !['WhatsApp', 'Llamada', 'Instagram', 'Email'].includes(channel)) return 'pending'
  if (['WhatsApp', 'Llamada'].includes(channel) && !validLocalDate(noLlameCheckedAt)) return 'pending'
  return 'ready'
}
const withTransaction = async (operation) => db.transaction(operation)

const getUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?')
const getUserById = db.prepare('SELECT id, email, display_name, role FROM users WHERE id = ?')
const insertUser = db.prepare('INSERT INTO users (id, email, display_name, password_hash, password_salt, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
const updateUserDisplayName = db.prepare('UPDATE users SET display_name = ? WHERE id = ?')
const updateUserPassword = db.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?')
const insertSession = db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
const deleteSession = db.prepare('DELETE FROM sessions WHERE token_hash = ?')
const deleteUserSessions = db.prepare('DELETE FROM sessions WHERE user_id = ?')
const getSessionUser = db.prepare('SELECT u.id, u.email, u.display_name, u.role, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?')
const deleteExpiredSessions = db.prepare('DELETE FROM sessions WHERE expires_at <= ?')
const getPasswordResetToken = db.prepare('SELECT token_hash, user_id AS "userId", expires_at AS "expiresAt" FROM password_reset_tokens WHERE token_hash = ?')
const insertPasswordResetToken = db.prepare('INSERT INTO password_reset_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
const deletePasswordResetToken = db.prepare('DELETE FROM password_reset_tokens WHERE token_hash = ?')
const deletePasswordResetTokensForUser = db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?')
const deleteExpiredPasswordResetTokens = db.prepare('DELETE FROM password_reset_tokens WHERE expires_at <= ?')
const opportunityFields = `
  id, name, neighborhood, operation, status, reason, score,
  next_step AS "nextStep", property_type AS "propertyType", source, source_url AS "sourceUrl",
  contact_detail AS "contactDetail", contact_permission AS "contactPermission", notes,
  next_step_date AS "nextStepDate", created_at AS "createdAt", updated_at AS "updatedAt",
  closed_at AS "closedAt", external_source AS "externalSource", external_id AS "externalId",
  contact_source_reviewed AS "contactSourceReviewed", contact_listing_policy AS "contactListingPolicy",
  no_llame_checked_at AS "noLlameCheckedAt", planned_contact_channel AS "plannedContactChannel",
  contact_draft AS "contactDraft", contact_preparation_notes AS "contactPreparationNotes",
  contact_preparation_status AS "contactPreparationStatus",
  contact_preparation_updated_at AS "contactPreparationUpdatedAt",
  contact_origin AS "contactOrigin", contact_preference AS "contactPreference",
  contact_follow_up_at AS "contactFollowUpAt", contact_preference_note AS "contactPreferenceNote"
`
const listOpportunities = db.prepare(`SELECT ${opportunityFields} FROM opportunities WHERE user_id = ? ORDER BY COALESCE(NULLIF(updated_at, ''), created_at) DESC`)
const getOpportunity = db.prepare(`SELECT ${opportunityFields} FROM opportunities WHERE id = ? AND user_id = ?`)
const listTasks = db.prepare('SELECT id, opportunity_id AS "opportunityId", title, contact, due, due_at AS "dueAt", channel, state, priority FROM tasks WHERE user_id = ? ORDER BY state ASC, COALESCE(NULLIF(due_at, \'\'), created_at) ASC')
const listEvents = db.prepare('SELECT id, opportunity_id AS "opportunityId", event_type AS "eventType", label, notes, channel, created_at AS "createdAt" FROM opportunity_events WHERE user_id = ? ORDER BY created_at DESC')
const listPriceObservations = db.prepare('SELECT id, opportunity_id AS "opportunityId", amount, currency, observed_at AS "observedAt", created_at AS "createdAt" FROM opportunity_price_observations WHERE user_id = ? ORDER BY observed_at DESC, created_at DESC')
const getOpportunityByExternal = db.prepare('SELECT id FROM opportunities WHERE user_id = ? AND external_source = ? AND external_id = ?')
const radarItemFields = `
  id, title, neighborhood, operation, property_type AS "propertyType", source,
  source_url AS "sourceUrl", price_amount AS "priceAmount", currency, notes, state,
  created_at AS "createdAt", updated_at AS "updatedAt"
`
const listRadarItems = db.prepare(`SELECT ${radarItemFields} FROM radar_items WHERE user_id = ? ORDER BY updated_at DESC`)
const getRadarItem = db.prepare(`SELECT ${radarItemFields} FROM radar_items WHERE id = ? AND user_id = ?`)
const insertRadarItem = db.prepare(`
  INSERT INTO radar_items (
    id, user_id, title, neighborhood, operation, property_type, source, source_url,
    price_amount, currency, notes, state, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const updateRadarItemState = db.prepare('UPDATE radar_items SET state = ?, updated_at = ? WHERE id = ? AND user_id = ?')
const insertOpportunity = db.prepare(`
  INSERT INTO opportunities (
    id, user_id, name, neighborhood, operation, status, reason, score, next_step, created_at,
    property_type, source, source_url, contact_detail, contact_permission, notes,
    next_step_date, updated_at, closed_at, external_source, external_id,
    contact_origin, contact_preference, contact_follow_up_at, contact_preference_note
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const insertTask = db.prepare('INSERT INTO tasks (id, user_id, title, contact, due, channel, state, priority, created_at, opportunity_id, due_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
const insertEvent = db.prepare('INSERT INTO opportunity_events (id, user_id, opportunity_id, event_type, label, notes, channel, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
const insertPriceObservation = db.prepare('INSERT INTO opportunity_price_observations (id, user_id, opportunity_id, amount, currency, observed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
const updateOpportunityProgress = db.prepare('UPDATE opportunities SET status = ?, reason = ?, next_step = ?, next_step_date = ?, updated_at = ?, closed_at = ? WHERE id = ? AND user_id = ?')
const updateContactRecord = db.prepare('UPDATE opportunities SET contact_detail = ?, contact_permission = ?, contact_origin = ?, contact_preference = ?, contact_follow_up_at = ?, contact_preference_note = ?, updated_at = ? WHERE id = ? AND user_id = ?')
const updateContactPreparation = db.prepare(`
  UPDATE opportunities SET
    contact_source_reviewed = ?, contact_listing_policy = ?, no_llame_checked_at = ?,
    planned_contact_channel = ?, contact_draft = ?, contact_preparation_notes = ?,
    contact_preparation_status = ?, contact_preparation_updated_at = ?, updated_at = ?
  WHERE id = ? AND user_id = ?
`)
const completeTask = db.prepare("UPDATE tasks SET state = 'done' WHERE id = ? AND user_id = ?")
const completeOpportunityTasks = db.prepare("UPDATE tasks SET state = 'done' WHERE opportunity_id = ? AND user_id = ? AND state = 'pending'")

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const derived = await scrypt(password, salt, 64)
  return { salt, hash: Buffer.from(derived).toString('hex') }
}

async function passwordMatches(password, user) {
  const { hash } = await hashPassword(password, user.password_salt)
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.password_hash, 'hex'))
}

async function createUser({ email, displayName, password, role = 'agent' }) {
  const { salt, hash } = await hashPassword(password)
  const id = randomUUID()
  await insertUser.run(id, email, displayName, hash, salt, role, now())
  return await getUserById.get(id)
}

async function addEvent(userId, opportunityId, eventType, label, notes = '', channel = 'Sin canal', createdAt = now()) {
  await insertEvent.run(randomUUID(), userId, opportunityId, eventType, label, notes, channel, createdAt)
}

async function addTask(userId, opportunityId, title, contact, dueAt, channel, priority = 'Media') {
  const due = dueAt || 'Sin fecha'
  await insertTask.run(randomUUID(), userId, title, contact, due, channel, 'pending', priority, now(), opportunityId, dueAt)
}

async function seedDemo() {
  let user = await getUserByEmail.get('demo@agente.local')
  if (!user) user = await createUser({ email: 'demo@agente.local', displayName: 'Florencia M.', password: randomBytes(32).toString('hex'), role: 'demo' })
  const existing = await listOpportunities.all(user.id)
  if (existing.length) return

  const examples = [
    { name: 'Valentina P.', neighborhood: 'Núñez', operation: 'Venta', status: 'Propuesta enviada', reason: 'Tiene una demanda compatible y seguimiento comprometido.', score: 94, nextStep: 'Retomar propuesta', propertyType: 'Departamento', source: 'Referido', permission: 'explicit', channel: 'WhatsApp' },
    { name: 'Jorge M.', neighborhood: 'Belgrano', operation: 'Venta', status: 'Tasación agendada', reason: 'Referido con reunión de tasación acordada.', score: 89, nextStep: 'Confirmar reunión', propertyType: 'PH', source: 'Referido', permission: 'explicit', channel: 'Llamada' },
    { name: 'Lucía R.', neighborhood: 'Villa Urquiza', operation: 'Alquiler', status: 'En conversación', reason: 'Consulta entrante que coincide con la campaña activa.', score: 78, nextStep: 'Enviar seguimiento', propertyType: 'Departamento', source: 'Formulario entrante', permission: 'inbound', channel: 'Instagram' },
  ]

  for (const example of examples) {
    const opportunityId = randomUUID()
    const createdAt = now()
    await insertOpportunity.run(opportunityId, user.id, example.name, example.neighborhood, example.operation, example.status, example.reason, example.score, example.nextStep, createdAt, example.propertyType, example.source, '', '', example.permission, 'Dato sintético para recorrer el flujo.', '', createdAt, null, '', '', 'prior_relationship', 'follow_up_agreed', '', 'Seguimiento sintético de demostración.')
    await addEvent(user.id, opportunityId, 'opportunity_detected', 'Oportunidad detectada', 'Registro sintético de demostración.', 'Sin canal', createdAt)
    await addTask(user.id, opportunityId, example.nextStep, example.name, '', example.channel, example.score > 85 ? 'Alta' : 'Media')
  }
}

async function backfillDetectedEvents() {
  const missing = await db.prepare(`
    SELECT o.id, o.user_id AS "userId", o.created_at AS "createdAt"
    FROM opportunities o
    WHERE NOT EXISTS (SELECT 1 FROM opportunity_events e WHERE e.opportunity_id = o.id)
  `).all()
  for (const item of missing) await addEvent(item.userId, item.id, 'opportunity_detected', 'Oportunidad detectada', 'Evento inicial incorporado al historial.', 'Sin canal', item.createdAt)
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => part.trim().split(/=(.*)/s)).filter(([key]) => key))
}

function securityHeaders() {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  }
  if (isProduction) headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
  return headers
}

function sendJson(response, status, body, extraHeaders = {}) {
  response.writeHead(status, { ...securityHeaders(), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders })
  response.end(JSON.stringify(body))
}

function sessionCookie(token, maxAge = 60 * 60 * 24 * 7) {
  const secure = isProduction ? '; Secure' : ''
  const sameSite = isProduction ? 'Strict' : 'Lax'
  return `session=${token}; HttpOnly; SameSite=${sameSite}; Path=/; Max-Age=${maxAge}; Priority=High${secure}`
}

const rateWindows = new Map()
function requesterAddress(request) {
  const forwarded = process.env.TRUST_PROXY === '1' ? String(request.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : ''
  return forwarded || request.socket.remoteAddress || 'unknown'
}

function allowRateKey(response, bucket, subject, maximum, windowMs) {
  const key = `${bucket}:${subject}`
  const currentTime = Date.now()
  const current = rateWindows.get(key)
  const record = !current || current.resetAt <= currentTime ? { count: 0, resetAt: currentTime + windowMs } : current
  record.count += 1
  rateWindows.set(key, record)
  if (rateWindows.size > 2_000) {
    for (const [entryKey, entry] of rateWindows) if (entry.resetAt <= currentTime) rateWindows.delete(entryKey)
  }
  if (record.count <= maximum) return true
  const retryAfter = Math.max(1, Math.ceil((record.resetAt - currentTime) / 1_000))
  sendJson(response, 429, { error: 'Demasiados intentos. Esperá unos minutos antes de volver a probar.' }, { 'Retry-After': String(retryAfter) })
  return false
}

function allowRate(request, response, bucket, maximum, windowMs) {
  return allowRateKey(response, bucket, requesterAddress(request), maximum, windowMs)
}

function allowMutationFromOrigin(request, response) {
  if (!isProduction || ['GET', 'HEAD', 'OPTIONS'].includes(request.method ?? 'GET')) return true
  if (request.headers.origin === appOrigin) return true
  sendJson(response, 403, { error: 'La solicitud no proviene del origen autorizado.' })
  return false
}

class ClientError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function readBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > 100_000) throw new Error('Payload demasiado grande')
    chunks.push(chunk)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') } catch { throw new Error('JSON inválido') }
}

function publicUser(user) {
  return { id: user.id, name: user.display_name, email: user.email, isDemo: user.role === 'demo' }
}

async function userFor(request) {
  const token = parseCookies(request.headers.cookie).session
  if (!token) return null
  const user = await getSessionUser.get(hashToken(token))
  if (!user || new Date(user.expires_at) <= new Date()) return null
  return user
}

async function requireUser(request, response) {
  const user = await userFor(request)
  if (!user) { sendJson(response, 401, { error: 'Sesión requerida.' }); return null }
  return user
}

async function dashboard(user) {
  const events = await listEvents.all(user.id)
  const prices = await listPriceObservations.all(user.id)
  const byOpportunity = new Map()
  for (const event of events) {
    const current = byOpportunity.get(event.opportunityId) ?? []
    current.push(event)
    byOpportunity.set(event.opportunityId, current)
  }
  const pricesByOpportunity = new Map()
  for (const price of prices) {
    const current = pricesByOpportunity.get(price.opportunityId) ?? []
    current.push(price)
    pricesByOpportunity.set(price.opportunityId, current)
  }
  const opportunities = (await listOpportunities.all(user.id)).map((opportunity) => ({
    ...opportunity,
    events: byOpportunity.get(opportunity.id) ?? [],
    priceObservations: pricesByOpportunity.get(opportunity.id) ?? [],
  }))
  return { user: publicUser(user), opportunities, tasks: await listTasks.all(user.id) }
}

async function createSession(response, user) {
  const token = randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  await deleteExpiredSessions.run(now())
  await insertSession.run(hashToken(token), user.id, expires, now())
  return { 'Set-Cookie': sessionCookie(token) }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
}

function passwordResetUrl(token) {
  if (!appOrigin) return ''
  const url = new URL(appOrigin)
  url.searchParams.set('reset', token)
  return url.toString()
}

function canSendPasswordResetEmail() {
  return Boolean(resendApiKey && emailFrom && !/[\r\n]/.test(emailFrom) && passwordResetUrl('test'))
}

async function sendPasswordResetEmail({ email, displayName, token }) {
  if (!canSendPasswordResetEmail()) return false
  const resetUrl = passwordResetUrl(token)
  const safeName = escapeHtml(displayName)
  const safeUrl = escapeHtml(resetUrl)
  try {
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: emailFrom,
        to: [email],
        subject: 'Restablecé tu contraseña de Agente+',
        text: `Hola ${displayName},\n\nPara crear una nueva contraseña, abrí este enlace dentro de los próximos 30 minutos:\n${resetUrl}\n\nSi no solicitaste este cambio, podés ignorar este correo.`,
        html: `<p>Hola ${safeName},</p><p>Para crear una nueva contraseña, abrí este enlace dentro de los próximos 30 minutos:</p><p><a href="${safeUrl}">Restablecer contraseña</a></p><p>Si no solicitaste este cambio, podés ignorar este correo.</p>`,
        tags: [{ name: 'category', value: 'password_reset' }],
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (result.ok) return true
    console.error(`No se pudo entregar el correo de recuperación (estado ${result.status}).`)
  } catch {
    console.error('No se pudo conectar al proveedor de correo para recuperación de contraseña.')
  }
  return false
}

async function serveStatic(request, response, pathname) {
  if (process.env.NODE_ENV !== 'production') return sendJson(response, 404, { error: 'Ruta no encontrada.' })
  const cleanPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const candidate = join(root, 'dist', cleanPath)
  const file = existsSync(candidate) ? candidate : join(root, 'dist', 'index.html')
  try {
    const content = await readFile(file)
    const contentType = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' }[extname(file)] ?? 'application/octet-stream'
    response.writeHead(200, { ...securityHeaders(), 'Content-Type': contentType, 'Content-Security-Policy': "default-src 'self'; base-uri 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; style-src 'self' 'unsafe-inline'" })
    response.end(content)
  } catch { sendJson(response, 404, { error: 'Aplicación no construida.' }) }
}

await seedDemo()
await backfillDetectedEvents()

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`)
  try {
    if (!allowMutationFromOrigin(request, response)) return
    if (request.method === 'GET' && url.pathname === '/api/health') return sendJson(response, 200, { status: 'ok' })
    if (request.method === 'GET' && url.pathname === '/api/auth/me') {
      const user = await userFor(request)
      return sendJson(response, 200, { user: user ? publicUser(user) : null })
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/demo') {
      if (!allowRate(request, response, 'demo', 20, 15 * 60 * 1_000)) return
      const user = await getUserByEmail.get('demo@agente.local')
      return sendJson(response, 200, { user: publicUser(user) }, await createSession(response, user))
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/register') {
      if (!allowRate(request, response, 'credentials', 8, 15 * 60 * 1_000)) return
      const body = await readBody(request)
      const email = clean(body.email, 254).toLowerCase()
      const displayName = clean(body.name, 80)
      const password = String(body.password ?? '')
      if (!/^\S+@\S+\.\S+$/.test(email) || displayName.length < 2 || password.length < 12 || password.length > 256) return sendJson(response, 400, { error: 'Ingresá nombre, email válido y una contraseña de entre 12 y 256 caracteres.' })
      if (await getUserByEmail.get(email)) return sendJson(response, 409, { error: 'Ya existe una cuenta con ese email.' })
      const user = await createUser({ email, displayName, password })
      return sendJson(response, 201, { user: publicUser(user) }, await createSession(response, user))
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      if (!allowRate(request, response, 'credentials', 8, 15 * 60 * 1_000)) return
      const body = await readBody(request)
      const user = await getUserByEmail.get(clean(body.email, 254).toLowerCase())
      if (!user || !(await passwordMatches(String(body.password ?? ''), user))) return sendJson(response, 401, { error: 'Email o contraseña incorrectos.' })
      return sendJson(response, 200, { user: publicUser(user) }, await createSession(response, user))
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/password-reset/request') {
      if (!allowRate(request, response, 'password-reset', 5, 15 * 60 * 1_000)) return
      const body = await readBody(request)
      const email = clean(body.email, 254).toLowerCase()
      const genericResponse = { message: 'Si existe una cuenta asociada a ese email, recibirás instrucciones para restablecer la contraseña.' }
      if (!/^\S+@\S+\.\S+$/.test(email)) return sendJson(response, 202, genericResponse)
      if (!allowRateKey(response, 'password-reset-email', hashToken(email), 3, 60 * 60 * 1_000)) return
      const user = await getUserByEmail.get(email)
      if (!user || user.role === 'demo' || !canSendPasswordResetEmail()) return sendJson(response, 202, genericResponse)
      const token = randomBytes(32).toString('base64url')
      const tokenHash = hashToken(token)
      const createdAt = now()
      const expiresAt = new Date(Date.now() + 30 * 60 * 1_000).toISOString()
      await withTransaction(async () => {
        await deleteExpiredPasswordResetTokens.run(createdAt)
        await deletePasswordResetTokensForUser.run(user.id)
        await insertPasswordResetToken.run(tokenHash, user.id, expiresAt, createdAt)
      })
      if (!(await sendPasswordResetEmail({ email: user.email, displayName: user.display_name, token }))) await deletePasswordResetToken.run(tokenHash)
      return sendJson(response, 202, genericResponse)
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/password-reset/confirm') {
      if (!allowRate(request, response, 'password-reset-confirm', 8, 15 * 60 * 1_000)) return
      const body = await readBody(request)
      const token = String(body.token ?? '')
      const password = String(body.password ?? '')
      if (password.length < 12 || password.length > 256) return sendJson(response, 400, { error: 'La nueva contraseña debe tener entre 12 y 256 caracteres.' })
      if (token.length < 40 || token.length > 200) return sendJson(response, 400, { error: 'El enlace de recuperación no es válido o venció.' })
      const tokenHash = hashToken(token)
      const reset = await getPasswordResetToken.get(tokenHash)
      if (!reset || new Date(reset.expiresAt) <= new Date()) {
        if (reset) await deletePasswordResetToken.run(tokenHash)
        return sendJson(response, 400, { error: 'El enlace de recuperación no es válido o venció.' })
      }
      const user = await getUserById.get(reset.userId)
      if (!user || user.role === 'demo') return sendJson(response, 400, { error: 'El enlace de recuperación no es válido o venció.' })
      const { salt, hash } = await hashPassword(password)
      await withTransaction(async () => {
        const activeReset = await getPasswordResetToken.get(tokenHash)
        if (!activeReset || new Date(activeReset.expiresAt) <= new Date()) throw new ClientError(400, 'El enlace de recuperación no es válido o venció.')
        await updateUserPassword.run(hash, salt, user.id)
        await deleteUserSessions.run(user.id)
        await deletePasswordResetTokensForUser.run(user.id)
      })
      return sendJson(response, 200, { user: publicUser(user) }, await createSession(response, user))
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      const token = parseCookies(request.headers.cookie).session
      if (token) await deleteSession.run(hashToken(token))
      return sendJson(response, 204, {}, { 'Set-Cookie': sessionCookie('', 0) })
    }
    if (request.method === 'PUT' && url.pathname === '/api/account/profile') {
      const user = await requireUser(request, response); if (!user) return
      if (user.role === 'demo') return sendJson(response, 403, { error: 'El perfil de la cuenta Demo no se puede modificar.' })
      const displayName = clean((await readBody(request)).name, 80)
      if (displayName.length < 2) return sendJson(response, 400, { error: 'Ingresá un nombre de al menos 2 caracteres.' })
      await updateUserDisplayName.run(displayName, user.id)
      return sendJson(response, 200, { user: publicUser(await getUserById.get(user.id)) })
    }
    if (request.method === 'PUT' && url.pathname === '/api/account/password') {
      const user = await requireUser(request, response); if (!user) return
      if (user.role === 'demo') return sendJson(response, 403, { error: 'La contraseña de la cuenta Demo no se puede modificar.' })
      const body = await readBody(request)
      const currentPassword = String(body.currentPassword ?? '')
      const newPassword = String(body.newPassword ?? '')
      if (newPassword.length < 12 || newPassword.length > 256) return sendJson(response, 400, { error: 'La nueva contraseña debe tener entre 12 y 256 caracteres.' })
      const credential = await getUserByEmail.get(user.email)
      if (!credential || !(await passwordMatches(currentPassword, credential))) return sendJson(response, 401, { error: 'La contraseña actual no es correcta.' })
      const { salt, hash } = await hashPassword(newPassword)
      await withTransaction(async () => {
        await updateUserPassword.run(hash, salt, user.id)
        await deleteUserSessions.run(user.id)
      })
      return sendJson(response, 200, { user: publicUser(await getUserById.get(user.id)) }, await createSession(response, user))
    }
    if (request.method === 'GET' && url.pathname === '/api/dashboard') {
      const user = await requireUser(request, response); if (!user) return
      return sendJson(response, 200, await dashboard(user))
    }
    if (request.method === 'GET' && url.pathname === '/api/radar-items') {
      const user = await requireUser(request, response); if (!user) return
      return sendJson(response, 200, { items: await listRadarItems.all(user.id) })
    }
    if (request.method === 'POST' && url.pathname === '/api/radar-items') {
      const user = await requireUser(request, response); if (!user) return
      const body = await readBody(request)
      const title = clean(body.title, 160)
      const neighborhood = clean(body.neighborhood, 40)
      const operation = clean(body.operation, 20)
      const propertyType = clean(body.propertyType, 30)
      const source = clean(body.source, 40)
      const sourceUrl = clean(body.sourceUrl, 1000)
      const priceRaw = clean(body.priceAmount, 12)
      const priceAmount = priceRaw ? Number(priceRaw) : null
      const currency = clean(body.currency || 'USD', 10)
      const notes = clean(body.notes, 1200)
      if (title.length < 2 || !NEIGHBORHOODS.includes(neighborhood) || !OPERATIONS.includes(operation) || !PROPERTY_TYPES.includes(propertyType) || !RADAR_SOURCES.includes(source) || !validUrl(sourceUrl) || !sourceUrl) return sendJson(response, 400, { error: 'Completá referencia, zona, operación, tipo, portal y enlace válido.' })
      if (priceAmount !== null && (!Number.isInteger(priceAmount) || priceAmount <= 0)) return sendJson(response, 400, { error: 'El precio debe ser un número entero positivo.' })
      if (!['USD', 'ARS'].includes(currency)) return sendJson(response, 400, { error: 'Elegí una moneda válida.' })
      const id = randomUUID()
      const createdAt = now()
      await insertRadarItem.run(id, user.id, title, neighborhood, operation, propertyType, source, sourceUrl, priceAmount, currency, notes, 'detected', createdAt, createdAt)
      return sendJson(response, 201, { items: await listRadarItems.all(user.id) })
    }

    const radarStateMatch = url.pathname.match(/^\/api\/radar-items\/([\w-]+)\/state$/)
    if (request.method === 'POST' && radarStateMatch) {
      const user = await requireUser(request, response); if (!user) return
      const item = await getRadarItem.get(radarStateMatch[1], user.id)
      if (!item) return sendJson(response, 404, { error: 'Hallazgo no encontrado.' })
      const action = clean((await readBody(request)).action, 20)
      const nextState = { review: 'reviewing', discard: 'discarded', restore: 'detected' }[action]
      if (!nextState) return sendJson(response, 400, { error: 'Acción de Radar inválida.' })
      if (item.state === 'converted') return sendJson(response, 409, { error: 'Este hallazgo ya fue convertido en oportunidad.' })
      if ((action === 'review' && item.state !== 'detected') || (action === 'discard' && !['detected', 'reviewing'].includes(item.state)) || (action === 'restore' && item.state !== 'discarded')) return sendJson(response, 409, { error: 'Esta transición no corresponde al estado actual del hallazgo.' })
      await updateRadarItemState.run(nextState, now(), item.id, user.id)
      return sendJson(response, 200, { items: await listRadarItems.all(user.id) })
    }

    const radarConvertMatch = url.pathname.match(/^\/api\/radar-items\/([\w-]+)\/convert$/)
    if (request.method === 'POST' && radarConvertMatch) {
      const user = await requireUser(request, response); if (!user) return
      const item = await getRadarItem.get(radarConvertMatch[1], user.id)
      if (!item) return sendJson(response, 404, { error: 'Hallazgo no encontrado.' })
      if (item.state === 'converted') return sendJson(response, 409, { error: 'Este hallazgo ya fue convertido en oportunidad.' })
      if (item.state !== 'reviewing') return sendJson(response, 409, { error: 'Marcá el hallazgo como “En revisión” antes de convertirlo en oportunidad.' })

      const opportunityId = randomUUID()
      const createdAt = now()
      const nextStep = 'Completar verificación de contacto'
      const nextStepDate = createdAt.slice(0, 10)
      const notes = `Creada desde Radar. ${item.notes}`.trim()
      await withTransaction(async () => {
        await insertOpportunity.run(opportunityId, user.id, item.title, item.neighborhood, item.operation, 'Detectada', 'Hallazgo manual revisado; pendiente de verificación antes de cualquier contacto.', 58, nextStep, createdAt, item.propertyType, item.source, item.sourceUrl, '', 'unknown', notes, nextStepDate, createdAt, null, '', '', 'not_recorded', 'not_contacted', '', '')
        if (item.priceAmount !== null) await insertPriceObservation.run(randomUUID(), user.id, opportunityId, item.priceAmount, item.currency, createdAt.slice(0, 10), createdAt)
        await addEvent(user.id, opportunityId, 'opportunity_detected', 'Oportunidad convertida desde Radar', `Fuente: ${item.source}. Sin datos de contacto.`, 'Sin canal', createdAt)
        await addTask(user.id, opportunityId, nextStep, item.title, nextStepDate, 'Sin canal')
        await updateRadarItemState.run('converted', createdAt, item.id, user.id)
      })
      return sendJson(response, 201, await dashboard(user))
    }

    if (request.method === 'POST' && url.pathname === '/api/opportunities') {
      const user = await requireUser(request, response); if (!user) return
      const body = await readBody(request)
      const name = clean(body.name, 120)
      const neighborhood = clean(body.neighborhood, 40)
      const operation = clean(body.operation, 20)
      const propertyType = clean(body.propertyType, 30)
      const source = clean(body.source, 40)
      const sourceUrl = clean(body.sourceUrl, 1000)
      const contactDetail = clean(body.contactDetail, 250)
      const contactOrigin = clean(body.contactOrigin || 'not_recorded', 30)
      const contactPreference = clean(body.contactPreference || 'not_contacted', 30)
      const contactFollowUpAt = clean(body.contactFollowUpAt, 30)
      const contactPreferenceNote = clean(body.contactPreferenceNote, 1000)
      const notes = clean(body.notes, 3000)
      const externalId = clean(body.externalId, 80)
      const radarItemId = clean(body.radarItemId, 80)
      const externalSource = source === 'Mercado Libre' && externalId ? 'mercadolibre' : ''
      const requestedNextStep = clean(body.nextStep, 160)
      const nextStepDate = clean(body.nextStepDate, 30)
      const requestedChannel = clean(body.channel, 30)
      if (name.length < 2 || !NEIGHBORHOODS.includes(neighborhood) || !OPERATIONS.includes(operation) || !PROPERTY_TYPES.includes(propertyType) || !SOURCES.includes(source) || !CONTACT_ORIGINS.includes(contactOrigin) || !CONTACT_PREFERENCES.includes(contactPreference) || !CHANNELS.includes(requestedChannel) || requestedNextStep.length < 2) return sendJson(response, 400, { error: 'Revisá los datos obligatorios de la oportunidad y su próximo paso.' })
      if (!validUrl(sourceUrl)) return sendJson(response, 400, { error: 'El enlace de origen debe comenzar con http:// o https://.' })
      const preferenceSchedule = contactPreferenceSchedule(contactPreference)
      if (preferenceSchedule && (contactDetail.length < 2 || !validLocalDate(contactFollowUpAt))) return sendJson(response, 400, { error: 'Para agendar seguimiento o dejar una oportunidad latente, cargá un dato de contacto y una fecha de revisión.' })
      if (!preferenceSchedule && contactFollowUpAt && !validLocalDate(contactFollowUpAt)) return sendJson(response, 400, { error: 'La fecha de seguimiento debe ser válida.' })
      if (externalSource && await getOpportunityByExternal.get(user.id, externalSource, externalId)) return sendJson(response, 409, { error: 'Esta publicación ya fue guardada como oportunidad.' })
      const radarItem = radarItemId ? await getRadarItem.get(radarItemId, user.id) : null
      if (radarItemId && !radarItem) return sendJson(response, 404, { error: 'El hallazgo de Radar ya no existe o no pertenece a esta cuenta.' })
      if (radarItem?.state === 'converted') return sendJson(response, 409, { error: 'Este hallazgo ya fue convertido en oportunidad.' })
      if (radarItem && radarItem.state !== 'reviewing') return sendJson(response, 409, { error: 'Marcá el hallazgo como “En revisión” antes de convertirlo en oportunidad.' })
      const opportunityId = randomUUID()
      const createdAt = now()
      const contactPermission = contactPermissionFor(contactPreference, contactOrigin)
      const nextStep = contactPreference === 'do_not_contact' ? 'No contactar' : preferenceSchedule?.step ?? requestedNextStep
      const effectiveNextStepDate = preferenceSchedule ? contactFollowUpAt : nextStepDate
      const channel = contactPreference === 'do_not_contact' ? 'Sin canal' : requestedChannel
      const score = contactPreference === 'do_not_contact' ? 25 : contactOrigin === 'inbound' ? 78 : 58
      const initialStatus = contactPreference === 'do_not_contact' ? 'No contactar' : contactPreference === 'not_continue' ? 'Sin seguimiento' : 'Detectada'
      const reason = contactPreference === 'do_not_contact'
        ? 'La fuente indica que no debe iniciarse contacto. Conservar solo para revisión.'
        : contactPreference === 'not_continue'
          ? contactPreferenceNote || 'No continuará el seguimiento por ahora.'
        : contactOrigin === 'inbound' || source === 'Formulario entrante' || source === 'Llamada entrante'
          ? 'Consulta entrante con contexto de origen registrado.'
          : 'Oportunidad cargada manualmente con fuente y próximo paso registrados.'

      await withTransaction(async () => {
        await insertOpportunity.run(opportunityId, user.id, name, neighborhood, operation, initialStatus, reason, score, nextStep, createdAt, propertyType, source, sourceUrl, contactDetail, contactPermission, notes, effectiveNextStepDate, createdAt, contactPreference === 'not_continue' ? createdAt : null, externalSource, externalId, contactOrigin, contactPreference, contactFollowUpAt, contactPreferenceNote)
        await addEvent(user.id, opportunityId, 'opportunity_detected', 'Oportunidad detectada', `Fuente: ${source}.`, 'Sin canal', createdAt)
        if (contactPreference !== 'do_not_contact' && contactPreference !== 'not_continue') await addTask(user.id, opportunityId, nextStep, name, effectiveNextStepDate, channel, preferenceSchedule?.priority ?? (contactOrigin === 'inbound' ? 'Alta' : 'Media'))
        if (radarItem) await updateRadarItemState.run('converted', createdAt, radarItem.id, user.id)
      })
      return sendJson(response, 201, await dashboard(user))
    }

    const contactRecordMatch = url.pathname.match(/^\/api\/opportunities\/([\w-]+)\/contact-record$/)
    if (request.method === 'PUT' && contactRecordMatch) {
      const user = await requireUser(request, response); if (!user) return
      const opportunity = await getOpportunity.get(contactRecordMatch[1], user.id)
      if (!opportunity) return sendJson(response, 404, { error: 'Oportunidad no encontrada.' })
      if (opportunity.closedAt) return sendJson(response, 409, { error: 'La oportunidad ya está cerrada.' })
      const body = await readBody(request)
      const contactDetail = clean(body.contactDetail, 250)
      const contactOrigin = clean(body.contactOrigin || 'not_recorded', 30)
      const contactPreference = clean(body.contactPreference || 'not_contacted', 30)
      const contactFollowUpAt = clean(body.contactFollowUpAt, 30)
      const contactPreferenceNote = clean(body.contactPreferenceNote, 1000)
      if (!CONTACT_ORIGINS.includes(contactOrigin) || !CONTACT_PREFERENCES.includes(contactPreference)) return sendJson(response, 400, { error: 'Elegí un origen y una preferencia de contacto válidos.' })
      if (opportunity.contactPreference === 'do_not_contact' && contactPreference !== 'do_not_contact') return sendJson(response, 409, { error: 'Una marca “No contactar” no puede revertirse desde esta pantalla.' })
      const preferenceSchedule = contactPreferenceSchedule(contactPreference)
      if (preferenceSchedule && (contactDetail.length < 2 || !validLocalDate(contactFollowUpAt))) return sendJson(response, 400, { error: 'Para agendar seguimiento o dejar una oportunidad latente, cargá un dato de contacto y una fecha de revisión.' })
      if (!preferenceSchedule && contactFollowUpAt && !validLocalDate(contactFollowUpAt)) return sendJson(response, 400, { error: 'La fecha de seguimiento debe ser válida.' })
      const contactPermission = contactPermissionFor(contactPreference, contactOrigin)
      const updatedAt = now()
      const preferenceLabel = {
        not_contacted: 'Sin contacto aún', follow_up_agreed: 'Seguimiento acordado', latent: 'Latente', not_continue: 'No continuar', do_not_contact: 'No contactar',
      }[contactPreference]
      await withTransaction(async () => {
        await updateContactRecord.run(contactDetail, contactPermission, contactOrigin, contactPreference, contactFollowUpAt, contactPreferenceNote, updatedAt, opportunity.id, user.id)
        await addEvent(user.id, opportunity.id, 'contact_preference_updated', 'Preferencia de seguimiento actualizada', `${preferenceLabel}${contactPreferenceNote ? `: ${contactPreferenceNote}` : ''}`, 'Sin canal', updatedAt)
        if (preferenceSchedule) {
          await completeOpportunityTasks.run(opportunity.id, user.id)
          await updateOpportunityProgress.run(preferenceSchedule.status, contactPreferenceNote || preferenceSchedule.step, preferenceSchedule.step, contactFollowUpAt, updatedAt, null, opportunity.id, user.id)
          await addTask(user.id, opportunity.id, preferenceSchedule.task, opportunity.name, contactFollowUpAt, 'Sin canal', preferenceSchedule.priority)
        }
        if (contactPreference === 'do_not_contact') {
          await completeOpportunityTasks.run(opportunity.id, user.id)
          await updateOpportunityProgress.run('No contactar', contactPreferenceNote || 'La persona pidió no recibir más contacto.', 'No contactar', '', updatedAt, null, opportunity.id, user.id)
        }
        if (contactPreference === 'not_continue') {
          await completeOpportunityTasks.run(opportunity.id, user.id)
          await updateOpportunityProgress.run('Sin seguimiento', contactPreferenceNote || 'No continuará el seguimiento por ahora.', '', '', updatedAt, updatedAt, opportunity.id, user.id)
        }
        if (contactPreference === 'not_contacted' && ['follow_up_agreed', 'latent'].includes(opportunity.contactPreference)) {
          await completeOpportunityTasks.run(opportunity.id, user.id)
          await updateOpportunityProgress.run('Detectada', contactPreferenceNote || 'Seguimiento pendiente de nueva verificación.', 'Completar verificación de contacto', '', updatedAt, null, opportunity.id, user.id)
          await addTask(user.id, opportunity.id, 'Completar verificación de contacto', opportunity.name, '', 'Sin canal')
        }
      })
      return sendJson(response, 200, await dashboard(user))
    }

    const priceObservationMatch = url.pathname.match(/^\/api\/opportunities\/([\w-]+)\/price-observations$/)
    if (request.method === 'POST' && priceObservationMatch) {
      const user = await requireUser(request, response); if (!user) return
      const opportunity = await getOpportunity.get(priceObservationMatch[1], user.id)
      if (!opportunity) return sendJson(response, 404, { error: 'Oportunidad no encontrada.' })
      if (opportunity.closedAt) return sendJson(response, 409, { error: 'La oportunidad ya está cerrada.' })
      const body = await readBody(request)
      const amountRaw = clean(body.amount, 12)
      const amount = Number(amountRaw)
      const currency = clean(body.currency, 10)
      const observedAt = clean(body.observedAt, 30)
      if (!amountRaw || !Number.isInteger(amount) || amount <= 0 || !['USD', 'ARS'].includes(currency) || !validLocalDate(observedAt)) return sendJson(response, 400, { error: 'Cargá un precio entero positivo, moneda y fecha de observación válidos.' })
      const createdAt = now()
      await withTransaction(async () => {
        await insertPriceObservation.run(randomUUID(), user.id, opportunity.id, amount, currency, observedAt, createdAt)
        await addEvent(user.id, opportunity.id, 'price_observed', 'Precio observado manualmente', `${currency} ${amount.toLocaleString('es-AR')}. Revisar la fuente original antes de interpretar una variación.`, 'Sin canal', createdAt)
      })
      return sendJson(response, 201, await dashboard(user))
    }

    const preparationMatch = url.pathname.match(/^\/api\/opportunities\/([\w-]+)\/contact-preparation$/)
    if (request.method === 'PUT' && preparationMatch) {
      const user = await requireUser(request, response); if (!user) return
      const opportunity = await getOpportunity.get(preparationMatch[1], user.id)
      if (!opportunity) return sendJson(response, 404, { error: 'Oportunidad no encontrada.' })
      if (opportunity.closedAt) return sendJson(response, 409, { error: 'La oportunidad ya está cerrada.' })
      if (opportunity.contactPreference === 'do_not_contact' || opportunity.contactPermission === 'do_not_contact') return sendJson(response, 409, { error: 'Esta oportunidad está marcada como “No contactar”.' })
      const body = await readBody(request)
      const sourceReviewed = body.sourceReviewed === true
      const listingPolicy = clean(body.listingPolicy, 30)
      const channel = clean(body.channel, 30)
      const noLlameCheckedAt = clean(body.noLlameCheckedAt, 30)
      const draft = clean(body.draft, 2000)
      const notes = clean(body.notes, 1000)
      if (!CONTACT_POLICIES.includes(listingPolicy) || !CHANNELS.includes(channel)) return sendJson(response, 400, { error: 'Revisá la restricción del aviso y el canal elegido.' })
      if (noLlameCheckedAt && !validLocalDate(noLlameCheckedAt)) return sendJson(response, 400, { error: 'La fecha de verificación debe ser válida.' })
      const status = preparationStatus({ sourceReviewed, listingPolicy, channel, noLlameCheckedAt })
      if (listingPolicy === 'no_agents' && draft) return sendJson(response, 400, { error: 'No guardes un borrador cuando el aviso restringe el contacto de inmobiliarias.' })
      const updatedAt = now()
      await updateContactPreparation.run(sourceReviewed ? 1 : 0, listingPolicy, noLlameCheckedAt, channel, draft, notes, status, updatedAt, updatedAt, opportunity.id, user.id)
      return sendJson(response, 200, await dashboard(user))
    }

    const eventMatch = url.pathname.match(/^\/api\/opportunities\/([\w-]+)\/events$/)
    if (request.method === 'POST' && eventMatch) {
      const user = await requireUser(request, response); if (!user) return
      const opportunity = await getOpportunity.get(eventMatch[1], user.id)
      if (!opportunity) return sendJson(response, 404, { error: 'Oportunidad no encontrada.' })
      if (opportunity.closedAt) return sendJson(response, 409, { error: 'La oportunidad ya está cerrada.' })
      const body = await readBody(request)
      const eventType = clean(body.eventType, 40)
      const event = EVENTS[eventType]
      const notes = clean(body.notes, 3000)
      const channel = clean(body.channel, 30)
      const nextStep = clean(body.nextStep, 160)
      const nextStepDate = clean(body.nextStepDate, 30)
      if (!event || !CHANNELS.includes(channel)) return sendJson(response, 400, { error: 'Elegí un resultado y un canal válidos.' })
      if ((opportunity.contactPreference === 'do_not_contact' || opportunity.contactPermission === 'do_not_contact') && eventType !== 'opportunity_lost') return sendJson(response, 409, { error: 'Esta oportunidad está marcada como “No contactar”. Solo puede cerrarse o revisarse internamente.' })
      if (eventType === 'contact_attempted' && PORTAL_SOURCES.includes(opportunity.source) && opportunity.contactPreparationStatus !== 'ready') return sendJson(response, 409, { error: 'Completá la verificación de contacto antes de registrar un contacto desde un portal.' })
      if (!event.closed && nextStep.length < 2) return sendJson(response, 400, { error: 'Las oportunidades abiertas deben conservar un próximo paso.' })
      const updatedAt = now()
      const reason = notes || event.label
      await withTransaction(async () => {
        await addEvent(user.id, opportunity.id, eventType, event.label, notes, channel, updatedAt)
        await completeOpportunityTasks.run(opportunity.id, user.id)
        await updateOpportunityProgress.run(event.status, reason, event.closed ? '' : nextStep, event.closed ? '' : nextStepDate, updatedAt, event.closed ? updatedAt : null, opportunity.id, user.id)
        if (!event.closed) await addTask(user.id, opportunity.id, nextStep, opportunity.name, nextStepDate, channel, ['valuation_scheduled', 'valuation_completed', 'proposal_sent'].includes(eventType) ? 'Alta' : 'Media')
      })
      return sendJson(response, 201, await dashboard(user))
    }

    const taskMatch = url.pathname.match(/^\/api\/tasks\/([\w-]+)\/complete$/)
    if (request.method === 'POST' && taskMatch) {
      const user = await requireUser(request, response); if (!user) return
      await completeTask.run(taskMatch[1], user.id)
      return sendJson(response, 200, await dashboard(user))
    }
    return serveStatic(request, response, url.pathname)
  } catch (error) {
    if (error instanceof ClientError) return sendJson(response, error.status, { error: error.message })
    console.error(error)
    return sendJson(response, 500, { error: 'No se pudo completar la operación.' })
  }
})

const port = Number(process.env.PORT ?? 8787)
if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error('PORT debe ser un puerto válido.')
const host = process.env.HOST ?? (isProduction ? '0.0.0.0' : '127.0.0.1')
server.requestTimeout = 15_000
server.headersTimeout = 20_000
server.keepAliveTimeout = 5_000
server.listen(port, host, () => console.log(`API iniciada en http://${host}:${port}`))
