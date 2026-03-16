'use client'

import { useState, useEffect } from 'react'
import { Building2, Mail, Users, TrendingUp, Search, Globe, MapPin, CheckCircle2 } from 'lucide-react'

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
  createdAt: string
}

interface ProducerApiDebug {
  buyerPortalCount: number
  syncedProducerCount: number
  totalCount: number
  search: string
}

export default function ProducerList() {
  const [producers, setProducers] = useState<Producer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debugInfo, setDebugInfo] = useState<ProducerApiDebug | null>(null)

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
        setDebugInfo(data.debug || null)
        console.log('[ProducerList] Producer profiles loaded', data.debug || {})
      }
    } catch (error) {
      console.error('Error fetching producers:', error)
    } finally {
      setLoading(false)
    }
  }

  const getVolumeRangeDisplay = (range?: string) => {
    if (!range) return 'Not specified'
    const ranges: Record<string, string> = {
      low: 'Low (< 1M gallons/year)',
      medium: 'Medium (1M - 10M gallons/year)',
      high: 'High (> 10M gallons/year)',
    }
    return ranges[range] || range
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Available Producers</h2>
          <p className="mt-1 text-sm text-slate-600">
            Browse SAF producers and connect with potential suppliers
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search producers by name or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {debugInfo && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p className="font-medium">Producer sync debug</p>
          <p className="mt-1">
            Total: {debugInfo.totalCount} | Synced from producer portal: {debugInfo.syncedProducerCount} | Local buyer records: {debugInfo.buyerPortalCount}
          </p>
        </div>
      )}

      {/* Producer List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
        </div>
      ) : producers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-600">No producers found</p>
          <p className="mt-1 text-xs text-slate-500">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'No SAF producers are currently registered on the platform'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {producers.map((producer) => (
            <div
              key={producer._id}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
            >
              {/* Producer Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {producer.branding?.logo ? (
                    <img
                      src={producer.branding.logo}
                      alt={producer.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">
                      {producer.name}
                    </h3>
                    <p className="text-xs text-slate-500 capitalize">
                      {producer.organizationType || 'SAF Producer'}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Source: {producer.source || 'unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Producer Details */}
              <div className="space-y-3">
                {producer.legalName && producer.legalName !== producer.name && (
                  <div className="text-sm text-slate-600">
                    Legal name: {producer.legalName}
                  </div>
                )}

                {producer.companyEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600 truncate">{producer.companyEmail}</span>
                  </div>
                )}

                {producer.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600 line-clamp-2">{producer.address}</span>
                  </div>
                )}

                {producer.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <a
                      href={producer.website}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-blue-600 hover:text-blue-700"
                    >
                      {producer.website}
                    </a>
                  </div>
                )}

                {producer.teamSize && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{producer.teamSize} employees</span>
                  </div>
                )}

                {producer.volumeRange && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{getVolumeRangeDisplay(producer.volumeRange)}</span>
                  </div>
                )}

                {producer.onboardingComplete !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">
                      {producer.onboardingComplete ? 'Onboarding complete' : 'Onboarding pending'}
                    </span>
                  </div>
                )}

                {producer.userName && (
                  <div className="text-sm text-slate-600">
                    Contact: {producer.userName}
                  </div>
                )}

                {producer.syncedAt && (
                  <div className="text-xs text-slate-400">
                    Last synced: {new Date(producer.syncedAt).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Contact Button */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => producer.companyEmail && (window.location.href = `mailto:${producer.companyEmail}`)}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  disabled={!producer.companyEmail}
                >
                  {producer.companyEmail ? 'Contact Producer' : 'No Contact Available'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

