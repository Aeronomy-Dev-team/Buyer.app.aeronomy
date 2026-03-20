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
      .select('organizationId companyName legalName registrationNumber vatNumber address website onboardingComplete primaryContact source profile updatedAt createdAt lastSyncedAt')
      .sort({ lastSyncedAt: -1, createdAt: -1 })
      .lean()

    const normalizedProducers = [
      ...syncedProducers.map((producer) => {
        const p = producer.profile
        const legal = p?.legalIdentity
        return {
          _id: producer._id.toString(),
          organizationId: producer.organizationId,
          name: producer.companyName || legal?.organizationName || legal?.displayName || producer.legalName || 'Unnamed Producer',
          legalName: producer.legalName || legal?.legalEntityName,
          companyEmail: producer.primaryContact?.email || legal?.primaryContactEmail || '',
          userName: producer.primaryContact?.name || legal?.primaryContactName || '',
          organizationType: p?.legalIdentity?.orgType || 'producer',
          teamSize: '',
          volumeRange: '',
          address: producer.address || legal?.businessAddress,
          website: producer.website || legal?.website,
          registrationNumber: producer.registrationNumber,
          vatNumber: producer.vatNumber,
          onboardingComplete: producer.onboardingComplete,
          primaryContact: producer.primaryContact || (legal ? { name: legal.primaryContactName, email: legal.primaryContactEmail, phone: '' } : undefined),
          source: producer.source || 'producer-dashboard',
          syncedAt: producer.lastSyncedAt || producer.updatedAt || producer.createdAt,
          createdAt: producer.createdAt,
          profile: producer.profile,
        }
      }),
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

    return NextResponse.json({
      producers: normalizedProducers,
      count: normalizedProducers.length,
    })
  } catch (error: any) {
    console.error('Error fetching producers:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch producers' }, { status: 500 })
  }
}




