import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

let client: NeonQueryFunction<false, false> | null = null

function getClient(): NeonQueryFunction<false, false> {
  if (client) return client
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL no configurada')
  client = neon(url)
  return client
}

let schemaPromise: Promise<void> | null = null

// Crea la tabla de mensajes de forma idempotente (una vez por instancia).
export function ensureSchema(): Promise<void> {
  schemaPromise ??= (async () => {
    const sql = getClient()
    await sql`CREATE TABLE IF NOT EXISTS chat_messages (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      room TEXT NOT NULL,
      name TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
    await sql`CREATE INDEX IF NOT EXISTS chat_messages_room_id_idx ON chat_messages (room, id DESC)`
    await sql`CREATE TABLE IF NOT EXISTS users (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      password_salt TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
    await sql`CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL
    )`
    await sql`CREATE TABLE IF NOT EXISTS user_favorites (
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      crossing_id TEXT NOT NULL,
      time TEXT NOT NULL,
      plate TEXT NOT NULL,
      type TEXT NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, crossing_id)
    )`
  })()
  return schemaPromise
}

export function db(): NeonQueryFunction<false, false> {
  return getClient()
}
