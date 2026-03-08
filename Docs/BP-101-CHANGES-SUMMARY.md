# BP-101: Lot Model Refactor — Complete Changes Summary

**Ticket:** BP-101 — Trading to Supply Listing  
**Sprint:** 1  
**Date:** March 2026  

---

## Overview

Refactored the Lot model from generic commodity trading to SAF-specific supply listings. Every lot now carries regulatory identity: pathway, feedstock, certification status, LCA values, and compliance eligibility.

---

## 1. Model Changes (`models/Lot.ts`)

### Type Rename
| Old | New |
|-----|-----|
| `spot` | `spot_volume` |
| `forward` | `forward_commitment` |
| `contract` | `offtake_agreement` |

### New Fields (all optional for backward compatibility)
- **pathway** — ASTM D7566 pathway (FT_SPK, HEFA_SPK, ATJ_SPK, etc.)
- **feedstockType** — e.g. "Agricultural residues"
- **feedstockOrigin** — e.g. "Maharashtra, India"
- **productionFacility** — name, location, country, capacityMTPerYear, commissioningDate
- **certifications[]** — scheme, status (certified/in_progress/not_started), expectedCompletion, certificateNumber, certExpiry
- **deliveryLocations[]** — airport (ICAO), country, region (EU/UK/US/ME/APAC), availableFrom
- **lcaData** — coreValue, ilucValue, totalLifecycleValue, reductionPercent, methodology, referenceYear
- **complianceEligibility** — refueleu, corsia, ukRtfo, euEts, derivedAt (derived on save)

### Volume Schema
- Added optional `total` and `available` for MT units

### Logic
- Pre-save: normalizes legacy type values to new values
- Pre-save: derives `complianceEligibility` from pathway + certifications + deliveryLocations
- Schema accepts both old and new type values for migration

### complianceEligibility Derivation (explicit logic)
```ts
// corsia: true if ANY cert has CORSIA-eligible scheme (ISCC_CORSIA, RSB_CORSIA, CLASSNK_CORSIA)
// Does NOT check cert status — in_progress counts. E2E-02: Yoki (in_progress) appears under corsiaEligible filter.
hasCorsiaCert = certifications.some(c => CORSIA_SCHEMES.has(c.scheme))
corsia: !!hasCorsiaCert

// refueleu: pathway approved + (cert certified OR in_progress) + Union airport delivery
hasCertifiedOrInProgress = certifications.some(c => c.status === 'certified' || c.status === 'in_progress')
refueleu: pathwayApproved && hasCertifiedOrInProgress && hasUnionDelivery

// certified-only filter uses certifications.status, NOT complianceEligibility.corsia
// Filter certificationStatus='certified' → Yoki disappears (status is in_progress)
// Filter corsiaEligible=true → Yoki appears (scheme is ISCC_CORSIA)
```

### Indexes Added
- pathway, certifications.scheme+status, complianceEligibility.corsia/refueleu
- deliveryLocations.region/availableFrom
- volume.available (sparse — excludes docs where available is null/absent)

---

## 2. Client-Safe Utilities (`lib/lots/utils.ts`)

**Purpose:** Avoid importing Mongoose in client components (fixes "Cannot read properties of undefined (reading 'Lot')").

### Exports
- `LEGACY_TYPE_MAP` — spot → spot_volume, etc.
- `TYPE_TO_LEGACY` — spot_volume → spot (for webhook backward compat)
- `LotType` — type alias
- `getTypeLabel(type)` — human-readable type label
- `getPathwayLabel(pathway)` — e.g. FT_SPK → "FT-SPK"
- `getCertificationStatusBadge(status)` — returns `{ label, className }` for badges

---

## 3. Lot Service (`lib/lots/service.ts`)

- Type filter accepts both legacy and new values
- New filters: `pathway`, `certificationStatus`, `corsiaEligible`, `refueleuEligible`
- Imports `LEGACY_TYPE_MAP`, `TYPE_TO_LEGACY` from utils

---

## 4. Webhook (`lib/webhooks/lot-webhook.ts`)

- **Backward compatible:** Sends type as legacy (spot/forward/contract) for producer portal
- **Additive:** Includes pathway, feedstockType, feedstockOrigin, certifications, lcaData, complianceEligibility when present
- Volume payload includes total/available when set

---

## 5. API Routes

### `app/api/lots/route.ts`
- Added query params: pathway, certificationStatus, corsiaEligible, refueleuEligible

### `app/api/lots/external/route.ts`
- Same new filter params for external/Producer Dashboard consumers

---

## 6. UI Components

