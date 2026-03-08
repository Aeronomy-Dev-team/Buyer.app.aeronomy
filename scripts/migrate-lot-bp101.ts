/**
 * BP-101 Migration: Lot Model Refactor
 *
 * 1. Set complianceEligibility on all existing lots (default: all false)
 * 2. Migrate type enum: spot -> spot_volume, forward -> forward_commitment, contract -> offtake_agreement
 *
 * Run: MONGODB_URI="..." npx tsx scripts/migrate-lot-bp101.ts
 * Or set MONGODB_URI in .env and run from project root
 */

import mongoose from 'mongoose'
import * as fs from 'fs'
import * as path from 'path'

// Load .env manually if not set (no dotenv dependency)
if (!process.env.MONGODB_URI) {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const match = line.match(/^MONGODB_URI=(.+)$/)
      if (match) {
        process.env.MONGODB_URI = match[1].trim().replace(/^["']|["']$/g, '')
        break
      }
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in .env')
  process.exit(1)
}

const TYPE_MIGRATION: Record<string, string> = {
  spot: 'spot_volume',
  forward: 'forward_commitment',
  contract: 'offtake_agreement',
}

async function migrate() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI!)
  const db = mongoose.connection.db
  if (!db) throw new Error('No database connection')
  const collection = db.collection('lots')

  const total = await collection.countDocuments()
  console.log(`Found ${total} lots to migrate`)

  const legacyTypes = Object.keys(TYPE_MIGRATION)
  const cursor = collection.find({
    $or: [
      { type: { $in: legacyTypes } },
      { complianceEligibility: { $exists: false } },
    ],
  })

  let migrated = 0
  let typeUpdated = 0
  let eligibilitySet = 0

  while (await cursor.hasNext()) {
    const doc = await cursor.next()
    if (!doc) continue

    const updates: Record<string, unknown> = {}
    let needsUpdate = false

    // Migrate type if legacy
    if (doc.type && TYPE_MIGRATION[doc.type]) {
      updates.type = TYPE_MIGRATION[doc.type]
      typeUpdated++
      needsUpdate = true
    }

    // Set complianceEligibility if missing
    if (!doc.complianceEligibility) {
      updates.complianceEligibility = {
        refueleu: false,
        corsia: false,
        ukRtfo: false,
        euEts: false,
        derivedAt: new Date(),
      }
      eligibilitySet++
      needsUpdate = true
    }

    if (needsUpdate) {
      await collection.updateOne({ _id: doc._id }, { $set: updates })
      migrated++
    }
  }

  console.log(`Migration complete:`)
  console.log(`  - ${migrated} lots updated`)
  console.log(`  - ${typeUpdated} type values migrated`)
  console.log(`  - ${eligibilitySet} complianceEligibility set`)
}

migrate()
  .then(() => {
    console.log('Done.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
  .finally(() => {
    mongoose.disconnect()
  })
