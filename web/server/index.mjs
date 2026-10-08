import { createServer } from 'node:http'
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { promisify } from 'node:util'
import { DatabaseSync } from 'node:sqlite'

const scrypt = promisify(scryptCallback)
const root = process.cwd()
const dataDirectory = join(root, 'data')
mkdirSync(dataDirectory, { recursive: true })

const db = new DatabaseSync(join(dataDirectory, 'agente.sqlite'))
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
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
`)

function ensureColumn(table, column, definition) {
  const exists = db.prepare(`PRAGMA table_info(${table})`).all().some((item) => item.name === column)
  if (!exists) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}

ensureColumn('opportunities', 'property_type', "TEXT NOT NULL DEFAULT 'Departamento'")
ensureColumn('opportunities', 'source', "TEXT NOT NULL DEFAULT 'Carga manual'")
ensureColumn('opportunities', 'source_url', "TEXT NOT NULL DEFAULT ''")
ensureColumn('opportunities', 'contact_detail', "TEXT NOT NULL DEFAULT ''")
ensureColumn('opportunities', 'contact_permission', "TEXT NOT NULL DEFAULT 'unknown'")
ensureColumn('opportunities', 'notes', "TEXT NOT NULL DEFAULT ''")
ensureColumn('opportunities', 'next_step_date', "TEXT NOT NULL DEFAULT ''")
ensureColumn('opportunities', 'updated_at', "TEXT NOT NULL DEFAULT ''")
ensureColumn('opportunities', 'closed_at', 'TEXT')
ensureColumn('opportunities', 'external_source', "TEXT NOT NULL DEFAULT ''")
ensureColumn('opportunities', 'external_id', "TEXT NOT NULL DEFAULT ''")
ensureColumn('tasks', 'opportunity_id', 'TEXT')
ensureColumn('tasks', 'due_at', "TEXT NOT NULL DEFAULT ''")

db.exec(`
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
`)

const NEIGHBORHOODS = ['Núñez', 'Saavedra', 'Villa Urquiza', 'Coghlan', 'Belgrano']
const OPERATIONS = ['Venta', 'Alquiler']
const PROPERTY_TYPES = ['Departamento', 'Casa', 'PH', 'Terreno', 'Local', 'Otro']
const SOURCES = ['Referido', 'Recorrido de zona', 'Formulario entrante', 'Llamada entrante', 'Enlace compartido', 'Mercado Libre', 'Otro']
const PERMISSIONS = ['unknown', 'inbound', 'explicit', 'do_not_contact']
const CHANNELS = ['WhatsApp', 'Llamada', 'Instagram', 'Email', 'Presencial', 'Sin canal']
const RADAR_BOUNDS = {
  'Núñez': { lat: '-34.558_-34.529', lon: '-58.491_-58.445' },
  'Saavedra': { lat: '-34.570_-34.536', lon: '-58.519_-58.469' },
  'Villa Urquiza': { lat: '-34.594_-34.555', lon: '-58.513_-58.471' },
  'Coghlan': { lat: '-34.577_-34.550', lon: '-58.486_-58.459' },
  'Belgrano': { lat: '-34.580_-34.540', lon: '-58.473_-58.421' },
}
const RADAR_DEMO = [
  { externalId: 'DEMO-NU-001', title: 'Departamento 3 ambientes con balcón', neighborhood: 'Núñez', operation: 'Venta', propertyType: 'Departamento', price: 168000, currency: 'USD', rooms: 3, area: 72, publishedAt: '2026-10-07T13:30:00.000Z' },
  { externalId: 'DEMO-NU-002', title: 'PH con patio y entrada independiente', neighborhood: 'Núñez', operation: 'Venta', propertyType: 'PH', price: 219000, currency: 'USD', rooms: 4, area: 108, publishedAt: '2026-10-06T18:15:00.000Z' },
  { externalId: 'DEMO-SA-001', title: 'Casa de cuatro ambientes en zona residencial', neighborhood: 'Saavedra', operation: 'Venta', propertyType: 'Casa', price: 295000, currency: 'USD', rooms: 4, area: 165, publishedAt: '2026-10-07T10:05:00.000Z' },
  { externalId: 'DEMO-SA-002', title: 'Departamento 2 ambientes luminoso', neighborhood: 'Saavedra', operation: 'Alquiler', propertyType: 'Departamento', price: 780000, currency: 'ARS', rooms: 2, area: 48, publishedAt: '2026-10-05T16:45:00.000Z' },
  { externalId: 'DEMO-VU-001', title: 'Departamento 3 ambientes cerca del subte', neighborhood: 'Villa Urquiza', operation: 'Venta', propertyType: 'Departamento', price: 142000, currency: 'USD', rooms: 3, area: 66, publishedAt: '2026-10-08T09:20:00.000Z' },
  { externalId: 'DEMO-CO-001', title: 'PH 3 ambientes con terraza', neighborhood: 'Coghlan', operation: 'Venta', propertyType: 'PH', price: 185000, currency: 'USD', rooms: 3, area: 91, publishedAt: '2026-10-04T12:00:00.000Z' },
  { externalId: 'DEMO-BE-001', title: 'Departamento 4 ambientes con cochera', neighborhood: 'Belgrano', operation: 'Venta', propertyType: 'Departamento', price: 310000, currency: 'USD', rooms: 4, area: 118, publishedAt: '2026-10-08T08:10:00.000Z' },
  { externalId: 'DEMO-BE-002', title: 'Departamento 2 ambientes amoblado', neighborhood: 'Belgrano', operation: 'Alquiler', propertyType: 'Departamento', price: 950000, currency: 'ARS', rooms: 2, area: 51, publishedAt: '2026-10-06T14:30:00.000Z' },
]
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
const withTransaction = (operation) => {
  db.exec('BEGIN')
  try { const result = operation(); db.exec('COMMIT'); return result } catch (error) { db.exec('ROLLBACK'); throw error }
}

const getUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?')
const getUserById = db.prepare('SELECT id, email, display_name, role FROM users WHERE id = ?')
const insertUser = db.prepare('INSERT INTO users (id, email, display_name, password_hash, password_salt, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
const insertSession = db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
const deleteSession = db.prepare('DELETE FROM sessions WHERE token_hash = ?')
const getSessionUser = db.prepare('SELECT u.id, u.email, u.display_name, u.role, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?')
const opportunityFields = `
  id, name, neighborhood, operation, status, reason, score,
  next_step AS nextStep, property_type AS propertyType, source, source_url AS sourceUrl,
  contact_detail AS contactDetail, contact_permission AS contactPermission, notes,
  next_step_date AS nextStepDate, created_at AS createdAt, updated_at AS updatedAt,
  closed_at AS closedAt, external_source AS externalSource, external_id AS externalId
