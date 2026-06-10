import { Client, Receiver } from '@upstash/qstash'
import { env } from '../config/env.js'

export const qstash = new Client({ token: env.QSTASH_TOKEN })

export const receiver = new Receiver({
  currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
})
