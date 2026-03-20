'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Mail,
  Search,
  Globe,
  MapPin,
  ChevronRight,
  Factory,
  Leaf,
  BarChart3,
} from 'lucide-react'
import type { ProducerOrganizationProfile } from '@/models/producer-organization-profile.types'
import ProducerDetail from './ProducerDetail'

interface Producer {
  _id: string
  organizationId: string
  name: string
  legalName?: string
  organizationType?: string
  companyEmail?: string
  teamSize?: string
  userName?: string
  volumeRange?: string
  address?: string
  website?: string
  registrationNumber?: string
  vatNumber?: string
  onboardingComplete?: boolean
  primaryContact?: {
    name?: string
    email?: string
    phone?: string
  }
  source?: string
  syncedAt?: string
  branding?: {
    logo?: string
    brandName?: string
  }
  profile?: ProducerOrganizationProfile
  createdAt: string
}

function formatMT(n: number | undefined): string {
  if (n == null) return ''
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k MT` : `${n} MT`
}

function ProducerCard({
  producer,
  onSelect,
}: {
  producer: Producer
  onSelect: (producer: Producer) => void
}) {
  const p = producer.profile
  const legal = p?.legalIdentity
  const derived = p?.derived

  const displayName =
    producer.name || legal?.organizationName || legal?.displayName || 'Unnamed Producer'
  const displayLegal = producer.legalName || legal?.legalEntityName
  const displayEmail = producer.companyEmail || legal?.primaryContactEmail
  const displayContact = producer.userName || legal?.primaryContactName
  const displayAddress = producer.address || legal?.businessAddress
  const displayWebsite = producer.website || legal?.website
  const summary = legal?.summary

  const pathways = p?.pathways ?? []
  const feedstocks = p?.feedstocks ?? []
  const capacityMT =
    p?.totalNameplateCapacityMTPerYear ??
    p?.totalExpectedAvailableVolumeMTPerYear ??
    p?.uncommittedVolumeMTPerYear ??
    p?.commercial?.availableVolumeMT ??
    derived?.headlineAvailableVolumeMT

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(producer)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(producer)}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2"
    >
      {/* Subtle gradient accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400/60 via-teal-400/40 to-cyan-400/60 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            {producer.branding?.logo ? (
              <img
                src={producer.branding.logo}
                alt={displayName}
                className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200/60"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 ring-1 ring-emerald-100/80">
                <Building2 className="h-7 w-7 text-emerald-600" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                {displayName}
              </h3>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                {p?.legalIdentity?.orgType || producer.organizationType || 'SAF Producer'}
              </p>
              {summary && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{summary}</p>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </div>

        {/* Key metrics / badges */}
        {(pathways.length > 0 || feedstocks.length > 0 || capacityMT != null || derived?.headlineReductionPercent != null) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {derived?.headlineReductionPercent != null && (
              <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {derived.headlineReductionPercent}% reduction
              </span>
            )}
            {pathways.slice(0, 2).map((pw) => (
              <span
                key={pw}
                className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
              >
                <Factory className="mr-1 h-3 w-3" />
                {pw}
              </span>
            ))}
            {feedstocks.slice(0, 2).map((fs) => (
              <span
                key={fs}
                className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
              >
                <Leaf className="mr-1 h-3 w-3" />
                {fs}
              </span>
            ))}
            {capacityMT != null && (
              <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                <BarChart3 className="mr-1 h-3 w-3" />
                {formatMT(capacityMT)}/yr
              </span>
            )}
          </div>
        )}

        {/* Contact details */}
        <div className="space-y-2.5 text-sm">
          {displayLegal && displayLegal !== displayName && (
            <div className="flex items-start gap-2 text-slate-600">
              <span className="shrink-0 font-medium text-slate-500">Legal:</span>
              <span className="truncate">{displayLegal}</span>
            </div>
          )}
          {displayEmail && (
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{displayEmail}</span>
            </div>
          )}
          {displayAddress && (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="line-clamp-2">{displayAddress}</span>
            </div>
          )}
          {displayWebsite && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0 text-slate-400" />
              <a
                href={displayWebsite.startsWith('http') ? displayWebsite : `https://${displayWebsite}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="truncate text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                {displayWebsite.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {displayContact && (
            <div className="text-slate-600">
              <span className="font-medium text-slate-500">Contact: </span>
              {displayContact}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <span className="text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
            View full record
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              displayEmail && (window.location.href = `mailto:${displayEmail}`)
            }}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow"
          >
            Contact Producer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProducerList() {
  const [producers, setProducers] = useState<Producer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null)

  useEffect(() => {
    fetchProducers()
  }, [searchTerm])

  const fetchProducers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/organizations/producers?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProducers(data.producers || [])
      }
    } catch (error) {
      console.error('Error fetching producers:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Producers Directory
          </h1>
          <p className="mt-2 text-slate-600">
            Browse SAF producers and connect with potential suppliers
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, pathway, feedstock..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
          <p className="mt-4 text-sm text-slate-500">Loading producers...</p>
        </div>
      ) : producers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Building2 className="h-8 w-8 text-slate-400" />
          </div>
          <p className="mt-6 text-lg font-semibold text-slate-700">No producers found</p>
          <p className="mt-2 max-w-sm mx-auto text-sm text-slate-500">
            {searchTerm
              ? 'Try adjusting your search terms or clear the search to see all producers.'
              : 'No SAF producers are currently registered on the platform.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {producers.map((producer) => (
            <ProducerCard
              key={producer._id}
              producer={producer}
              onSelect={setSelectedProducer}
            />
          ))}
        </div>
      )}

      {selectedProducer && (
        <ProducerDetail
          producer={selectedProducer}
          onClose={() => setSelectedProducer(null)}
        />
      )}
    </div>
  )
}