`
const listOpportunities = db.prepare(`SELECT ${opportunityFields} FROM opportunities WHERE user_id = ? ORDER BY COALESCE(NULLIF(updated_at, ''), created_at) DESC`)
const getOpportunity = db.prepare(`SELECT ${opportunityFields} FROM opportunities WHERE id = ? AND user_id = ?`)
const listTasks = db.prepare("SELECT id, opportunity_id AS opportunityId, title, contact, due, due_at AS dueAt, channel, state, priority FROM tasks WHERE user_id = ? ORDER BY state ASC, COALESCE(NULLIF(due_at, ''), created_at) ASC")
const listEvents = db.prepare('SELECT id, opportunity_id AS opportunityId, event_type AS eventType, label, notes, channel, created_at AS createdAt FROM opportunity_events WHERE user_id = ? ORDER BY created_at DESC')
const listSavedExternalIds = db.prepare("SELECT external_id AS externalId FROM opportunities WHERE user_id = ? AND external_source = 'mercadolibre' AND external_id <> ''")
const getOpportunityByExternal = db.prepare('SELECT id FROM opportunities WHERE user_id = ? AND external_source = ? AND external_id = ?')
const insertOpportunity = db.prepare(`
  INSERT INTO opportunities (
    id, user_id, name, neighborhood, operation, status, reason, score, next_step, created_at,
    property_type, source, source_url, contact_detail, contact_permission, notes,
    next_step_date, updated_at, closed_at, external_source, external_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const insertTask = db.prepare('INSERT INTO tasks (id, user_id, title, contact, due, channel, state, priority, created_at, opportunity_id, due_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
const insertEvent = db.prepare('INSERT INTO opportunity_events (id, user_id, opportunity_id, event_type, label, notes, channel, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
const updateOpportunityProgress = db.prepare('UPDATE opportunities SET status = ?, reason = ?, next_step = ?, next_step_date = ?, updated_at = ?, closed_at = ? WHERE id = ? AND user_id = ?')
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
  insertUser.run(id, email, displayName, hash, salt, role, now())
  return getUserById.get(id)
}

function addEvent(userId, opportunityId, eventType, label, notes = '', channel = 'Sin canal', createdAt = now()) {
  insertEvent.run(randomUUID(), userId, opportunityId, eventType, label, notes, channel, createdAt)
}

function addTask(userId, opportunityId, title, contact, dueAt, channel, priority = 'Media') {
  const due = dueAt || 'Sin fecha'
  insertTask.run(randomUUID(), userId, title, contact, due, channel, 'pending', priority, now(), opportunityId, dueAt)
}

async function seedDemo() {
  let user = getUserByEmail.get('demo@agente.local')
  if (!user) user = await createUser({ email: 'demo@agente.local', displayName: 'Florencia M.', password: randomBytes(32).toString('hex'), role: 'demo' })
  const existing = listOpportunities.all(user.id)
  if (existing.length) return

  const examples = [
    { name: 'Valentina P.', neighborhood: 'Núñez', operation: 'Venta', status: 'Propuesta enviada', reason: 'Tiene una demanda compatible y seguimiento comprometido.', score: 94, nextStep: 'Retomar propuesta', propertyType: 'Departamento', source: 'Referido', permission: 'explicit', channel: 'WhatsApp' },
    { name: 'Jorge M.', neighborhood: 'Belgrano', operation: 'Venta', status: 'Tasación agendada', reason: 'Referido con reunión de tasación acordada.', score: 89, nextStep: 'Confirmar reunión', propertyType: 'PH', source: 'Referido', permission: 'explicit', channel: 'Llamada' },
    { name: 'Lucía R.', neighborhood: 'Villa Urquiza', operation: 'Alquiler', status: 'En conversación', reason: 'Consulta entrante que coincide con la campaña activa.', score: 78, nextStep: 'Enviar seguimiento', propertyType: 'Departamento', source: 'Formulario entrante', permission: 'inbound', channel: 'Instagram' },
  ]

  for (const example of examples) {
    const opportunityId = randomUUID()
    const createdAt = now()
    insertOpportunity.run(opportunityId, user.id, example.name, example.neighborhood, example.operation, example.status, example.reason, example.score, example.nextStep, createdAt, example.propertyType, example.source, '', '', example.permission, 'Dato sintético para recorrer el flujo.', '', createdAt, null, '', '')
    addEvent(user.id, opportunityId, 'opportunity_detected', 'Oportunidad detectada', 'Registro sintético de demostración.', 'Sin canal', createdAt)
    addTask(user.id, opportunityId, example.nextStep, example.name, '', example.channel, example.score > 85 ? 'Alta' : 'Media')
  }
}

function backfillDetectedEvents() {
  const missing = db.prepare(`
    SELECT o.id, o.user_id AS userId, o.created_at AS createdAt
    FROM opportunities o
    WHERE NOT EXISTS (SELECT 1 FROM opportunity_events e WHERE e.opportunity_id = o.id)
  `).all()
  for (const item of missing) addEvent(item.userId, item.id, 'opportunity_detected', 'Oportunidad detectada', 'Evento inicial incorporado al historial.', 'Sin canal', item.createdAt)
}

const categoryCache = new Map()
const normalizeLabel = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const attributeValue = (item, ids) => {
  const attribute = (item.attributes ?? []).find((candidate) => ids.includes(candidate.id))
  return attribute?.value_name ?? attribute?.value_struct?.number ?? null
}

async function mercadoLibreJson(pathname, token) {
  const response = await fetch(`https://api.mercadolibre.com${pathname}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, signal: AbortSignal.timeout(10_000) })
  if (!response.ok) throw new Error(`Mercado Libre respondió ${response.status}`)
  return response.json()
}

async function resolveMercadoLibreCategory(propertyType, operation, token) {
  const key = `${propertyType}:${operation}`
  const cached = categoryCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.id

  const rootCategory = await mercadoLibreJson('/categories/MLA1459', token)
  const aliases = {
    Departamento: ['departamento'], Casa: ['casa'], PH: ['ph'], Terreno: ['terreno', 'lote'], Local: ['local'], Otro: [],
  }[propertyType] ?? []
  const propertyCategory = aliases.length
    ? (rootCategory.children_categories ?? []).find((category) => aliases.some((alias) => normalizeLabel(category.name).includes(alias)))
    : null
  if (!propertyCategory) return 'MLA1459'

  const propertyTree = await mercadoLibreJson(`/categories/${encodeURIComponent(propertyCategory.id)}`, token)
  const operationCategory = (propertyTree.children_categories ?? []).find((category) => normalizeLabel(category.name).includes(normalizeLabel(operation)))
  const id = operationCategory?.id ?? propertyCategory.id
  categoryCache.set(key, { id, expiresAt: Date.now() + 30 * 60 * 1000 })
  return id
}

function radarResultFromMercadoLibre(item, filters) {
  const roomsValue = Number(attributeValue(item, ['ROOMS', 'BEDROOMS']))
  const areaValue = Number(attributeValue(item, ['TOTAL_AREA', 'COVERED_AREA']))
  return {
    externalId: clean(item.id, 80),
    title: clean(item.title, 160),
    neighborhood: clean(item.location?.neighborhood?.name || filters.neighborhood, 60),
    operation: filters.operation,
    propertyType: filters.propertyType,
    price: Number(item.price ?? 0),
    currency: clean(item.currency_id || 'USD', 10),
    rooms: Number.isFinite(roomsValue) && roomsValue > 0 ? roomsValue : null,
    area: Number.isFinite(areaValue) && areaValue > 0 ? areaValue : null,
    publishedAt: clean(item.start_time || '', 40),
    url: clean(item.permalink, 1000),
    synthetic: false,
  }
}

async function liveRadarSearch(filters) {
  const token = process.env.MERCADOLIBRE_ACCESS_TOKEN
  if (!token || process.env.MERCADOLIBRE_RADAR_ENABLED !== 'true') throw new Error('Conector oficial no habilitado')
  const category = await resolveMercadoLibreCategory(filters.propertyType, filters.operation, token)
  const bounds = RADAR_BOUNDS[filters.neighborhood]
  const params = new URLSearchParams({ category, item_location: `lat:${bounds.lat},lon:${bounds.lon}`, limit: '30' })
  const data = await mercadoLibreJson(`/sites/MLA/search?${params}`, token)
  return (data.results ?? []).map((item) => radarResultFromMercadoLibre(item, filters))
}

function demoRadarSearch(filters) {
  return RADAR_DEMO
    .filter((item) => item.neighborhood === filters.neighborhood && item.operation === filters.operation && (filters.propertyType === 'Otro' || item.propertyType === filters.propertyType))
    .filter((item) => item.currency === filters.currency)
    .filter((item) => !filters.minPrice || item.price >= filters.minPrice)
    .filter((item) => !filters.maxPrice || item.price <= filters.maxPrice)
    .map((item) => ({ ...item, url: 'https://www.mercadolibre.com.ar/inmuebles', synthetic: true }))
}

async function radarSearch(user, url) {
  const filters = {
    neighborhood: clean(url.searchParams.get('neighborhood'), 40),
    operation: clean(url.searchParams.get('operation'), 20),
    propertyType: clean(url.searchParams.get('propertyType'), 30),
    currency: clean(url.searchParams.get('currency') || 'USD', 10),
    minPrice: Math.max(0, Number(url.searchParams.get('minPrice') || 0)),
    maxPrice: Math.max(0, Number(url.searchParams.get('maxPrice') || 0)),
  }
  if (!NEIGHBORHOODS.includes(filters.neighborhood) || !OPERATIONS.includes(filters.operation) || !PROPERTY_TYPES.includes(filters.propertyType) || !['USD', 'ARS'].includes(filters.currency)) throw new Error('Filtros de radar inválidos')
  if (!Number.isFinite(filters.minPrice) || !Number.isFinite(filters.maxPrice) || (filters.maxPrice && filters.minPrice > filters.maxPrice)) throw new Error('Rango de precio inválido')

  const live = Boolean(process.env.MERCADOLIBRE_ACCESS_TOKEN) && process.env.MERCADOLIBRE_RADAR_ENABLED === 'true'
  const rawResults = live ? await liveRadarSearch(filters) : demoRadarSearch(filters)
  const results = rawResults
    .filter((item) => item.currency === filters.currency)
    .filter((item) => !filters.minPrice || item.price >= filters.minPrice)
    .filter((item) => !filters.maxPrice || item.price <= filters.maxPrice)
  const saved = new Set(listSavedExternalIds.all(user.id).map((item) => item.externalId))
  return {
    mode: live ? 'live' : 'demo',
    provider: 'Mercado Libre',
    results: results.map((item) => ({ ...item, saved: saved.has(item.externalId) })),
    notice: live
      ? 'Resultados obtenidos mediante la API oficial. Verificá siempre la publicación original.'
      : 'Modo Demo: resultados totalmente sintéticos. Para activar datos reales se requiere una aplicación oficial, OAuth y habilitación expresa del conector.',
  }
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => part.trim().split(/=(.*)/s)).filter(([key]) => key))
}

function sendJson(response, status, body, extraHeaders = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extraHeaders })
  response.end(JSON.stringify(body))
}

function sessionCookie(token, maxAge = 60 * 60 * 24 * 7) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`
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

function userFor(request) {
  const token = parseCookies(request.headers.cookie).session
  if (!token) return null
  const user = getSessionUser.get(hashToken(token))
  if (!user || new Date(user.expires_at) <= new Date()) return null
  return user
}

function requireUser(request, response) {
  const user = userFor(request)
  if (!user) { sendJson(response, 401, { error: 'Sesión requerida.' }); return null }
  return user
}

function dashboard(user) {
  const events = listEvents.all(user.id)
  const byOpportunity = new Map()
  for (const event of events) {
    const current = byOpportunity.get(event.opportunityId) ?? []
    current.push(event)
    byOpportunity.set(event.opportunityId, current)
  }
  const opportunities = listOpportunities.all(user.id).map((opportunity) => ({ ...opportunity, events: byOpportunity.get(opportunity.id) ?? [] }))
  return { user: publicUser(user), opportunities, tasks: listTasks.all(user.id) }
}

async function createSession(response, user) {
  const token = randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  insertSession.run(hashToken(token), user.id, expires, now())
  return { 'Set-Cookie': sessionCookie(token) }
}

async function serveStatic(request, response, pathname) {
  if (process.env.NODE_ENV !== 'production') return sendJson(response, 404, { error: 'Ruta no encontrada.' })
  const cleanPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const candidate = join(root, 'dist', cleanPath)
  const file = existsSync(candidate) ? candidate : join(root, 'dist', 'index.html')
  try {
    const content = await readFile(file)
    const contentType = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' }[extname(file)] ?? 'application/octet-stream'
    response.writeHead(200, { 'Content-Type': contentType, 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:" })
    response.end(content)
  } catch { sendJson(response, 404, { error: 'Aplicación no construida.' }) }
}

await seedDemo()
backfillDetectedEvents()

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`)
  try {
    if (request.method === 'GET' && url.pathname === '/api/auth/me') {
      const user = userFor(request)
      return sendJson(response, 200, { user: user ? publicUser(user) : null })
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/demo') {
      const user = getUserByEmail.get('demo@agente.local')
      return sendJson(response, 200, { user: publicUser(user) }, await createSession(response, user))
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/register') {
      const body = await readBody(request)
      const email = clean(body.email, 254).toLowerCase()
      const displayName = clean(body.name, 80)
      const password = String(body.password ?? '')
      if (!/^\S+@\S+\.\S+$/.test(email) || displayName.length < 2 || password.length < 12) return sendJson(response, 400, { error: 'Ingresá nombre, email válido y una contraseña de al menos 12 caracteres.' })
      if (getUserByEmail.get(email)) return sendJson(response, 409, { error: 'Ya existe una cuenta con ese email.' })
      const user = await createUser({ email, displayName, password })
      return sendJson(response, 201, { user: publicUser(user) }, await createSession(response, user))
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      const body = await readBody(request)
      const user = getUserByEmail.get(clean(body.email, 254).toLowerCase())
      if (!user || !(await passwordMatches(String(body.password ?? ''), user))) return sendJson(response, 401, { error: 'Email o contraseña incorrectos.' })
      return sendJson(response, 200, { user: publicUser(user) }, await createSession(response, user))
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      const token = parseCookies(request.headers.cookie).session
      if (token) deleteSession.run(hashToken(token))
      return sendJson(response, 204, {}, { 'Set-Cookie': sessionCookie('', 0) })
    }
    if (request.method === 'GET' && url.pathname === '/api/dashboard') {
      const user = requireUser(request, response); if (!user) return
      return sendJson(response, 200, dashboard(user))
    }
    if (request.method === 'GET' && url.pathname === '/api/radar') {
      const user = requireUser(request, response); if (!user) return
      try { return sendJson(response, 200, await radarSearch(user, url)) } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (message.includes('inválid')) return sendJson(response, 400, { error: message })
        console.error('Radar:', error)
        return sendJson(response, 502, { error: 'No se pudo consultar el proveedor oficial. El modo Demo continúa disponible si se deshabilita el conector.' })
      }
    }
    if (request.method === 'POST' && url.pathname === '/api/opportunities') {
      const user = requireUser(request, response); if (!user) return
      const body = await readBody(request)
      const name = clean(body.name, 120)
      const neighborhood = clean(body.neighborhood, 40)
      const operation = clean(body.operation, 20)
      const propertyType = clean(body.propertyType, 30)
      const source = clean(body.source, 40)
      const sourceUrl = clean(body.sourceUrl, 1000)
      const contactDetail = clean(body.contactDetail, 250)
      const contactPermission = clean(body.contactPermission, 30)
      const notes = clean(body.notes, 3000)
      const externalId = clean(body.externalId, 80)
      const externalSource = source === 'Mercado Libre' && externalId ? 'mercadolibre' : ''
      const requestedNextStep = clean(body.nextStep, 160)
      const nextStepDate = clean(body.nextStepDate, 30)
      const requestedChannel = clean(body.channel, 30)
      if (name.length < 2 || !NEIGHBORHOODS.includes(neighborhood) || !OPERATIONS.includes(operation) || !PROPERTY_TYPES.includes(propertyType) || !SOURCES.includes(source) || !PERMISSIONS.includes(contactPermission) || !CHANNELS.includes(requestedChannel) || requestedNextStep.length < 2) return sendJson(response, 400, { error: 'Revisá los datos obligatorios de la oportunidad y su próximo paso.' })
      if (!validUrl(sourceUrl)) return sendJson(response, 400, { error: 'El enlace de origen debe comenzar con http:// o https://.' })
      if (externalSource && getOpportunityByExternal.get(user.id, externalSource, externalId)) return sendJson(response, 409, { error: 'Esta publicación ya fue guardada como oportunidad.' })
      const opportunityId = randomUUID()
      const createdAt = now()
      const nextStep = contactPermission === 'do_not_contact' ? 'Revisar sin contactar' : requestedNextStep
      const channel = contactPermission === 'do_not_contact' ? 'Sin canal' : requestedChannel
      const score = contactPermission === 'do_not_contact' ? 25 : contactPermission === 'inbound' ? 78 : contactPermission === 'explicit' ? 72 : 58
      const reason = contactPermission === 'do_not_contact'
        ? 'La fuente indica que no debe iniciarse contacto. Conservar solo para revisión.'
        : source === 'Formulario entrante' || source === 'Llamada entrante'
          ? 'Consulta entrante con contexto de origen registrado.'
          : 'Oportunidad cargada manualmente con fuente y próximo paso registrados.'

      withTransaction(() => {
        insertOpportunity.run(opportunityId, user.id, name, neighborhood, operation, 'Detectada', reason, score, nextStep, createdAt, propertyType, source, sourceUrl, contactDetail, contactPermission, notes, nextStepDate, createdAt, null, externalSource, externalId)
        addEvent(user.id, opportunityId, 'opportunity_detected', 'Oportunidad detectada', `Fuente: ${source}.`, 'Sin canal', createdAt)
        addTask(user.id, opportunityId, nextStep, name, nextStepDate, channel, contactPermission === 'inbound' ? 'Alta' : 'Media')
      })
      return sendJson(response, 201, dashboard(user))
    }

    const eventMatch = url.pathname.match(/^\/api\/opportunities\/([\w-]+)\/events$/)
    if (request.method === 'POST' && eventMatch) {
      const user = requireUser(request, response); if (!user) return
      const opportunity = getOpportunity.get(eventMatch[1], user.id)
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
      if (opportunity.contactPermission === 'do_not_contact' && eventType !== 'opportunity_lost') return sendJson(response, 409, { error: 'Esta oportunidad está marcada como “No contactar”. Solo puede cerrarse o revisarse internamente.' })
      if (!event.closed && nextStep.length < 2) return sendJson(response, 400, { error: 'Las oportunidades abiertas deben conservar un próximo paso.' })
      const updatedAt = now()
      const reason = notes || event.label
      withTransaction(() => {
        addEvent(user.id, opportunity.id, eventType, event.label, notes, channel, updatedAt)
        completeOpportunityTasks.run(opportunity.id, user.id)
        updateOpportunityProgress.run(event.status, reason, event.closed ? '' : nextStep, event.closed ? '' : nextStepDate, updatedAt, event.closed ? updatedAt : null, opportunity.id, user.id)
        if (!event.closed) addTask(user.id, opportunity.id, nextStep, opportunity.name, nextStepDate, channel, ['valuation_scheduled', 'valuation_completed', 'proposal_sent'].includes(eventType) ? 'Alta' : 'Media')
      })
      return sendJson(response, 201, dashboard(user))
    }

    const taskMatch = url.pathname.match(/^\/api\/tasks\/([\w-]+)\/complete$/)
    if (request.method === 'POST' && taskMatch) {
      const user = requireUser(request, response); if (!user) return
      completeTask.run(taskMatch[1], user.id)
      return sendJson(response, 200, dashboard(user))
    }
    return serveStatic(request, response, url.pathname)
  } catch (error) {
    console.error(error)
    return sendJson(response, 500, { error: 'No se pudo completar la operación.' })
  }
})

const port = Number(process.env.PORT ?? 8787)
server.listen(port, '127.0.0.1', () => console.log(`API protegida local: http://127.0.0.1:${port}`))
