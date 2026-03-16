import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Organization from '@/models/Organization'
import ProducerOrganization from '@/models/ProducerOrganization'

export const dynamic = 'force-dynamic'

// GET /api/organizations/producers - Get all producer organizations
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    const query: any = {
      type: 'producer',
      onboardingStatus: 'completed',
    }
    const syncedQuery: any = {}

    // Add search filter if provided
    if (search) {
      const regex = { $regex: search, $options: 'i' }

      query.$or = [
        { name: regex },
        { organizationType: regex },
        { 'legalEntity.legalName': regex },
      ]

      syncedQuery.$or = [
        { companyName: regex },
        { legalName: regex },
        { 'primaryContact.email': regex },
        { address: regex },
        { website: regex },
      ]
    }

    const organizationProducers = await Organization.find(query)
      .select('name organizationType companyEmail teamSize userName branding volumeRange createdAt')
      .sort({ createdAt: -1 })
      .lean()

    const syncedProducers = await ProducerOrganization.find(syncedQuery)
      .select('organizationId companyName legalName registrationNumber vatNumber address website onboardingComplete primaryContact source updatedAt createdAt lastSyncedAt')
      .sort({ lastSyncedAt: -1, createdAt: -1 })
      .lean()

    const normalizedProducers = [
      ...syncedProducers.map((producer) => ({
        _id: producer._id.toString(),
        organizationId: producer.organizationId,
        name: producer.companyName || producer.legalName || 'Unnamed Producer',
        legalName: producer.legalName,
        companyEmail: producer.primaryContact?.email || '',
        userName: producer.primaryContact?.name || '',
        organizationType: 'producer',
        teamSize: '',
        volumeRange: '',
        address: producer.address,
        website: producer.website,
        registrationNumber: producer.registrationNumber,
        vatNumber: producer.vatNumber,
        onboardingComplete: producer.onboardingComplete,
        primaryContact: producer.primaryContact,
        source: producer.source || 'producer-dashboard',
        syncedAt: producer.lastSyncedAt || producer.updatedAt || producer.createdAt,
        createdAt: producer.createdAt,
      })),
      ...organizationProducers.map((producer) => ({
        _id: producer._id.toString(),
        organizationId: producer._id.toString(),
        name: producer.name,
        legalName: '',
        companyEmail: producer.companyEmail || '',
        userName: producer.userName || '',
        organizationType: producer.organizationType || 'producer',
        teamSize: producer.teamSize || '',
        volumeRange: producer.volumeRange || '',
        address: '',
        website: '',
        registrationNumber: '',
        vatNumber: '',
        onboardingComplete: true,
        primaryContact: {
          name: producer.userName || '',
          email: producer.companyEmail || '',
          phone: '',
        },
        source: 'buyer-dashboard',
        syncedAt: producer.createdAt,
        branding: producer.branding,
        createdAt: producer.createdAt,
      })),
    ]

    console.log('[producers api] Returning producer profiles', {
      buyerPortalCount: organizationProducers.length,
      syncedProducerCount: syncedProducers.length,
      totalCount: normalizedProducers.length,
      search: search || '',
    })

    return NextResponse.json({
      producers: normalizedProducers,
      count: normalizedProducers.length,
      debug: {
        buyerPortalCount: organizationProducers.length,
        syncedProducerCount: syncedProducers.length,
        totalCount: normalizedProducers.length,
        search: search || '',
      },
    })
  } catch (error: any) {
    console.error('Error fetching producers:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch producers' }, { status: 500 })
  }
}




