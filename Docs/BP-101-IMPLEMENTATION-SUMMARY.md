# BP-101: Lot Model Refactor — Implementation Summary

**Ticket:** BP-101  
**Sprint:** 1  
**Status:** Complete  
**Date:** March 2026  

---

## Summary

The Lot model has been refactored from a generic commodity trading unit to a **SAF-specific supply listing**. Every listing now carries its regulatory identity: pathway, feedstock, certification status, LCA values, and compliance eligibility.

---

## Changes Made

### 1. Model (`models/Lot.ts`)

| Change | Details |
|--------|---------|
| **Type rename** | `spot` → `spot_volume`, `forward` → `forward_commitment`, `contract` → `offtake_agreement` |
| **Legacy support** | Schema accepts both old and new type values; pre-save normalizes to new values |
| **`pathway`** | Enum: FT_SPK, HEFA_SPK, ATJ_SPK, HFS_SIP, CHJ, HC_HEFA_SPK, PTL, CO_PROCESSING, OTHER |
| **`feedstockType`** | String (e.g., "Agricultural residues") |
| **`feedstockOrigin`** | String (e.g., "Maharashtra, India") |
| **`productionFacility`** | { name, location, country, capacityMTPerYear, commissioningDate } |
| **`certifications`** | Array of { scheme, status, expectedCompletion?, certificateNumber?, certExpiry? } |
| **`deliveryLocations`** | Array of { airport, country, region, availableFrom } |
| **`lcaData`** | { coreValue, ilucValue, totalLifecycleValue, reductionPercent, methodology, referenceYear } |
| **`complianceEligibility`** | Derived: { refueleu, corsia, ukRtfo, euEts, derivedAt } |
| **`volume`** | Added optional `total` and `available` for MT units |

**`complianceEligibility` derivation (on write):**
- `refueleu`: pathway ASTM-approved + (cert certified or in_progress) + delivery includes Union airport
- `corsia`: certification scheme includes ISCC_CORSIA or RSB_CORSIA
- `ukRtfo`: pathway approved + delivery includes UK airport
- `euEts`: false for MVP

### 2. Indexes

Added for supply discovery filters (BP-307):
- `pathway`, `certifications.scheme` + `certifications.status`, `complianceEligibility.corsia`, `complianceEligibility.refueleu`, `deliveryLocations.region`, `deliveryLocations.availableFrom`, `volume.available`

### 3. Webhook (`lib/webhooks/lot-webhook.ts`)

- **Backward compatible:** type sent as legacy (`spot`/`forward`/`contract`) for producer portal
- **Additive:** new fields (pathway, feedstockType, certifications, lcaData, complianceEligibility) included when present

### 4. Lot Service (`lib/lots/service.ts`)

- Type filter accepts both legacy and new values
- New filters: `pathway`, `certificationStatus`, `corsiaEligible`, `refueleuEligible`

### 5. UI Components

- **LotForm:** Type dropdown with new values; collapsible "SAF Details" section (pathway, feedstock, facility, certifications, delivery locations, LCA data)
- **LotCard:** Pathway badge, certification status badge, LCA reduction %
- **LotDetail:** Full SAF product details, compliance eligibility badges

### 6. Migration Script (`scripts/migrate-lot-bp101.ts`)

- Sets `complianceEligibility` to `{ refueleu: false, corsia: false, ukRtfo: false, euEts: false }` on existing lots
- Migrates type enum: `spot` → `spot_volume`, etc.

**Run:** `npm run migrate:lot-bp101`

---

## Files Modified

- `models/Lot.ts` — Full refactor
- `lib/lots/service.ts` — Type filter, new filters
- `lib/lots/utils.ts` — **New:** getTypeLabel, getPathwayLabel, getCertificationStatusBadge
- `lib/webhooks/lot-webhook.ts` — Backward-compatible payload
- `components/marketplace/LotForm.tsx` — SAF fields
- `components/marketplace/LotCard.tsx` — New badges
- `components/marketplace/LotDetail.tsx` — SAF details section
- `scripts/migrate-lot-bp101.ts` — **New:** migration
- `package.json` — migrate:lot-bp101 script

---

## Yoki Acceptance Test

Create a lot with:

```json
{
  "type": "offtake_agreement",
  "pathway": "FT_SPK",
  "feedstockType": "Agricultural residues",
  "feedstockOrigin": "Maharashtra, India",
  "productionFacility": {
    "name": "Maharashtra Plant",
    "location": "Maharashtra",
    "country": "India",
    "capacityMTPerYear": 50000,
    "commissioningDate": "2027-03-01"
  },
  "certifications": [{
    "scheme": "ISCC_CORSIA",
    "status": "in_progress",
    "expectedCompletion": "2027-03-01"
  }],
  "deliveryLocations": [{
    "airport": "EDDF",
    "country": "Germany",
    "region": "EU",
    "availableFrom": "2027-04-01"
  },
  {
    "airport": "EGLL",
    "country": "UK",
    "region": "UK",
    "availableFrom": "2027-04-01"
  }],
  "lcaData": {
    "coreValue": 7.7,
    "ilucValue": 0,
    "totalLifecycleValue": 7.7,
    "reductionPercent": 91.3,
    "methodology": "ICAO_CORSIA",
    "referenceYear": 2024
  },
  "volume": { "amount": 50000, "total": 50000, "available": 50000, "unit": "MT" }
}
```

**Expected:** `complianceEligibility` = { refueleu: true, corsia: true, ukRtfo: true, euEts: false }

---

## Downstream Dependencies

- **BP-307** (Supply Discovery) — Uses new fields and indexes
- **BP-309** (Contract Builder) — GHG preview uses `lcaData.reductionPercent`
- **BP-401** (Seed Data) — Yoki seed lot uses all new fields
- **BP-102** (Producer Profile) — Shares field vocabulary
