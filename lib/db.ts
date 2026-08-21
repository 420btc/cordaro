import { neon } from '@neondatabase/serverless'

let client: ReturnType<typeof neon> | null = null

function getClient(): ReturnType<typeof neon> {
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
  })()
  return schemaPromise
}

export function db(): ReturnType<typeof neon> {
  return getClient()
}
