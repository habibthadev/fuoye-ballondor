import { serve } from '@hono/node-server'
import app from './index.js'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import { logger } from './config/pino.js'

async function main() {
  await connectDB()

  serve(
    { fetch: app.fetch, port: env.PORT },
    (info) => {
      logger.info({ port: info.port }, 'Server running')
    }
  )
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server')
  process.exit(1)
})
