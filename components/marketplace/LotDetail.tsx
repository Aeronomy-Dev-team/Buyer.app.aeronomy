'use client'

import { X, Edit, Trash2, MapPin, CheckCircle2, TrendingUp, DollarSign, Package } from 'lucide-react'
import { Lot } from './LotCard'
import { getTypeLabel, getPathwayLabel, getCertificationStatusBadge } from '@/lib/lots/utils'

interface LotDetailProps {
  lot: Lot
  onClose: () => void
  onEdit?: (lot: Lot) => void
  onDelete?: (lotId: string) => void
  onPlaceBid?: (lot: Lot) => void
  showActions?: boolean
}

export default function LotDetail({ lot, onClose, onEdit, onDelete, onPlaceBid, showActions = false }: LotDetailProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700'
      case 'draft': return 'bg-slate-100 text-slate-700'
      case 'reserved': return 'bg-yellow-100 text-yellow-700'
      case 'sold': return 'bg-blue-100 text-blue-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Lot Details</h2>
              <p className="text-xs text-slate-500">ID: {lot._id}</p>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit?.(lot)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                title="Edit Lot"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this lot?')) {
                    onDelete?.(lot._id)
                    onClose()
                  }
                }}
                className="p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Delete Lot"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 flex-1">

          {/* Main Info Card */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{lot.title}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(lot.status)}`}>
                    {lot.status}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide">
                    {getTypeLabel(lot.type)}
                  </span>
                  {(lot as any).pathway && (
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold uppercase tracking-wide">
                      {getPathwayLabel((lot as any).pathway)}
                    </span>
                  )}
                  {(lot as any).certifications?.[0] && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getCertificationStatusBadge((lot as any).certifications[0].status).className}`}>
                      {getCertificationStatusBadge((lot as any).certifications[0].status).label}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900">
                  {formatPrice(lot.pricing?.pricePerUnit || 0, lot.pricing?.currency ?? 'USD')}
                  <span className="text-sm font-normal text-slate-500 ml-1">/ {lot.volume?.unit ?? ''}</span>
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Total: {formatPrice(lot.pricing?.price ?? 0, lot.pricing?.currency ?? 'USD')}
                </p>
              </div>
            </div>

            {lot.description && (
              <p className="text-slate-600 text-sm leading-relaxed border-t border-slate-200 pt-4 mt-4">
                {lot.description}
              </p>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Volume & Pricing */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-400" />
                Volume & Pricing
              </h3>
              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3 shadow-sm">
                <div>
                  <p className="text-xs text-slate-500">Available Volume</p>
                  <p className="font-medium text-slate-900">
                    {(lot.volume?.available ?? lot.volume?.total ?? lot.volume?.amount ?? 0).toLocaleString()} {lot.volume?.unit ?? ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Minimum Order</p>
                  <p className="font-medium text-slate-900">N/A</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Payment Terms</p>
                  <p className="font-medium text-slate-900">{(lot.pricing as any).paymentTerms || 'Standard Terms'}</p>
                </div>
              </div>
            </div>

            {/* SAF Details (pathway, feedstock, facility) */}
            {((lot as any).pathway || (lot as any).productionFacility) && (
              <div className="space-y-4 sm:col-span-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-400" />
                  SAF Product Details
                </h3>
                <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3 shadow-sm">
                  {(lot as any).pathway && (
                    <div>
                      <p className="text-xs text-slate-600 font-medium">Pathway</p>
                      <p className="font-medium text-slate-900">{getPathwayLabel((lot as any).pathway)}</p>
                    </div>
                  )}
                  {(lot as any).feedstockType && (
                    <div>
                      <p className="text-xs text-slate-600 font-medium">Feedstock</p>
                      <p className="font-medium text-slate-900">{(lot as any).feedstockType}{(lot as any).feedstockOrigin ? ` — ${(lot as any).feedstockOrigin}` : ''}</p>
                    </div>
                  )}
                  {(lot as any).productionFacility && (
                    <div>
                      <p className="text-xs text-slate-600 font-medium">Production Facility</p>
                      <p className="font-medium text-slate-900">{(lot as any).productionFacility.name}, {(lot as any).productionFacility.location}, {(lot as any).productionFacility.country}</p>
                      <p className="text-xs text-slate-700 mt-1">{(lot as any).productionFacility.capacityMTPerYear?.toLocaleString()} MT/year · Commissioning {new Date((lot as any).productionFacility.commissioningDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {(lot as any).complianceEligibility && (
                    <div>
                      <p className="text-xs text-slate-600 font-medium">Compliance Eligibility</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(lot as any).complianceEligibility.refueleu && <span className="px-2 py-0.5 rounded bg-blue-200 text-blue-900 text-xs font-medium">ReFuelEU</span>}
                        {(lot as any).complianceEligibility.corsia && <span className="px-2 py-0.5 rounded bg-green-200 text-green-900 text-xs font-medium">CORSIA</span>}
                        {(lot as any).complianceEligibility.ukRtfo && <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-xs font-medium">UK RTFO</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                Logistics
              </h3>
              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3 shadow-sm">
                <div>
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="font-medium text-slate-900">{lot.delivery?.deliveryLocation || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Delivery Method</p>
                  <p className="font-medium text-slate-900">{(lot.delivery as any)?.deliveryMethod || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Date Available</p>
                  <p className="font-medium text-slate-900">{formatDate(lot.delivery?.deliveryDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Incoterms</p>
                  <p className="font-medium text-slate-900">{(lot.delivery as any)?.incoterms || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-slate-400" />
              Compliance & Sustainability
            </h3>
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500">GHG Reduction</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(lot as any).lcaData?.reductionPercent ?? lot.compliance?.ghgReduction ?? 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-green-700">{(lot as any).lcaData?.reductionPercent ?? lot.compliance?.ghgReduction ?? 0}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Sustainability Score</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div
                        key={star}
                        className={`h-2 w-2 rounded-full ${star <= Math.round(((lot.compliance as any)?.sustainabilityScore || 0) / 20)
                          ? 'bg-blue-500'
                          : 'bg-slate-200'
                          }`}
                      />
                    ))}
                    <span className="text-xs font-medium text-slate-600 ml-2">
                      {(lot.compliance as any)?.sustainabilityScore || 0}/100
                    </span>
                  </div>
                </div>
              </div>

              {((lot as any).certifications?.length || lot.compliance?.standards?.length) ? (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {(lot as any).certifications?.map((c: any, i: number) => (
                      <span key={i} className="px-2 py-1 rounded bg-slate-200 border border-slate-300 text-xs font-medium text-slate-800 flex items-center gap-1">
                        <AwardIcon standard={c.scheme} />
                        {c.scheme.replace(/_/g, ' ')} — {c.status.replace('_', ' ')}
                        {c.expectedCompletion && ` (Expected ${new Date(c.expectedCompletion).toLocaleDateString()})`}
                      </span>
                    ))}
                    {lot.compliance?.standards?.map((standard: string) => (
                      <span key={standard} className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1">
                        <AwardIcon standard={standard} />
                        {standard}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Timeline / History (Mock for now) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              Activity History
            </h3>
            <div className="relative pl-4 border-l-2 border-slate-200 space-y-6">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-slate-200 border-2 border-white ring-1 ring-slate-100" />
                <p className="text-sm text-slate-900 font-medium">Lot Created</p>
                <p className="text-xs text-slate-500">{formatDate((lot as any).createdAt)}</p>
              </div>
              {lot.publishedAt && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-white ring-1 ring-blue-100" />
                  <p className="text-sm text-slate-900 font-medium">Published to Marketplace</p>
                  <p className="text-xs text-slate-500">{formatDate(lot.publishedAt)}</p>
                </div>
              )}
              {/* Additional timeline events would go here */}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          {!showActions && lot.status === 'published' && onPlaceBid && (
            <button
              onClick={() => onPlaceBid(lot)}
              className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Place Bid
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AwardIcon({ standard }: { standard: string }) {
  // Simple icon placeholder, could be replaced with actual logos
  return <div className="w-2 h-2 rounded-full bg-blue-400" />
}




