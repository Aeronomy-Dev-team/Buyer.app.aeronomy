# BP-101: User Story for Testing Implementation

---

## User Story 1: Create Yoki-Style SAF Lot (Full Acceptance Test)

**As a** SAF producer (or buyer portal admin creating a lot on behalf of a producer)  
**I want to** create a lot with full SAF-specific details (pathway, feedstock, facility, certifications, LCA)  
**So that** buyers can discover supply with compliance-aware filters and see accurate GHG reduction data  

### Preconditions
- User is authenticated and belongs to a producer organization
- User has access to the dashboard (My Listings or SAF Marketplace)

### Steps

1. **Navigate to create lot**
   - Go to Dashboard → My Listings (or SAF Marketplace for producers)
   - Click "Post New Lot" or equivalent CTA

2. **Fill basic details**
   - Title: `Yoki Green Energy — 50K MT FT-SPK Offtake`
   - Description: `Long-term offtake agreement for FT-SPK from agricultural residues`
   - Type: Select **Offtake Agreement**
   - Status: **Draft** (or **Published** for immediate visibility)
   - Volume: `50000`, Unit: **MT (Metric Tonnes)**
   - Price per MT: `1800`, Currency: **USD**

3. **Expand SAF Details section**
   - Click "SAF Details (Pathway, LCA, Certifications)"
   - Pathway: **FT_SPK**
   - Feedstock Type: `Agricultural residues`
   - Feedstock Origin: `Maharashtra, India`

4. **Production facility**
   - Facility Name: `Maharashtra Plant`
   - Facility Location: `Maharashtra`
   - Facility Country: `India`
   - Capacity (MT/year): `50000`
   - Commissioning Date: `2027-03-01`

5. **Certifications**
   - Certification Scheme: **ISCC_CORSIA**
   - Certification Status: **In Progress**
   - Expected Completion: `2027-03-01`

6. **Delivery locations**
   - Delivery Airport (ICAO): `EDDF`
   - Delivery Country: `Germany`
   - Delivery Region: **EU**
   - Available From: `2027-04-01`
   - *(Optional: add second location EGLL, UK, UK, 2027-04-01)*

7. **LCA data**
   - LCA Core Value (gCO2e/MJ): `7.7`
   - LCA ILUC Value: `0`
   - LCA Total (gCO2e/MJ): `7.7`
   - Emission Reduction (%): `91.3`
   - LCA Methodology: **ICAO CORSIA**
   - Reference Year: `2024`

8. **Submit**
   - Click "Post Lot" or "Update Lot"

### Expected Results

- Lot is saved successfully
- Lot card shows:
  - **Offtake Agreement** type badge
  - **FT-SPK** pathway badge
  - **In Progress** certification badge
  - `91.3% emission reduction`
- Lot detail view shows:
  - SAF Product Details section with pathway, feedstock, facility
  - Compliance Eligibility badges: **ReFuelEU**, **CORSIA**, **UK RTFO** (if EGLL added)
- `complianceEligibility` in DB: `refueleu: true`, `corsia: true`, `ukRtfo: true` (or `false` if no UK delivery)

---

## User Story 2: Legacy Lot Still Works (Backward Compatibility)

**As a** user with existing lots in the system  
**I want to** view and edit my existing lots without errors  
**So that** the migration does not break my workflow  

### Preconditions
- Run migration: `npm run migrate:lot-bp101`
- At least one lot exists with legacy type (`spot`, `forward`, or `contract`)

### Steps

1. **View legacy lot**
   - Go to Dashboard → My Listings
   - Open an existing lot (created before BP-101)

2. **Verify display**
   - Lot card shows correct type label (Spot Volume / Forward Commitment / Offtake Agreement)
   - No console errors or missing data

3. **Edit legacy lot**
   - Click Edit on the legacy lot
   - Form loads with type pre-selected (new value)
   - Change one field (e.g., title) and save

4. **Verify after save**
   - Lot saves successfully
   - Type is stored as new value (`spot_volume`, etc.) in DB
   - Webhook fires with legacy type (`spot`) for producer portal compatibility

### Expected Results

- Legacy lots display correctly
- Editing and saving works
- Type migration applied on save
- Webhook payload uses legacy type for backward compatibility

---

## User Story 3: Supply Discovery Filters (Pre-BP-307 Smoke Test)

**As a** buyer  
**I want to** filter lots by pathway and certification status via API  
**So that** I can find CORSIA-eligible or ReFuelEU-eligible supply  

### Preconditions
- At least one lot with `pathway: FT_SPK` and `certifications.status: in_progress`
- At least one lot with `certifications.status: certified` (if available)

### Steps

1. **Filter by pathway**
   - `GET /api/lots?type=published&pathway=FT_SPK`
   - Response includes only FT-SPK lots

2. **Filter by certification status**
   - `GET /api/lots?type=published&certificationStatus=in_progress`
   - Response includes Yoki-style lots
   - `GET /api/lots?type=published&certificationStatus=certified`
   - Yoki (in_progress) does NOT appear

3. **Filter by CORSIA eligibility**
   - `GET /api/lots?type=published` (no filter)
   - Manually verify lots with `complianceEligibility.corsia: true` appear
   - *(Full filter support in BP-307)*

### Expected Results

- Pathway filter returns correct lots
- Certification status filter works (certified vs in_progress)
- No 500 errors; filters are additive

---

## User Story 4: Webhook Backward Compatibility

**As a** producer portal (or Make.com integration)  
**I want to** receive lot webhooks with the same event names and type values I expect  
**So that** I don't need to change my integration immediately  

### Preconditions
- Producer Dashboard webhook URL configured
- Create or update a lot with new type (`offtake_agreement`)

### Steps

1. **Create lot with new type**
   - Create a lot with Type = **Offtake Agreement**
   - Save

2. **Inspect webhook payload**
   - Webhook receives `lot.created` (or `lot.updated`)
   - Payload `lot.type` = `contract` (legacy), NOT `offtake_agreement`
   - Payload includes `lot.pathway`, `lot.certifications`, `lot.lcaData`, `lot.complianceEligibility` when present

3. **Create lot without SAF details**
   - Create a minimal lot (title, volume, pricing only)
   - Save
   - Webhook payload does NOT include pathway, certifications, etc. (or they are undefined)
   - Payload still has `type`, `volume`, `pricing`, `delivery`, `compliance` (legacy)

### Expected Results

- Event names unchanged: `lot.created`, `lot.updated`, `lot.deleted`
- Type sent as legacy value for compatibility
- New fields additive; missing when not set
- No breaking changes for consumer

---

## User Story 5: Migration Script

**As a** developer or DevOps  
**I want to** run the migration script to update existing lots  
**So that** all lots have `complianceEligibility` and legacy types are migrated  

### Preconditions
- MongoDB connection string in `.env` or `MONGODB_URI` env var
- `npx tsx` available (or use `npm run migrate:lot-bp101`)

### Steps

1. **Run migration**
   - `npm run migrate:lot-bp101`
   - Or: `npx tsx scripts/migrate-lot-bp101.ts`

2. **Verify output**
   - Script connects to MongoDB
   - Reports: "X lots updated", "Y type values migrated", "Z complianceEligibility set"
   - Exits with code 0

3. **Verify in DB**
   - All lots have `complianceEligibility` (at least default)
   - Lots with `type: spot` now have `type: spot_volume`
   - Run script again — idempotent (no duplicates, no errors)

### Expected Results

- Migration completes successfully
- Existing lots updated
- Script is idempotent
