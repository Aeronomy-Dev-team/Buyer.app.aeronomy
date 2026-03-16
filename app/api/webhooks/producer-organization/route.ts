import { NextRequest, NextResponse } from 'next/server'
import { validateInterDashboardAuth } from '@/lib/jwt'
import connectDB from '@/lib/mongodb'
import ProducerOrganization from '@/models/ProducerOrganization'

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
    if (!org?.organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    await connectDB()

    console.log('[producer-organization webhook] Processing organization sync', {
      event: body.event,
      organizationId: org.organizationId,
      companyName: org.companyName ?? '',
      contactEmail: org.primaryContact?.email ?? '',
      onboardingComplete: Boolean(org.onboardingComplete),
      updatedAt: org.updatedAt ?? null,
    })

    const existingRecord = await ProducerOrganization.findOne({
      organizationId: org.organizationId,
    }).lean()

    const record = await ProducerOrganization.findOneAndUpdate(
      { organizationId: org.organizationId },
      {
        $set: {
          companyName: org.companyName ?? '',
          legalName: org.legalName ?? '',
          registrationNumber: org.registrationNumber ?? '',
          vatNumber: org.vatNumber ?? '',
          address: org.address ?? '',
          website: org.website ?? '',
          onboardingComplete: Boolean(org.onboardingComplete),
          primaryContact: {
            name: org.primaryContact?.name ?? '',
            email: org.primaryContact?.email ?? '',
            phone: org.primaryContact?.phone ?? '',
          },
          updatedAt: org.updatedAt ? new Date(org.updatedAt) : new Date(),
          source,
          lastSyncedAt: new Date(),
        },
      },
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
      debug: {
        source,
        authMethod: auth.method,
        operation: existingRecord ? 'updated' : 'created',
        lastSyncedAt: record.lastSyncedAt,
      },
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
