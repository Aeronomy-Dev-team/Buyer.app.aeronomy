'use client'

import ProducerDetailContent from './ProducerDetailContent'

export interface Producer {
  _id: string
  organizationId: string
  name: string
  legalName?: string
  organizationType?: string
  companyEmail?: string
  userName?: string
  address?: string
  website?: string
  branding?: { logo?: string }
  primaryContact?: { name?: string; email?: string; phone?: string }
  profile?: import('@/models/producer-organization-profile.types').ProducerOrganizationProfile
}

interface ProducerDetailProps {
  producer: Producer
  onClose: () => void
}

export default function ProducerDetail(props: ProducerDetailProps) {
  return <ProducerDetailContent {...props} />
}
