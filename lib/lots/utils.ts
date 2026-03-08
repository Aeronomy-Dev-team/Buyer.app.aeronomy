/**
 * Lot display utilities — handles both new (spot_volume) and legacy (spot) type values
 * Client-safe: no mongoose/model imports — safe for 'use client' components
 */

export type LotType = 'spot_volume' | 'forward_commitment' | 'offtake_agreement'

export const LEGACY_TYPE_MAP: Record<string, LotType> = {
  spot: 'spot_volume',
  forward: 'forward_commitment',
  contract: 'offtake_agreement',
}

export const TYPE_TO_LEGACY: Record<LotType, string> = {
  spot_volume: 'spot',
  forward_commitment: 'forward',
  offtake_agreement: 'contract',
}

export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    spot_volume: 'Spot Volume',
    forward_commitment: 'Forward Commitment',
    offtake_agreement: 'Offtake Agreement',
    spot: 'Spot Volume',
    forward: 'Forward Commitment',
    contract: 'Offtake Agreement',
  }
  return labels[type] || type
}

export function getPathwayLabel(pathway: string): string {
  const labels: Record<string, string> = {
    FT_SPK: 'FT-SPK',
    HEFA_SPK: 'HEFA-SPK',
    ATJ_SPK: 'ATJ-SPK',
    HFS_SIP: 'HFS-SIP',
    CHJ: 'CHJ',
    HC_HEFA_SPK: 'HC-HEFA-SPK',
    PTL: 'PTL',
    CO_PROCESSING: 'Co-Processing',
    OTHER: 'Other',
  }
  return labels[pathway] || pathway
}

export function getCertificationStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'certified':
      return { label: 'Certified', className: 'bg-green-200 text-green-900' }
    case 'in_progress':
      return { label: 'In Progress', className: 'bg-amber-200 text-amber-900' }
    case 'not_started':
      return { label: 'Not Started', className: 'bg-slate-200 text-slate-800' }
    default:
      return { label: status, className: 'bg-slate-200 text-slate-800' }
  }
}