### LotForm.tsx
- Type dropdown: new values (spot_volume, forward_commitment, offtake_agreement)
- Volume unit: added MT (Metric Tonnes)
- **SAF Details** collapsible section: pathway, feedstock, facility, certifications, delivery locations, LCA data
- Import: `LEGACY_TYPE_MAP` from `@/lib/lots/utils` (not models/Lot)
- All inputs: `text-slate-900` for visible typed text
- Certification Status select: explicit option styling for visible dropdown text

### LotCard.tsx
- Pathway badge: `bg-indigo-100 text-indigo-900`
- Certification status badge from `getCertificationStatusBadge()`
- Volume: uses `available ?? total ?? amount`
- Emission reduction % from lcaData or compliance

### LotDetail.tsx
- Pathway, certification badges in header
- **SAF Product Details** section: pathway, feedstock, facility, compliance eligibility
- Volume/pricing: optional chaining (`?.`) to prevent undefined errors
- Labels: `text-slate-600 font-medium` for better contrast
- Compliance eligibility badges: `*-200 text-*-900`
- Certification chips: `bg-slate-200 text-slate-800`

---

## 7. Badge Color Updates (Contrast Fix)

| Element | Before | After |
|---------|--------|-------|
| Pathway | bg-slate-100 text-slate-700 | bg-indigo-100 text-indigo-900 |
| Certified | bg-green-100 text-green-800 | bg-green-200 text-green-900 |
| In Progress | bg-amber-100 text-amber-800 | bg-amber-200 text-amber-900 |
| Not Started | bg-slate-100 text-slate-600 | bg-slate-200 text-slate-800 |
| ReFuelEU/CORSIA/UK RTFO | *-100 text-*-700 | *-200 text-*-900 |

---

## 8. Global CSS (`app/globals.css`)

```css
select option {
  background-color: white !important;
  color: #0f172a !important;
}
```
Ensures select dropdown options have visible text across browsers/OS.

---

## 9. Migration Script (`scripts/migrate-lot-bp101.ts`)

- Sets `complianceEligibility` to default (all false) on existing lots
- Migrates type enum: spot → spot_volume, etc.
- Run: `npm run migrate:lot-bp101`

---

## 10. Bug Fixes Applied

| Issue | Fix |
|-------|-----|
| `Cannot read properties of undefined (reading 'Lot')` | Moved LEGACY_TYPE_MAP to utils; LotForm imports from utils |
| `Cannot read properties of undefined (reading 'toLocaleString')` | Optional chaining on lot.volume, lot.pricing in LotDetail |
| Invisible badge/label text | Darker badge colors, explicit text-slate-900 on form inputs |
| Invisible dropdown options | Global CSS for select option, explicit option classes |

---

## Files Modified

| File | Changes |
|------|---------|
| `models/Lot.ts` | Full refactor, new fields, derivation logic |
| `lib/lots/utils.ts` | New file; client-safe constants and helpers |
| `lib/lots/service.ts` | Type filter, new filters |
| `lib/webhooks/lot-webhook.ts` | Backward-compatible payload |
| `app/api/lots/route.ts` | New filter params |
| `app/api/lots/external/route.ts` | New filter params |
| `components/marketplace/LotForm.tsx` | SAF section, type rename, styling |
| `components/marketplace/LotCard.tsx` | New badges, volume display |
| `components/marketplace/LotDetail.tsx` | SAF section, null safety, contrast |
| `app/globals.css` | Select option visibility |
| `scripts/migrate-lot-bp101.ts` | New migration script |
| `package.json` | migrate:lot-bp101 script |

---

## Pre-Close Verification (Done)

### 1. complianceEligibility.corsia vs certifications.status
- **corsia** = scheme presence (ISCC_CORSIA, RSB_CORSIA, etc.) — status ignored. Yoki (in_progress) gets corsia: true.
- **certificationStatus filter** = certifications[0].status. Yoki disappears when filter=certified.
- E2E-02: Yoki appears under corsiaEligible, disappears under certified-only ✓

### 2. Type filter — no hardcoded legacy strings
- Grep of app/api and lib/ found no `query.type = 'spot'` or similar. Lot service uses LEGACY_TYPE_MAP to expand filter.
- Migration is one-way (DB: legacy → new). API accepts both; service expands legacy filter to match new values.
- certificates/service.ts `type` filter is for Certificate model, not Lot.

### 3. volume.available index — sparse
- Index changed to `{ sparse: true }` so docs without volume.available are excluded from index.
- Avoids skewing BP-307 volume range queries with null entries.

---

## Downstream Dependencies

- **BP-307** (Supply Discovery) — Uses new fields and indexes
- **BP-309** (Contract Builder) — GHG preview uses lcaData.reductionPercent
- **BP-401** (Seed Data) — Yoki seed lot uses all new fields
- **BP-102** (Producer Profile) — Shares field vocabulary
