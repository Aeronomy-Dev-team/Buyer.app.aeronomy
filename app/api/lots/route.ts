import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { listLots, createLot, getUserLots } from '@/lib/lots/service'
import type { LotStatus, LotType } from '@/models/Lot'

export const dynamic = 'force-dynamic'

// GET /api/lots - List all published lots (public) or user's lots (authenticated)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Try to get userId, but don't require it (public endpoint)
    let userId: string | null = null
    try {
      const authResult = await auth()
      userId = authResult.userId || null
    } catch {
      // Auth failed, but that's OK for public endpoint
      userId = null
    }

    const searchParams = request.nextUrl.searchParams

    // If user is authenticated and wants their own lots
    if (userId && searchParams.get('mine') === 'true') {
      const includeDrafts = searchParams.get('includeDrafts') === 'true'
      const lots = await getUserLots(userId, includeDrafts)
      return NextResponse.json({ lots })
    }

    // Otherwise, return public lots with filters (no auth required)
    const filters = {
      status: searchParams.get('status') as LotStatus | undefined,
      type: searchParams.get('type') as LotType | undefined,
      orgId: searchParams.get('orgId') || undefined,
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
    console.error('Error fetching lots:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch lots' }, { status: 500 })
  }
}

// POST /api/lots - Create a new lot (authenticated)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const lot = await createLot(userId, body)

    return NextResponse.json({ lot }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating lot:', error)
    return NextResponse.json({ error: error.message || 'Failed to create lot' }, { status: 500 })
  }
}


