/**
 * External API endpoint for Producer Dashboard to fetch lots
 * This endpoint allows the Producer Dashboard to query lots by organization
 * 
 * Authentication: Uses API key via Authorization header
 */

import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { listLots, getUserLots } from '@/lib/lots/service'
import { auth } from '@clerk/nextjs/server'
import type { LotStatus, LotType } from '@/models/Lot'

export const dynamic = 'force-dynamic'

// GET /api/lots/external - Fetch lots for external systems (Producer Dashboard)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Option 1: Use API key authentication (for external systems)
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
    const expectedApiKey = process.env.PRODUCER_DASHBOARD_API_KEY

    // Option 2: Use Clerk authentication (if same auth system)
    let userId: string | null = null
    try {
      const authResult = await auth()
      userId = authResult.userId || null
    } catch {
      // Auth failed, but that's OK if API key is provided
      userId = null
    }

    // If API key is configured, verify it (otherwise allow public access or Clerk auth)
    if (expectedApiKey) {
      if (!apiKey || apiKey !== expectedApiKey) {
        // If no API key provided, check if user is authenticated
        if (!userId) {
          return NextResponse.json({
            error: 'Unauthorized. Provide API key via X-API-Key header or Authorization Bearer token'
          }, { status: 401 })
        }
      }
    } else {
      // No API key configured - allow public access or Clerk auth
      // This is fine for local development
      console.log('⚠️  PRODUCER_DASHBOARD_API_KEY not set - allowing public access to /api/lots/external')
    }

    const searchParams = request.nextUrl.searchParams

    // If userId is available, fetch user's lots
    if (userId) {
      const includeDrafts = searchParams.get('includeDrafts') === 'true'
      const lots = await getUserLots(userId, includeDrafts)
      return NextResponse.json({ lots, count: lots.length })
    }

    // Otherwise, fetch lots (optionally filtered by organization ID)
    const orgId = searchParams.get('orgId')
    const status = searchParams.get('status') as LotStatus | undefined

    // Allow fetching all published lots without orgId (for SAF Marketplace/Producer Dashboard)
    // Only require orgId if status is not 'published'
    if (!orgId && status !== 'published') {
      return NextResponse.json({
        error: 'orgId parameter is required (or use status=published to fetch all published lots)'
      }, { status: 400 })
    }

    const filters = {
      orgId: orgId || undefined,
      status,
      type: searchParams.get('type') as LotType | undefined,
      pathway: searchParams.get('pathway') || undefined,
      certificationStatus: searchParams.get('certificationStatus') as 'certified' | 'in_progress' | 'not_started' | undefined,
      corsiaEligible: searchParams.get('corsiaEligible') === 'true' ? true : undefined,
      refueleuEligible: searchParams.get('refueleuEligible') === 'true' ? true : undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      standards: searchParams.get('standards')?.split(',') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const lots = await listLots(filters)
    return NextResponse.json({ lots, count: lots.length })
  } catch (error: any) {
    console.error('Error fetching lots for external system:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch lots' }, { status: 500 })
  }
}

