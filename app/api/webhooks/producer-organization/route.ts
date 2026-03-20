import { NextRequest, NextResponse } from 'next/server'
import { validateInterDashboardAuth } from '@/lib/jwt'
import connectDB from '@/lib/mongodb'
import ProducerOrganization from '@/models/ProducerOrganization'
import type { ProducerOrganizationProfile } from '@/models/producer-organization-profile.types'

export const dynamic = 'force-dynamic'

type ProducerOrganizationWebhookBody = {
  event?: string
  organization?: {
    organizationId?: string
    companyName?: string
    legalName?: string
    registrationNumber?: string
    vatNumber?: string
    address?: string
    website?: string
    onboardingComplete?: boolean
    primaryContact?: {
      name?: string
      email?: string
      phone?: string
    }
    updatedAt?: string
  }
  /** Buyer-facing normalized profile (profileVersion: buyer-portal-v2) */
  profile?: ProducerOrganizationProfile
}

export async function GET() {
  try {
    await connectDB()

    const recentRecords = await ProducerOrganization.find({})
      .select('organizationId companyName legalName primaryContact source updatedAt lastSyncedAt onboardingComplete')
      .sort({ lastSyncedAt: -1, updatedAt: -1 })
      .limit(10)
      .lean()

    return NextResponse.json({
      success: true,
      count: recentRecords.length,
      records: recentRecords.map((record) => ({
        organizationId: record.organizationId,
        companyName: record.companyName,
        legalName: record.legalName,
        contactEmail: record.primaryContact?.email || '',
        onboardingComplete: record.onboardingComplete,
        source: record.source,
        updatedAt: record.updatedAt,
        lastSyncedAt: record.lastSyncedAt,
      })),
    })
  } catch (error) {
    console.error('Error reading producer organization webhook debug data:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to read webhook debug data',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const apiKey = request.headers.get('x-api-key')
    const auth = validateInterDashboardAuth(authHeader, apiKey)
    const source = request.headers.get('x-source') || 'unknown'

    console.log('[producer-organization webhook] Incoming request', {
      source,
      hasAuthorization: Boolean(authHeader),
      hasApiKey: Boolean(apiKey),
      authMethod: auth.method,
      authValid: auth.valid,
    })

    if (!auth.valid) {
      console.warn('[producer-organization webhook] Unauthorized request rejected', {
        source,
        reason: auth.reason,
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as ProducerOrganizationWebhookBody

    if (body.event !== 'producer.organization.updated') {
      return NextResponse.json({ error: 'Unsupported event' }, { status: 400 })
    }

    const org = body.organization
    const profile = body.profile
    const organizationId = org?.organizationId ?? profile?.orgId
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId or profile.orgId is required' }, { status: 400 })
    }

    await connectDB()

    const effectiveOrgId = org?.organizationId ?? organizationId

    console.log('[producer-organization webhook] Processing organization sync', {
      event: body.event,
      organizationId: effectiveOrgId,
      companyName: org?.companyName ?? profile?.legalIdentity?.organizationName ?? '',
      contactEmail: org?.primaryContact?.email ?? profile?.legalIdentity?.primaryContactEmail ?? '',
      onboardingComplete: Boolean(org?.onboardingComplete),
      hasProfile: Boolean(profile),
      updatedAt: org?.updatedAt ?? profile?.metadata?.updatedAt ?? null,
    })

    const legalIdentity = profile?.legalIdentity
    const existingRecord = await ProducerOrganization.findOne({
      organizationId: effectiveOrgId,
    }).lean()

    const updatePayload: Record<string, unknown> = {
      organizationId: effectiveOrgId,
      companyName: org?.companyName ?? legalIdentity?.organizationName ?? legalIdentity?.displayName ?? '',
      legalName: org?.legalName ?? legalIdentity?.legalEntityName ?? '',
      registrationNumber: org?.registrationNumber ?? '',
      vatNumber: org?.vatNumber ?? '',
      address: org?.address ?? legalIdentity?.businessAddress ?? '',
      website: org?.website ?? legalIdentity?.website ?? '',
      onboardingComplete: Boolean(org?.onboardingComplete ?? true),
      primaryContact: {
        name: org?.primaryContact?.name ?? legalIdentity?.primaryContactName ?? '',
        email: org?.primaryContact?.email ?? legalIdentity?.primaryContactEmail ?? '',
        phone: org?.primaryContact?.phone ?? '',
      },
      updatedAt: org?.updatedAt ? new Date(org.updatedAt) : profile?.metadata?.updatedAt ? new Date(profile.metadata.updatedAt) : new Date(),
      source,
      lastSyncedAt: new Date(),
    }
    if (profile && typeof profile === 'object') {
      updatePayload.profile = profile
    }

    const record = await ProducerOrganization.findOneAndUpdate(
      { organizationId: effectiveOrgId },
      { $set: updatePayload },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    )

    console.log('[producer-organization webhook] Sync stored successfully', {
      organizationId: record.organizationId,
      operation: existingRecord ? 'updated' : 'created',
      recordId: record._id.toString(),
      lastSyncedAt: record.lastSyncedAt,
    })

    return NextResponse.json({
      success: true,
      event: body.event,
      organizationId: record.organizationId,
    })
  } catch (error) {
    console.error('Error processing producer organization webhook:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process webhook',
      },
      { status: 500 }
    )
  }
}
