import { AsyncLocalStorage } from 'node:async_hooks'
import { DatabaseSync } from 'node:sqlite'
import pg from 'pg'

const { Pool } = pg

const replacePlaceholders = (sql) => {
  let index = 0
  return sql.replace(/\?/g, () => `$${++index}`)
}

class SqliteStatement {
  constructor(statement) { this.statement = statement }
  async get(...params) { return this.statement.get(...params) }
  async all(...params) { return this.statement.all(...params) }
  async run(...params) { return this.statement.run(...params) }
}

class SqliteDatabase {
  constructor(filename) {
    this.dialect = 'sqlite'
    this.raw = new DatabaseSync(filename)
  }

  prepare(sql) { return new SqliteStatement(this.raw.prepare(sql)) }
  async exec(sql) { this.raw.exec(sql) }
  async transaction(operation) {
    this.raw.exec('BEGIN')
    try {
      const result = await operation()
      this.raw.exec('COMMIT')
      return result
    } catch (error) {
      this.raw.exec('ROLLBACK')
      throw error
    }
  }
  async close() { this.raw.close() }
}

class PostgresStatement {
  constructor(database, sql) {
    this.database = database
    this.sql = replacePlaceholders(sql)
  }

  async get(...params) {
    const result = await this.database.query(this.sql, params)
    return result.rows[0]
  }

  async all(...params) {
    const result = await this.database.query(this.sql, params)
    return result.rows
  }

  async run(...params) {
    return this.database.query(this.sql, params)
  }
}

class PostgresDatabase {
  constructor(connectionString) {
    this.dialect = 'postgres'
    this.transactionContext = new AsyncLocalStorage()
    let databaseUrl
    try { databaseUrl = new URL(connectionString) } catch { throw new Error('DATABASE_URL debe ser una URL PostgreSQL válida.') }
    if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) throw new Error('DATABASE_URL debe usar el protocolo postgres:// o postgresql://.')
    const isLocal = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(databaseUrl.hostname)
    const sslMode = databaseUrl.searchParams.get('sslmode')?.toLowerCase()
    if (!isLocal && ['disable', 'allow', 'prefer', 'no-verify'].includes(sslMode)) throw new Error('DATABASE_URL no puede desactivar ni degradar TLS fuera de localhost.')
    this.pool = new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      ssl: isLocal ? false : { rejectUnauthorized: true },
    })
  }

  prepare(sql) { return new PostgresStatement(this, sql) }
  async query(sql, params = []) {
    const connection = this.transactionContext.getStore() ?? this.pool
    return connection.query(sql, params)
  }
  async exec(sql) { await this.query(sql) }
  async transaction(operation) {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await this.transactionContext.run(client, operation)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
  async close() { await this.pool.end() }
}

export function createDatabase({ databaseUrl, sqliteFilename }) {
  return databaseUrl ? new PostgresDatabase(databaseUrl) : new SqliteDatabase(sqliteFilename)
}
