'use client'

import React, { useState } from 'react'
import { X, Mail, Building2, ChevronDown, ChevronRight, TrendingDown, Factory, Leaf, Award, Truck, BarChart3, Globe, MapPin, CheckCircle2 } from 'lucide-react'
import type { ProducerOrganizationProfile } from '@/models/producer-organization-profile.types'

interface Producer {
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
  profile?: ProducerOrganizationProfile
}

interface Props {
  producer: Producer
  onClose: () => void
}

function formatMT(n: number | undefined): string {
  if (n == null) return ''
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k MT` : `${n} MT`
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-bold text-slate-900 text-lg">{value}</p>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value?: string | number | null | unknown }) {
  const display =
    value == null || value === ''
      ? '—'
      : Array.isArray(value)
        ? value.length ? value.join(', ') : '—'
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value)
  const isEmpty = display === '—'
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className={`text-sm text-right font-medium ${isEmpty ? 'text-slate-400 italic' : 'text-slate-900'}`}>{display}</span>
    </div>
  )
}

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-left">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-500" />
          <span className="font-semibold text-slate-900">{title}</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
      </button>
      {open && <div className="p-4 bg-white border-t border-slate-200">{children}</div>}
    </div>
  )
}

export default function ProducerDetailContent({ producer, onClose }: Props) {
  const p = producer.profile
  const legal = p?.legalIdentity
  const displayName = producer.name || legal?.organizationName || legal?.displayName || 'Unnamed Producer'
  const displayEmail = producer.companyEmail || legal?.primaryContactEmail || producer.primaryContact?.email
  const legalName = producer.legalName || legal?.legalEntityName
  const displayAddress = producer.address || legal?.businessAddress
  const displayWebsite = producer.website || legal?.website
  const displayContact = producer.userName || legal?.primaryContactName || producer.primaryContact?.name
  const summary = legal?.summary
  const capacityMT = p?.totalNameplateCapacityMTPerYear ?? p?.totalExpectedAvailableVolumeMTPerYear ?? p?.uncommittedVolumeMTPerYear
  const availableMT = p?.commercial?.availableVolumeMT ?? p?.derived?.headlineAvailableVolumeMT
  const pathway = p?.derived?.headlinePathway || p?.pathways?.[0]
  const feedstock = p?.derived?.headlineFeedstock || p?.feedstocks?.[0]
  const certCount = p?.certifications?.length ?? 0
  const facilityCount = p?.facilities?.length ?? 0
  const deliveryDate = p?.earliestDeliveryDate ?? p?.logistics?.earliestDeliveryDate ?? p?.complianceTimelines?.firstComplianceEligibleDeliveryDate
  const orgType = p?.legalIdentity?.orgType || producer.organizationType || 'SAF Producer'

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A')

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Producer Details</h2>
              <p className="text-xs text-slate-500">Org ID: {producer.organizationId || producer._id || '—'}</p>
            </div>
          </div>
          {displayEmail && (
            <a href={`mailto:${displayEmail}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium">
              <Mail className="h-4 w-4" />
              Contact
            </a>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Hero */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <div className="flex items-start gap-4">
              {producer.branding?.logo ? (
                <img src={producer.branding.logo} alt="" className="w-16 h-16 rounded-lg object-contain bg-white border border-slate-200" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-slate-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">{displayName}</h1>
                {legalName && legalName !== displayName && <p className="text-sm text-slate-600">{legalName}</p>}
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide">{orgType}</span>
                {summary && <p className="mt-3 text-sm text-slate-600 leading-relaxed">{summary}</p>}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={BarChart3} label="Capacity" value={formatMT(capacityMT) || 'N/A'} />
            <StatCard icon={TrendingDown} label="Available" value={formatMT(availableMT) || 'N/A'} />
            <StatCard icon={Factory} label="Facilities" value={facilityCount} />
            <StatCard icon={Award} label="Certifications" value={certCount} />
          </div>
          {!p && (
            <p className="text-sm text-slate-500 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
              Profile data (capacity, facilities, certifications) will appear when the producer completes their portal setup.
            </p>
          )}

          {/* Collapsible Sections */}
          <CollapsibleSection title="Legal Identity" icon={Building2} defaultOpen>
            <div className="space-y-1">
              {/*
                Match ProducerCard + API: prefer top-level fields synced on ProducerOrganization
                (address, website, contacts) over profile.legalIdentity, which can lag on partial portal updates.
              */}
              <FieldRow label="Organization Name" value={producer.name || legal?.organizationName || legal?.displayName} />
              <FieldRow label="Legal Entity" value={producer.legalName || legal?.legalEntityName} />
              <FieldRow label="Display Name" value={legal?.displayName} />
              <FieldRow label="Org Type" value={legal?.orgType ?? producer.organizationType} />
              <FieldRow label="Headquarters" value={legal?.headquartersCountry} />
              <FieldRow label="Registered Country" value={legal?.registeredCountry} />
              <FieldRow label="Address" value={producer.address || legal?.businessAddress} />
              <FieldRow label="Website" value={producer.website || legal?.website} />
              <FieldRow label="Primary Contact" value={producer.userName || legal?.primaryContactName || producer.primaryContact?.name} />
              <FieldRow label="Contact Email" value={producer.companyEmail || legal?.primaryContactEmail || producer.primaryContact?.email} />
              <FieldRow label="Contact Role" value={legal?.primaryContactRole} />
              {legal?.summary && <p className="text-sm text-slate-600 pt-2">{legal.summary}</p>}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Organization & Capacity" icon={BarChart3} defaultOpen>
            <div className="space-y-1">
              <FieldRow label="Org ID" value={p?.orgId ?? producer.organizationId ?? producer._id} />
              <FieldRow label="Total Nameplate Capacity" value={p?.totalNameplateCapacityMTPerYear != null ? formatMT(p.totalNameplateCapacityMTPerYear) : undefined} />
              <FieldRow label="Expected Available Volume" value={p?.totalExpectedAvailableVolumeMTPerYear != null ? formatMT(p.totalExpectedAvailableVolumeMTPerYear) : undefined} />
              <FieldRow label="Current Operational Capacity" value={p?.currentOperationalCapacityMTPerYear != null ? formatMT(p.currentOperationalCapacityMTPerYear) : undefined} />
              <FieldRow label="Committed Volume" value={p?.committedVolumeMTPerYear != null ? formatMT(p.committedVolumeMTPerYear) : undefined} />
              <FieldRow label="Uncommitted Volume" value={p?.uncommittedVolumeMTPerYear != null ? formatMT(p.uncommittedVolumeMTPerYear) : undefined} />
              <FieldRow label="Pathways" value={p?.pathways} />
              <FieldRow label="Feedstocks" value={p?.feedstocks} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Facilities" icon={Factory} defaultOpen={Boolean(p?.facilities?.length)}>
            {p?.facilities && p.facilities.length > 0 ? (
              <div className="space-y-4">
                {p.facilities.map((f, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-900">{f.facilityName || `Facility ${i + 1}`}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <FieldRow label="Location" value={[f.city, f.stateOrRegion, f.country].filter(Boolean).join(', ')} />
                      <FieldRow label="Capacity" value={f.nameplateCapacityMTPerYear != null ? formatMT(f.nameplateCapacityMTPerYear) : undefined} />
                      <FieldRow label="Expected Available" value={f.expectedAvailableVolumeMTPerYear != null ? formatMT(f.expectedAvailableVolumeMTPerYear) : undefined} />
                      <FieldRow label="Commissioning Status" value={f.commissioningStatus} />
                      <FieldRow label="FID Status" value={f.fidStatus} />
                      <FieldRow label="Pathways" value={f.pathwaysProduced?.join(', ')} />
                      <FieldRow label="Feedstocks" value={f.feedstocksUsed?.join(', ')} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-2">No facilities recorded</p>
            )}
          </CollapsibleSection>

          {p?.feedstockProfile && p.feedstockProfile.length > 0 && (
            <CollapsibleSection title="Feedstock Profile" icon={Leaf}>
              <div className="space-y-4">
                {p.feedstockProfile.map((f, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-900">{f.feedstockType || `Feedstock ${i + 1}`}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <FieldRow label="Category" value={f.category} />
                      <FieldRow label="Origin" value={f.originCountry || f.originRegion} />
                      <FieldRow label="Annual Requirement" value={f.annualRequirementTonnes != null ? `${f.annualRequirementTonnes} tonnes` : undefined} />
                      <FieldRow label="Secured" value={f.securedTonnes != null ? `${f.securedTonnes} tonnes (${f.securedPercent ?? ''}%)` : undefined} />
                      <FieldRow label="Waste/Residue" value={f.feedstockIsWasteResidue != null ? (f.feedstockIsWasteResidue ? 'Yes' : 'No') : undefined} />
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {p?.products && p.products.length > 0 && (
            <CollapsibleSection title="Products" icon={BarChart3}>
              <div className="space-y-4">
                {p.products.map((prod, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-900">{prod.productName || `Product ${i + 1}`}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <FieldRow label="Pathway" value={prod.pathway} />
                      <FieldRow label="Feedstock" value={prod.feedstockType} />
                      <FieldRow label="ASTM Standard" value={prod.astmStandard} />
                      <FieldRow label="Max Blend %" value={prod.maxBlendPercentage} />
                      <FieldRow label="Book & Claim" value={prod.bookAndClaimEligible != null ? (prod.bookAndClaimEligible ? 'Yes' : 'No') : undefined} />
                      <FieldRow label="Physical Delivery" value={prod.physicalDeliveryAvailable != null ? (prod.physicalDeliveryAvailable ? 'Yes' : 'No') : undefined} />
                      {prod.lca?.reductionPercentVsFossilBaseline != null && <FieldRow label="GHG Reduction" value={`${prod.lca.reductionPercentVsFossilBaseline}%`} />}
                      {prod.complianceEligibility && (
                        <div className="pt-2">
                          <p className="text-xs text-slate-500 mb-1">Compliance</p>
                          <div className="flex flex-wrap gap-2">
                            {prod.complianceEligibility.corsiaEligible && <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">CORSIA</span>}
                            {prod.complianceEligibility.refuelEUEligible && <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">ReFuelEU</span>}
                            {prod.complianceEligibility.ukRTFOEligible && <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs">UK RTFO</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {p?.certifications && p.certifications.length > 0 && (
            <CollapsibleSection title="Certifications" icon={Award} defaultOpen>
              <div className="space-y-3">
                {p.certifications.map((c, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{c.scheme || 'Certification'}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.status === 'certified' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{c.status || 'N/A'}</span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <FieldRow label="Scope" value={c.scope} />
                      <FieldRow label="Certification Body" value={c.certificationBody} />
                      <FieldRow label="Certificate #" value={c.certificateNumber} />
                      <FieldRow label="Issue Date" value={c.issueDate ? formatDate(c.issueDate) : undefined} />
                      <FieldRow label="Expiry Date" value={c.expiryDate ? formatDate(c.expiryDate) : undefined} />
                      <FieldRow label="Expected Completion" value={c.expectedCompletionDate ? formatDate(c.expectedCompletionDate) : undefined} />
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          <CollapsibleSection title="Compliance Timelines" icon={CheckCircle2}>
            <div className="space-y-1">
              <FieldRow label="First Book & Claim" value={p?.complianceTimelines?.firstBookAndClaimDeliveryDate ? formatDate(p.complianceTimelines.firstBookAndClaimDeliveryDate) : undefined} />
              <FieldRow label="First Physical Delivery" value={p?.complianceTimelines?.firstPhysicalDeliveryDate ? formatDate(p.complianceTimelines.firstPhysicalDeliveryDate) : undefined} />
              <FieldRow label="First Compliance Eligible" value={p?.complianceTimelines?.firstComplianceEligibleDeliveryDate ? formatDate(p.complianceTimelines.firstComplianceEligibleDeliveryDate) : undefined} />
              <FieldRow label="First CORSIA Eligible" value={p?.complianceTimelines?.firstCORSIAEligibleDeliveryDate ? formatDate(p.complianceTimelines.firstCORSIAEligibleDeliveryDate) : undefined} />
              <FieldRow label="First ReFuelEU Eligible" value={p?.complianceTimelines?.firstReFuelEUEligibleDeliveryDate ? formatDate(p.complianceTimelines.firstReFuelEUEligibleDeliveryDate) : undefined} />
              <FieldRow label="First UK RTFO Eligible" value={p?.complianceTimelines?.firstUKRTFOEligibleDeliveryDate ? formatDate(p.complianceTimelines.firstUKRTFOEligibleDeliveryDate) : undefined} />
              <FieldRow label="PoS Readiness" value={p?.complianceTimelines?.proofOfSustainabilityReadinessDate ? formatDate(p.complianceTimelines.proofOfSustainabilityReadinessDate) : undefined} />
            </div>
          </CollapsibleSection>

          {p?.frameworkTimelines && (
            <CollapsibleSection title="Framework Timelines" icon={CheckCircle2}>
              <div className="space-y-4">
                {p.frameworkTimelines.corsia && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-semibold text-slate-900 mb-2">CORSIA</p>
                    <FieldRow label="Readiness" value={p.frameworkTimelines.corsia.readinessStatus} />
                    <FieldRow label="Target Date" value={p.frameworkTimelines.corsia.targetEligibilityDate ? formatDate(p.frameworkTimelines.corsia.targetEligibilityDate) : undefined} />
                  </div>
                )}
                {p.frameworkTimelines.refuelEU && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-semibold text-slate-900 mb-2">ReFuelEU</p>
                    <FieldRow label="Readiness" value={p.frameworkTimelines.refuelEU.readinessStatus} />
                    <FieldRow label="Target Date" value={p.frameworkTimelines.refuelEU.targetEligibilityDate ? formatDate(p.frameworkTimelines.refuelEU.targetEligibilityDate) : undefined} />
                  </div>
                )}
                {p.frameworkTimelines.ukRTFO && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-semibold text-slate-900 mb-2">UK RTFO</p>
                    <FieldRow label="Readiness" value={p.frameworkTimelines.ukRTFO.readinessStatus} />
                    <FieldRow label="Target Date" value={p.frameworkTimelines.ukRTFO.targetEligibilityDate ? formatDate(p.frameworkTimelines.ukRTFO.targetEligibilityDate) : undefined} />
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {p?.commercial && (
            <CollapsibleSection title="Commercial" icon={BarChart3}>
              <div className="space-y-1">
                <FieldRow label="Status" value={p.commercial.commercialStatus} />
                <FieldRow label="Available Volume" value={p.commercial.availableVolumeMT != null ? formatMT(p.commercial.availableVolumeMT) : undefined} />
                <FieldRow label="Available From" value={p.commercial.availableFromDate ? formatDate(p.commercial.availableFromDate) : undefined} />
                <FieldRow label="Pricing Model" value={p.commercial.pricingModel} />
                <FieldRow label="Contract Types" value={p.commercial.contractTypesSupported?.join(', ')} />
              </div>
            </CollapsibleSection>
          )}

          {p?.logistics && (
            <CollapsibleSection title="Logistics" icon={Truck}>
              <div className="space-y-1">
                <FieldRow label="Delivery Readiness" value={p.logistics.deliveryReadiness} />
                <FieldRow label="Earliest Delivery" value={p.logistics.earliestDeliveryDate ? formatDate(p.logistics.earliestDeliveryDate) : undefined} />
                <FieldRow label="Regions" value={p.logistics.deliveryRegions?.join(', ')} />
                <FieldRow label="Countries" value={p.logistics.deliveryCountries?.join(', ')} />
                <FieldRow label="Book & Claim" value={p.logistics.bookAndClaimSupported != null ? (p.logistics.bookAndClaimSupported ? 'Yes' : 'No') : undefined} />
                <FieldRow label="Physical Delivery" value={p.logistics.physicalDeliveryAvailable != null ? (p.logistics.physicalDeliveryAvailable ? 'Yes' : 'No') : undefined} />
              </div>
            </CollapsibleSection>
          )}

          {p?.projectReadiness && (
            <CollapsibleSection title="Project Readiness" icon={CheckCircle2}>
              <div className="space-y-1">
                <FieldRow label="Project Stage" value={p.projectReadiness.projectStage} />
                <FieldRow label="FID Status" value={p.projectReadiness.fidStatus} />
                <FieldRow label="Feedstock Secured" value={p.projectReadiness.feedstockSecuredPercent != null ? `${p.projectReadiness.feedstockSecuredPercent}%` : undefined} />
                <FieldRow label="Offtake Secured" value={p.projectReadiness.offtakeSecuredPercent != null ? `${p.projectReadiness.offtakeSecuredPercent}%` : undefined} />
              </div>
            </CollapsibleSection>
          )}

          {(p?.keyRisks && p.keyRisks.length > 0) && (
            <CollapsibleSection title="Key Risks" icon={TrendingDown}>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                {p.keyRisks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {p?.supportingDocuments && p.supportingDocuments.length > 0 && (
            <CollapsibleSection title="Supporting Documents" icon={Building2}>
              <div className="space-y-3">
                {p.supportingDocuments.map((d, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-900">{d.title || d.documentType || `Document ${i + 1}`}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <FieldRow label="Type" value={d.documentType} />
                      <FieldRow label="Status" value={d.status} />
                      <FieldRow label="Issue Date" value={d.issueDate ? formatDate(d.issueDate) : undefined} />
                      <FieldRow label="Expiry Date" value={d.expiryDate ? formatDate(d.expiryDate) : undefined} />
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {p?.derived && (
            <CollapsibleSection title="Derived" icon={BarChart3}>
              <div className="space-y-1">
                <FieldRow label="Currently Deliverable" value={p.derived.isCurrentlyDeliverable != null ? (p.derived.isCurrentlyDeliverable ? 'Yes' : 'No') : undefined} />
                <FieldRow label="Compliance Eligible Now" value={p.derived.isComplianceEligibleNow != null ? (p.derived.isComplianceEligibleNow ? 'Yes' : 'No') : undefined} />
                <FieldRow label="Pre-Certification Supply" value={p.derived.isPreCertificationSupply != null ? (p.derived.isPreCertificationSupply ? 'Yes' : 'No') : undefined} />
                <FieldRow label="Earliest Compliance Date" value={p.derived.earliestComplianceEligibleDate ? formatDate(p.derived.earliestComplianceEligibleDate) : undefined} />
                <FieldRow label="Headline Reduction" value={p.derived.headlineReductionPercent != null ? `${p.derived.headlineReductionPercent}%` : undefined} />
                <FieldRow label="Headline Pathway" value={p.derived.headlinePathway} />
                <FieldRow label="Headline Feedstock" value={p.derived.headlineFeedstock} />
                <FieldRow label="Headline Volume" value={p.derived.headlineAvailableVolumeMT != null ? formatMT(p.derived.headlineAvailableVolumeMT) : undefined} />
                <FieldRow label="Certification Status" value={p.derived.headlineCertificationStatus} />
                <FieldRow label="Readiness Score" value={p.derived.readinessScore} />
                <FieldRow label="Compliance Readiness" value={p.derived.complianceReadinessScore} />
                <FieldRow label="Delivery Confidence" value={p.derived.deliveryConfidenceScore} />
              </div>
            </CollapsibleSection>
          )}

          {p?.metadata && (
            <CollapsibleSection title="Metadata" icon={Building2}>
              <div className="space-y-1">
                <FieldRow label="Profile Version" value={p.metadata.profileVersion} />
                <FieldRow label="Source" value={p.metadata.source} />
                <FieldRow label="Generated" value={p.metadata.generatedAt ? formatDate(p.metadata.generatedAt) : undefined} />
                <FieldRow label="Updated" value={p.metadata.updatedAt ? formatDate(p.metadata.updatedAt) : undefined} />
              </div>
            </CollapsibleSection>
          )}

          {/* Quick contact / address */}
          {(displayAddress || displayWebsite) && (
            <div className="flex flex-wrap gap-4 pt-4">
              {displayAddress && (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(displayAddress)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600">
                  <MapPin className="h-4 w-4" />
                  {displayAddress}
                </a>
              )}
              {displayWebsite && (
                <a href={displayWebsite.startsWith('http') ? displayWebsite : `https://${displayWebsite}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600">
                  <Globe className="h-4 w-4" />
                  {displayWebsite}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
