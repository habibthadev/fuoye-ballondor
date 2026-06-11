import mongoose from 'mongoose'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dirname, '..', '..', '.env') })

async function main() {
  const prodUri = process.env.PROD_MONGODB_URI
  if (!prodUri) {
    console.error('Set PROD_MONGODB_URI env var for the production database')
    process.exit(1)
  }

  const devUri = process.env.MONGODB_URI
  if (!devUri) {
    console.error('MONGODB_URI not found in .env')
    process.exit(1)
  }

  const dev = await mongoose.createConnection(devUri).asPromise()
  console.log('Connected to dev')

  const prod = await mongoose.createConnection(prodUri).asPromise()
  console.log('Connected to prod')

  const devCat = dev.collection('categories')
  const devNom = dev.collection('nominees')
  const devSet = dev.collection('settings')
  const devAdm = dev.collection('admins')

  const prodCat = prod.collection('categories')
  const prodNom = prod.collection('nominees')
  const prodSet = prod.collection('settings')
  const prodAdm = prod.collection('admins')

  // --- Categories (upsert by slug, preserve dev _id) ---
  const categories = await devCat.find({}).toArray()
  console.log(`Found ${categories.length} categories in dev`)

  for (const cat of categories) {
    const { _id, __v, createdAt, updatedAt, ...rest } = cat
    await prodCat.updateOne(
      { slug: cat.slug },
      { $set: { ...rest, updatedAt: new Date() }, $setOnInsert: { _id, createdAt: createdAt ?? new Date() } },
      { upsert: true },
    )
  }
  console.log('Categories ported')

  // --- Nominees (upsert by name+categoryId) ---
  const nominees = await devNom.find({}).toArray()
  console.log(`Found ${nominees.length} nominees in dev`)

  let nomSkipped = 0
  for (const n of nominees) {
    const { _id, __v, createdAt, updatedAt, ...rest } = n
    const result = await prodNom.updateOne(
      { name: n.name, categoryId: n.categoryId },
      { $setOnInsert: { ...rest, createdAt: createdAt ?? new Date(), updatedAt: new Date() } },
      { upsert: true },
    )
    if (result.upsertedCount === 0) nomSkipped++
  }
  console.log(`Nominees ported (${nominees.length - nomSkipped} inserted, ${nomSkipped} already exist)`)

  // --- Settings (single doc, upsert) ---
  const settings = await devSet.find({}).toArray()
  if (settings.length > 0) {
    const { _id, __v, createdAt, updatedAt, ...rest } = settings[0]!
    await prodSet.updateOne(
      {},
      { $set: { ...rest, updatedAt: new Date() }, $setOnInsert: { createdAt: createdAt ?? new Date() } },
      { upsert: true },
    )
    console.log('Settings ported')
  }

  // --- Admins (upsert by email) ---
  const admins = await devAdm.find({}).toArray()
  console.log(`Found ${admins.length} admins in dev`)

  for (const a of admins) {
    const { _id, __v, createdAt, updatedAt, ...rest } = a
    await prodAdm.updateOne(
      { email: a.email },
      { $setOnInsert: { ...rest, createdAt: createdAt ?? new Date(), updatedAt: new Date() } },
      { upsert: true },
    )
  }
  console.log('Admins ported')

  console.log('Done — categories, nominees, settings, and admins ported to prod')
  await dev.close()
  await prod.close()
}

main().catch((err) => {
  console.error('Migration failed', err)
  process.exit(1)
})
