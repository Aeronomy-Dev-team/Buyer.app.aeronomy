'use client'

import { useState } from 'react'
import { Calendar, DollarSign, Package, MapPin, CheckCircle2, Eye } from 'lucide-react'
import Link from 'next/link'
import { getTypeLabel, getPathwayLabel, getCertificationStatusBadge } from '@/lib/lots/utils'

export interface Lot {
  _id: string
  title: string
  description?: string
  type: string
  status: 'draft' | 'published' | 'reserved' | 'sold' | 'cancelled'
  volume: {
    amount: number
    unit: string
    total?: number
    available?: number
  }
  pricing: {
    price: number
    currency: string
    pricePerUnit?: number
  }
  delivery?: {
    deliveryDate?: string
    deliveryLocation?: string
  }
  compliance?: {
    standards?: string[]
    ghgReduction?: number
  }
  pathway?: string
  feedstockType?: string
  certifications?: Array<{ scheme: string; status: string; expectedCompletion?: string }>
  lcaData?: { reductionPercent?: number; totalLifecycleValue?: number }
  complianceEligibility?: { refueleu?: boolean; corsia?: boolean; ukRtfo?: boolean }
  airlineName?: string
  orgId?: {
    name?: string
    branding?: {
      brandName?: string
    }
  }
  views?: number
  publishedAt?: string
  tags?: string[]
}

interface LotCardProps {
  lot: Lot
  showActions?: boolean
  onEdit?: (lot: Lot) => void
  onDelete?: (lotId: string) => void
}

export default function LotCard({ lot, showActions = false, onEdit, onDelete }: LotCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPricePerUnit = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatVolume = (amount: number, unit: string) => {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount)
    return `${formattedAmount} ${unit}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800'
      case 'sold':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const airlineDisplayName = lot.airlineName || lot.orgId?.branding?.brandName || lot.orgId?.name || 'Unknown Airline'
  const reductionPercent = lot.lcaData?.reductionPercent ?? lot.compliance?.ghgReduction
  const primaryCert = lot.certifications?.[0]
  const certBadge = primaryCert ? getCertificationStatusBadge(primaryCert.status) : null

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col">
        {/* Header with title and badges */}
        <div className="mb-3">
          <h3 className="mb-2 text-lg font-semibold text-slate-900 line-clamp-2 break-words">{lot.title}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${getStatusColor(lot.status)}`}>
              {lot.status}
            </span>
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700 whitespace-nowrap">
              {getTypeLabel(lot.type)}
            </span>
            {lot.pathway && (
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-900 whitespace-nowrap">
                {getPathwayLabel(lot.pathway)}
              </span>
            )}
            {certBadge && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${certBadge.className}`}>
                {certBadge.label}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {lot.description && (
          <p className="mb-4 line-clamp-2 text-sm text-slate-600 break-words">{lot.description}</p>
        )}

        {/* Details - Vertical Stack */}
        <div className="mb-4 space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <DollarSign className="h-5 w-5 mt-0.5 text-slate-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 mb-1">Price</p>
              {lot.pricing.pricePerUnit ? (
                <>
                  <p className="font-semibold text-slate-900 break-words">
                    {formatPricePerUnit(lot.pricing.pricePerUnit, lot.pricing.currency)}/{lot.volume.unit}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 break-words">
                    Total: {formatCurrency(lot.pricing.price, lot.pricing.currency)}
                  </p>
                </>
              ) : (
                <p className="font-semibold text-slate-900 break-words">{formatCurrency(lot.pricing.price, lot.pricing.currency)}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <Package className="h-5 w-5 mt-0.5 text-slate-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 mb-1">Volume</p>
              <p className="font-semibold text-slate-900 break-words">
                {formatVolume(lot.volume.available ?? lot.volume.total ?? lot.volume.amount, lot.volume.unit)}
              </p>
              {(reductionPercent != null && reductionPercent > 0) && (
                <p className="text-xs text-green-600 mt-1 font-medium">{reductionPercent}% emission reduction</p>
              )}
            </div>
          </div>

          {lot.delivery?.deliveryDate && (
            <div className="flex items-start gap-3 text-sm">
              <Calendar className="h-5 w-5 mt-0.5 text-slate-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 mb-1">Delivery Date</p>
                <p className="font-semibold text-slate-900 break-words">{formatDate(lot.delivery.deliveryDate)}</p>
              </div>
            </div>
          )}

          {lot.delivery?.deliveryLocation && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-5 w-5 mt-0.5 text-slate-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 mb-1">Delivery Location</p>
                <p className="font-semibold text-slate-900 break-words">{lot.delivery.deliveryLocation}</p>
              </div>
            </div>
          )}
        </div>

          {/* Compliance Standards */}
          {lot.compliance?.standards && lot.compliance.standards.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {lot.compliance.standards.map((standard) => (
                <span
                  key={standard}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 whitespace-nowrap"
                >
                  <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                  {standard}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="font-medium text-slate-700 break-words">{airlineDisplayName}</span>
              {lot.views !== undefined && (
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Eye className="h-3 w-3 flex-shrink-0" />
                  {lot.views} views
                </span>
              )}
            </div>

            {showActions && onEdit && onDelete && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onEdit(lot)}
                  className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 whitespace-nowrap"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this lot?')) {
                      setIsDeleting(true)
                      await onDelete(lot._id)
                      setIsDeleting(false)
                    }
                  }}
                  disabled={isDeleting}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 whitespace-nowrap"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
      </div>
    </div>
  )
}


