import mongoose from 'mongoose'
import { env } from './env.js'

let connectionPromise: Promise<typeof mongoose> | null = null

export async function connectDB() {
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 15000,
    })
  }
  return connectionPromise
}

export async function disconnectDB() {
  if (connectionPromise) {
    await mongoose.disconnect()
    connectionPromise = null
  }
}
