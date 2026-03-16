/**
 * Seed the Yoki producer profile onto an existing organization.
 *
 * Run:
 *   npm run seed:yoki
 *
 * Optional:
 *   npm run seed:yoki -- --name="Yoki"
 *   npm run seed:yoki -- --orgId="<mongodb-id>"
 */

import mongoose from 'mongoose'
import * as fs from 'fs'
import * as path from 'path'
import Organization from '../models/Organization'
import { YOKI_PRODUCER_PROFILE } from '../lib/seed/yoki-producer-profile'

function loadMongoUri() {
  if (process.env.MONGODB_URI) return

  const envFiles = ['.env.local', '.env']

  for (const fileName of envFiles) {
    const envPath = path.resolve(process.cwd(), fileName)
    if (!fs.existsSync(envPath)) continue

    const content = fs.readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const match = line.match(/^MONGODB_URI=(.+)$/)
      if (match) {
        process.env.MONGODB_URI = match[1].trim().replace(/^["']|["']$/g, '')
        return
      }
    }
  }
}

function getArgValue(flag: string) {
  const arg = process.argv.find((entry) => entry.startsWith(`${flag}=`))
  return arg ? arg.slice(flag.length + 1) : undefined
}

async function seedYoki() {
  loadMongoUri()

  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) {
    throw new Error('MONGODB_URI not set in .env.local, .env, or the current shell.')
  }

  const orgId = getArgValue('--orgId')
  const orgName = getArgValue('--name') || 'Yoki'

  console.log('Connecting to MongoDB...')
  await mongoose.connect(mongoUri)

  const filter = orgId ? { _id: orgId } : { name: orgName }
  console.log(`Looking up organization by ${orgId ? 'id' : 'name'}...`)

  const organization = await Organization.findOneAndUpdate(
    filter,
    {
      $set: {
        type: 'producer',
        producerProfile: YOKI_PRODUCER_PROFILE,
      },
    },
    {
      new: true,
    }
  )

  if (!organization) {
    throw new Error(
      `Organization not found for ${orgId ? `orgId "${orgId}"` : `name "${orgName}"`}.`
    )
  }

  console.log('Yoki producer profile seeded successfully.')
  console.log(`Organization ID: ${organization._id}`)
  console.log(`Organization name: ${organization.name}`)
  console.log(`Organization type: ${organization.type}`)
}

seedYoki()
  .then(() => {
    console.log('Done.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
