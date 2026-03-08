'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { Lot } from './LotCard'
import { LEGACY_TYPE_MAP } from '@/lib/lots/utils'

// Normalize type: accept both new and legacy values
const normalizeType = (t?: string) => (t && LEGACY_TYPE_MAP[t]) || t || 'spot_volume'

interface LotFormProps {
  lot?: Lot
  onClose: () => void
  onSuccess: (savedLot?: { _id: string; status?: string }) => void
}

const PATHWAYS = ['FT_SPK', 'HEFA_SPK', 'ATJ_SPK', 'HFS_SIP', 'CHJ', 'HC_HEFA_SPK', 'PTL', 'CO_PROCESSING', 'OTHER'] as const
const CERT_SCHEMES = ['ISCC_CORSIA', 'ISCC_EU', 'ISCC_PLUS', 'RSB_CORSIA', 'RSB_EU_RED', 'RSB_GLOBAL', 'CLASSNK_CORSIA', 'OTHER'] as const
const CERT_STATUSES = ['certified', 'in_progress', 'not_started'] as const
const DELIVERY_REGIONS = ['EU', 'UK', 'US', 'ME', 'APAC'] as const

export default function LotForm({ lot, onClose, onSuccess }: LotFormProps) {
  const [loading, setLoading] = useState(false)
  const [safSectionOpen, setSafSectionOpen] = useState(!!(lot?.pathway || lot?.lcaData))
  // Calculate pricePerUnit from existing lot data if editing
  const getInitialPricePerUnit = () => {
    if (lot?.pricing?.pricePerUnit) {
      return lot.pricing.pricePerUnit.toString()
    }
    if (lot?.pricing?.price && lot?.volume?.amount) {
      return (lot.pricing.price / lot.volume.amount).toFixed(2)
    }
    return ''
  }

  const [formData, setFormData] = useState({
    title: lot?.title || '',
    description: lot?.description || '',
    type: normalizeType(lot?.type),
    status: lot?.status || 'draft',
    volumeAmount: lot?.volume?.amount?.toString() || '',
    volumeUnit: lot?.volume?.unit || 'gallons',
    pricePerUnit: getInitialPricePerUnit(),
    currency: lot?.pricing?.currency || 'USD',
    paymentTerms: (lot?.pricing as any)?.paymentTerms || '',
    deliveryDate: lot?.delivery?.deliveryDate ? new Date(lot.delivery.deliveryDate).toISOString().split('T')[0] : '',
    deliveryLocation: lot?.delivery?.deliveryLocation || '',
    deliveryMethod: (lot?.delivery as any)?.deliveryMethod || '',
    incoterms: (lot?.delivery as any)?.incoterms || '',
    standards: lot?.compliance?.standards?.join(', ') || '',
    ghgReduction: lot?.compliance?.ghgReduction?.toString() || '',
    tags: lot?.tags?.join(', ') || '',
    airlineName: lot?.airlineName || '',
    // SAF-specific (BP-101)
    pathway: (lot as any)?.pathway || '',
    feedstockType: (lot as any)?.feedstockType || '',
    feedstockOrigin: (lot as any)?.feedstockOrigin || '',
    facilityName: (lot as any)?.productionFacility?.name || '',
    facilityLocation: (lot as any)?.productionFacility?.location || '',
    facilityCountry: (lot as any)?.productionFacility?.country || '',
    facilityCapacity: (lot as any)?.productionFacility?.capacityMTPerYear?.toString() || '',
    facilityCommissioning: (lot as any)?.productionFacility?.commissioningDate ? new Date((lot as any).productionFacility.commissioningDate).toISOString().split('T')[0] : '',
    certScheme: (lot as any)?.certifications?.[0]?.scheme || '',
    certStatus: (lot as any)?.certifications?.[0]?.status || '',
    certExpectedCompletion: (lot as any)?.certifications?.[0]?.expectedCompletion ? new Date((lot as any).certifications[0].expectedCompletion).toISOString().split('T')[0] : '',
    deliveryAirport: (lot as any)?.deliveryLocations?.[0]?.airport || '',
    deliveryCountry: (lot as any)?.deliveryLocations?.[0]?.country || '',
    deliveryRegion: (lot as any)?.deliveryLocations?.[0]?.region || 'EU',
    deliveryAvailableFrom: (lot as any)?.deliveryLocations?.[0]?.availableFrom ? new Date((lot as any).deliveryLocations[0].availableFrom).toISOString().split('T')[0] : '',
    lcaCoreValue: (lot as any)?.lcaData?.coreValue?.toString() || '',
    lcaIlucValue: (lot as any)?.lcaData?.ilucValue?.toString() || '0',
    lcaTotalValue: (lot as any)?.lcaData?.totalLifecycleValue?.toString() || '',
    lcaReductionPercent: (lot as any)?.lcaData?.reductionPercent?.toString() || '',
    lcaMethodology: (lot as any)?.lcaData?.methodology || 'ICAO_CORSIA',
    lcaReferenceYear: (lot as any)?.lcaData?.referenceYear?.toString() || new Date().getFullYear().toString(),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const volumeAmount = parseFloat(formData.volumeAmount)
      const pricePerUnit = parseFloat(formData.pricePerUnit)

      // Calculate total price from price per unit
      const totalPrice = volumeAmount * pricePerUnit

      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: formData.status,
        volume: {
          amount: volumeAmount,
          unit: formData.volumeUnit,
          ...(formData.volumeUnit === 'MT' && { total: volumeAmount, available: volumeAmount }),
        },
        pricing: {
          price: totalPrice,
          pricePerUnit: pricePerUnit,
          currency: formData.currency,
          paymentTerms: formData.paymentTerms || undefined,
        },
        delivery: {
          deliveryDate: formData.deliveryDate || undefined,
          deliveryLocation: formData.deliveryLocation || undefined,
          deliveryMethod: formData.deliveryMethod || undefined,
          incoterms: formData.incoterms || undefined,
        },
        compliance: {
          standards: formData.standards ? formData.standards.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
          ghgReduction: formData.ghgReduction ? parseFloat(formData.ghgReduction) : undefined,
        },
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        airlineName: formData.airlineName || undefined,
      }

      // SAF-specific fields (BP-101)
      if (formData.pathway) payload.pathway = formData.pathway
      if (formData.feedstockType) payload.feedstockType = formData.feedstockType
      if (formData.feedstockOrigin) payload.feedstockOrigin = formData.feedstockOrigin
      if (formData.facilityName && formData.facilityLocation && formData.facilityCountry && formData.facilityCapacity && formData.facilityCommissioning) {
        payload.productionFacility = {
          name: formData.facilityName,
          location: formData.facilityLocation,
          country: formData.facilityCountry,
          capacityMTPerYear: parseFloat(formData.facilityCapacity),
          commissioningDate: new Date(formData.facilityCommissioning),
        }
      }
      if (formData.certScheme && formData.certStatus) {
        payload.certifications = [{
          scheme: formData.certScheme,
          status: formData.certStatus,
          ...(formData.certExpectedCompletion && formData.certStatus === 'in_progress' && { expectedCompletion: new Date(formData.certExpectedCompletion) }),
        }]
      }
      if (formData.deliveryAirport && formData.deliveryCountry && formData.deliveryRegion && formData.deliveryAvailableFrom) {
        payload.deliveryLocations = [{
          airport: formData.deliveryAirport.toUpperCase(),
          country: formData.deliveryCountry,
          region: formData.deliveryRegion,
          availableFrom: new Date(formData.deliveryAvailableFrom),
        }]
      }
      if (formData.lcaCoreValue && formData.lcaTotalValue && formData.lcaReductionPercent) {
        payload.lcaData = {
          coreValue: parseFloat(formData.lcaCoreValue),
          ilucValue: parseFloat(formData.lcaIlucValue || '0'),
          totalLifecycleValue: parseFloat(formData.lcaTotalValue),
          reductionPercent: parseFloat(formData.lcaReductionPercent),
          methodology: formData.lcaMethodology as 'ICAO_CORSIA' | 'EU_RED' | 'RSB',
          referenceYear: parseInt(formData.lcaReferenceYear, 10),
        }
      }

      const url = lot ? `/api/lots/${lot._id}` : '/api/lots'
      const method = lot ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload as object),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save lot')
      }

      const data = await response.json()
      onSuccess(data.lot)
    } catch (error: any) {
      console.error('Error saving lot:', error)
      alert(error.message || 'Failed to save lot')
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-900">{lot ? 'Edit Lot' : 'Post New Lot'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="lot-title" className="block text-sm font-medium text-slate-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="lot-title"
                type="text"
                required
                autoFocus
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="e.g., Premium SAF Lot - ISCC Certified"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="lot-description" className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea
                id="lot-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="Describe the lot, specifications, and any relevant details..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="spot_volume">Spot Volume</option>
                <option value="forward_commitment">Forward Commitment</option>
                <option value="offtake_agreement">Offtake Agreement</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="draft" className="text-slate-900">Draft</option>
                <option value="published" className="text-slate-900">Published</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Volume Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.volumeAmount}
                onChange={(e) => setFormData({ ...formData, volumeAmount: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Volume Unit <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.volumeUnit}
                onChange={(e) => setFormData({ ...formData, volumeUnit: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="gallons">Gallons</option>
                <option value="liters">Liters</option>
                <option value="metric-tons">Metric Tons</option>
                <option value="MT">MT (Metric Tonnes)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Price per {formData.volumeUnit} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.pricePerUnit}
                  onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="5.00"
                />
                {formData.pricePerUnit && formData.volumeAmount && (
                  <p className="mt-1 text-xs text-slate-500">
                    Total: {formData.currency} {(parseFloat(formData.pricePerUnit) * parseFloat(formData.volumeAmount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="USD" className="text-slate-900">USD</option>
                <option value="EUR" className="text-slate-900">EUR</option>
                <option value="GBP" className="text-slate-900">GBP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Terms</label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="e.g., Net 30, Letter of Credit"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Delivery Date</label>
              <input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Delivery Location</label>
              <input
                type="text"
                value={formData.deliveryLocation}
                onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="e.g., JFK Airport, New York"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Compliance Standards</label>
              <input
                type="text"
                value={formData.standards}
                onChange={(e) => setFormData({ ...formData, standards: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="e.g., ISCC, RSB, CORSIA (comma-separated)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">GHG Reduction (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.ghgReduction}
                onChange={(e) => setFormData({ ...formData, ghgReduction: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="e.g., 80"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Airline Name</label>
              <input
                type="text"
                value={formData.airlineName}
                onChange={(e) => setFormData({ ...formData, airlineName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="e.g., Aeronomy Airlines"
              />
            </div>

            {/* SAF Details Section (BP-101) */}
            <div className="sm:col-span-2 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => setSafSectionOpen(!safSectionOpen)}
                className="flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-slate-900"
              >
                {safSectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                SAF Details (Pathway, LCA, Certifications)
              </button>
              {safSectionOpen && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Pathway</label>
                    <select
                      value={formData.pathway}
                      onChange={(e) => setFormData({ ...formData, pathway: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="">—</option>
                      {PATHWAYS.map((p) => (
                        <option key={p} value={p}>{p.replace('_', '-')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Feedstock Type</label>
                    <input
                      type="text"
                      value={formData.feedstockType}
                      onChange={(e) => setFormData({ ...formData, feedstockType: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="e.g., Agricultural residues"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Feedstock Origin</label>
                    <input
                      type="text"
                      value={formData.feedstockOrigin}
                      onChange={(e) => setFormData({ ...formData, feedstockOrigin: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="e.g., Maharashtra, India"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Facility Name</label>
                    <input
                      type="text"
                      value={formData.facilityName}
                      onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="e.g., Maharashtra Plant"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Facility Location</label>
                    <input
                      type="text"
                      value={formData.facilityLocation}
                      onChange={(e) => setFormData({ ...formData, facilityLocation: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="e.g., Maharashtra"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Facility Country</label>
                    <input
                      type="text"
                      value={formData.facilityCountry}
                      onChange={(e) => setFormData({ ...formData, facilityCountry: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="e.g., India"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Capacity (MT/year)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.facilityCapacity}
                      onChange={(e) => setFormData({ ...formData, facilityCapacity: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Commissioning Date</label>
                    <input
                      type="date"
                      value={formData.facilityCommissioning}
                      onChange={(e) => setFormData({ ...formData, facilityCommissioning: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Certification Scheme</label>
                    <select
                      value={formData.certScheme}
                      onChange={(e) => setFormData({ ...formData, certScheme: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="">—</option>
                      {CERT_SCHEMES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Certification Status</label>
                    <select
                      value={formData.certStatus}
                      onChange={(e) => setFormData({ ...formData, certStatus: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 [&>option]:bg-white [&>option]:text-slate-900"
                    >
                      <option value="">—</option>
                      {CERT_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-white text-slate-900">{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  {formData.certStatus === 'in_progress' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Expected Completion</label>
                      <input
                        type="date"
                        value={formData.certExpectedCompletion}
                        onChange={(e) => setFormData({ ...formData, certExpectedCompletion: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Delivery Airport (ICAO)</label>
                    <input
                      type="text"
                      value={formData.deliveryAirport}
                      onChange={(e) => setFormData({ ...formData, deliveryAirport: e.target.value.toUpperCase() })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="e.g., EDDF"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Delivery Country</label>
                    <input
                      type="text"
                      value={formData.deliveryCountry}
                      onChange={(e) => setFormData({ ...formData, deliveryCountry: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="e.g., Germany"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Delivery Region</label>
                    <select
                      value={formData.deliveryRegion}
                      onChange={(e) => setFormData({ ...formData, deliveryRegion: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      {DELIVERY_REGIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Available From</label>
                    <input
                      type="date"
                      value={formData.deliveryAvailableFrom}
                      onChange={(e) => setFormData({ ...formData, deliveryAvailableFrom: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">LCA Core Value (gCO2e/MJ)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.lcaCoreValue}
                      onChange={(e) => setFormData({ ...formData, lcaCoreValue: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="e.g., 7.7"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">LCA ILUC Value</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.lcaIlucValue}
                      onChange={(e) => setFormData({ ...formData, lcaIlucValue: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">LCA Total (gCO2e/MJ)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.lcaTotalValue}
                      onChange={(e) => setFormData({ ...formData, lcaTotalValue: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="e.g., 7.7"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Emission Reduction (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.lcaReductionPercent}
                      onChange={(e) => setFormData({ ...formData, lcaReductionPercent: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="e.g., 91.3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">LCA Methodology</label>
                    <select
                      value={formData.lcaMethodology}
                      onChange={(e) => setFormData({ ...formData, lcaMethodology: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="ICAO_CORSIA">ICAO CORSIA</option>
                      <option value="EU_RED">EU RED</option>
                      <option value="RSB">RSB</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Reference Year</label>
                    <input
                      type="number"
                      value={formData.lcaReferenceYear}
                      onChange={(e) => setFormData({ ...formData, lcaReferenceYear: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : lot ? 'Update Lot' : 'Post Lot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

