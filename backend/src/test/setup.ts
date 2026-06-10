import mongoose from 'mongoose'

export const TEST_URI = process.env.MONGODB_TEST_URI
export const NODE_ENV = process.env.NODE_ENV

export async function connectTestDB() {
  if (!TEST_URI) {
    throw new Error('MONGODB_TEST_URI not set')
  }
  await mongoose.connect(TEST_URI)
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections
  await Promise.all(
    Object.values(collections).map((c) => c.deleteMany({}))
  )
}

export async function disconnectTestDB() {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
}
