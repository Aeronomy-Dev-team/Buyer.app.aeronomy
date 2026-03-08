import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export type LotStatus = 'draft' | 'published' | 'reserved' | 'sold' | 'cancelled'

// SAF-specific lot types (renamed from generic trading terms)
export type LotType = 'spot_volume' | 'forward_commitment' | 'offtake_agreement'

// Import from client-safe utils (avoids importing Lot model in client components)
import { LEGACY_TYPE_MAP, TYPE_TO_LEGACY } from '@/lib/lots/utils'
export { LEGACY_TYPE_MAP, TYPE_TO_LEGACY }

// ASTM D7566 approved pathways (aligned with CS-102)
export type FuelPathway =
  | 'FT_SPK'
  | 'HEFA_SPK'
  | 'ATJ_SPK'
  | 'HFS_SIP'
  | 'CHJ'
  | 'HC_HEFA_SPK'
  | 'PTL'
  | 'CO_PROCESSING'
  | 'OTHER'

// Certification schemes
export type CertificationScheme =
  | 'ISCC_CORSIA'
  | 'ISCC_EU'
  | 'ISCC_PLUS'
  | 'RSB_CORSIA'
  | 'RSB_EU_RED'
  | 'RSB_GLOBAL'
  | 'CLASSNK_CORSIA'
  | 'OTHER'

export type CertificationStatus = 'certified' | 'in_progress' | 'not_started'

export type DeliveryRegion = 'EU' | 'UK' | 'US' | 'ME' | 'APAC'

export interface ILotCertification {
  scheme: CertificationScheme
  status: CertificationStatus
  expectedCompletion?: Date
  certificateNumber?: string
  certExpiry?: Date
}

export interface ILotDeliveryLocation {
  airport: string // ICAO code
  country: string
  region: DeliveryRegion
  availableFrom: Date
}

export interface ILotProductionFacility {
  name: string
  location: string
  country: string
  capacityMTPerYear: number
  commissioningDate: Date
}

export interface ILotLCAData {
  coreValue: number // gCO2e/MJ
  ilucValue: number
  totalLifecycleValue: number
  reductionPercent: number
  methodology: 'ICAO_CORSIA' | 'EU_RED' | 'RSB'
  referenceYear: number
}

export interface IComplianceEligibility {
  refueleu: boolean
  corsia: boolean
  ukRtfo: boolean
  euEts: boolean
  derivedAt: Date
}

export interface ILotVolume {
  amount: number
  unit: string // e.g., 'gallons', 'liters', 'MT'
  total?: number // for SAF: total volume in MT
  available?: number // for SAF: available volume
}

export interface ILotPricing {
  price: number
  currency: string
  pricePerUnit?: number
  paymentTerms?: string
}

export interface ILotDelivery {
  deliveryDate?: Date
  deliveryLocation?: string
  deliveryMethod?: string
  incoterms?: string
}

export interface ILotCompliance {
  certificates?: Types.ObjectId[]
  standards?: string[]
  ghgReduction?: number
  sustainabilityScore?: number
}

export interface ILot extends Document {
  orgId: Types.ObjectId
  postedBy: Types.ObjectId
  airlineName?: string

  title: string
  description?: string
  type: LotType
  status: LotStatus

  // SAF-specific fields (BP-101)
  pathway?: FuelPathway
  feedstockType?: string
  feedstockOrigin?: string
  productionFacility?: ILotProductionFacility
  certifications?: ILotCertification[]
  deliveryLocations?: ILotDeliveryLocation[]
  lcaData?: ILotLCAData
  complianceEligibility?: IComplianceEligibility

  volume: ILotVolume
  pricing: ILotPricing
  delivery?: ILotDelivery
  compliance?: ILotCompliance

  tags?: string[]
  images?: string[]
  attachments?: string[]

  publishedAt?: Date
  expiresAt?: Date
  reservedAt?: Date
  soldAt?: Date

  views?: number
  inquiries?: number

  createdAt: Date
  updatedAt: Date
}

// Union airports (ReFuelEU) - EU Member State airports (excludes UK post-Brexit)
const UNION_AIRPORTS = new Set(['LFPG', 'EDDF', 'EHAM', 'LEMD', 'LIRF', 'EDDM', 'LSZH', 'LOWW', 'EBBR', 'EKCH', 'ENGM', 'ESSA', 'EFHK', 'LEMD', 'LEBL', 'LFMN', 'LFPO'])
// UK airports for UK RTFO
const UK_AIRPORTS = new Set(['EGLL', 'EGKK', 'EGGW', 'EGCC', 'EGBB', 'EGPH', 'EGSH', 'EGNX'])
// CORSIA-eligible certification schemes
const CORSIA_SCHEMES = new Set(['ISCC_CORSIA', 'RSB_CORSIA', 'CLASSNK_CORSIA'])
// ASTM-approved pathways (simplified for Sprint 1)
const ASTM_APPROVED_PATHWAYS = new Set(['FT_SPK', 'HEFA_SPK', 'ATJ_SPK', 'HFS_SIP', 'CHJ', 'HC_HEFA_SPK', 'PTL', 'CO_PROCESSING'])

function deriveComplianceEligibility(lot: any): IComplianceEligibility {
  const pathway = lot.pathway
  const certifications = lot.certifications || []
  const deliveryLocations = lot.deliveryLocations || []

  const hasCertifiedOrInProgress = certifications.some(
    (c: ILotCertification) => c.status === 'certified' || c.status === 'in_progress'
  )
  const hasCorsiaCert = certifications.some((c: ILotCertification) => CORSIA_SCHEMES.has(c.scheme))
  const hasUnionDelivery = deliveryLocations.some((d: ILotDeliveryLocation) =>
    UNION_AIRPORTS.has(d.airport.toUpperCase())
  )
  const hasUKDelivery = deliveryLocations.some((d: ILotDeliveryLocation) =>
    UK_AIRPORTS.has(d.airport.toUpperCase())
  )
  const pathwayApproved = pathway ? ASTM_APPROVED_PATHWAYS.has(pathway) : false

  return {
    refueleu: !!(pathwayApproved && hasCertifiedOrInProgress && hasUnionDelivery),
    corsia: !!hasCorsiaCert,
    ukRtfo: !!(pathwayApproved && hasUKDelivery),
    euEts: false, // not determined at lot level for MVP
    derivedAt: new Date(),
  }
}

const LotVolumeSchema = new Schema<ILotVolume>(
  {
    amount: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, default: 'gallons' },
    total: { type: Number, min: 0 },
    available: { type: Number, min: 0 },
  },
  { _id: false }
)

const LotPricingSchema = new Schema<ILotPricing>(
  {
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, default: 'USD' },
    pricePerUnit: { type: Number },
    paymentTerms: { type: String, trim: true },
  },
  { _id: false }
)

const LotDeliverySchema = new Schema<ILotDelivery>(
  {
    deliveryDate: { type: Date },
    deliveryLocation: { type: String, trim: true },
    deliveryMethod: { type: String, trim: true },
    incoterms: { type: String, trim: true },
  },
  { _id: false }
)

const LotComplianceSchema = new Schema<ILotCompliance>(
  {
    certificates: [{ type: Schema.Types.ObjectId, ref: 'Certificate' }],
    standards: [{ type: String, trim: true }],
    ghgReduction: { type: Number, min: 0, max: 100 },
    sustainabilityScore: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
)

const LotCertificationSchema = new Schema<ILotCertification>(
  {
    scheme: { type: String, required: true, enum: ['ISCC_CORSIA', 'ISCC_EU', 'ISCC_PLUS', 'RSB_CORSIA', 'RSB_EU_RED', 'RSB_GLOBAL', 'CLASSNK_CORSIA', 'OTHER'] },
    status: { type: String, required: true, enum: ['certified', 'in_progress', 'not_started'] },
    expectedCompletion: { type: Date },
    certificateNumber: { type: String, trim: true },
    certExpiry: { type: Date },
  },
  { _id: false }
)

const LotDeliveryLocationSchema = new Schema<ILotDeliveryLocation>(
  {
    airport: { type: String, required: true, trim: true, uppercase: true },
    country: { type: String, required: true, trim: true },
    region: { type: String, required: true, enum: ['EU', 'UK', 'US', 'ME', 'APAC'] },
    availableFrom: { type: Date, required: true },
  },
  { _id: false }
)

const LotProductionFacilitySchema = new Schema<ILotProductionFacility>(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    capacityMTPerYear: { type: Number, required: true, min: 0 },
    commissioningDate: { type: Date, required: true },
  },
  { _id: false }
)

const LotLCADataSchema = new Schema<ILotLCAData>(
  {
    coreValue: { type: Number, required: true },
    ilucValue: { type: Number, default: 0 },
    totalLifecycleValue: { type: Number, required: true },
    reductionPercent: { type: Number, required: true, min: 0, max: 100 },
    methodology: { type: String, required: true, enum: ['ICAO_CORSIA', 'EU_RED', 'RSB'] },
    referenceYear: { type: Number, required: true },
  },
  { _id: false }
)

const ComplianceEligibilitySchema = new Schema<IComplianceEligibility>(
  {
    refueleu: { type: Boolean, required: true },
    corsia: { type: Boolean, required: true },
    ukRtfo: { type: Boolean, required: true },
    euEts: { type: Boolean, required: true },
    derivedAt: { type: Date, required: true },
  },
  { _id: false }
)

const LotSchema: Schema<ILot> = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    airlineName: { type: String, trim: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ['spot_volume', 'forward_commitment', 'offtake_agreement', 'spot', 'forward', 'contract'],
      required: true,
      default: 'spot_volume',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'reserved', 'sold', 'cancelled'],
      required: true,
      default: 'draft',
      index: true,
    },

    pathway: { type: String, trim: true, enum: ['FT_SPK', 'HEFA_SPK', 'ATJ_SPK', 'HFS_SIP', 'CHJ', 'HC_HEFA_SPK', 'PTL', 'CO_PROCESSING', 'OTHER'] },
    feedstockType: { type: String, trim: true },
    feedstockOrigin: { type: String, trim: true },
    productionFacility: { type: LotProductionFacilitySchema },
    certifications: [{ type: LotCertificationSchema }],
    deliveryLocations: [{ type: LotDeliveryLocationSchema }],
    lcaData: { type: LotLCADataSchema },
    complianceEligibility: { type: ComplianceEligibilitySchema },

    volume: { type: LotVolumeSchema, required: true },
    pricing: { type: LotPricingSchema, required: true },
    delivery: { type: LotDeliverySchema, default: undefined },
    compliance: { type: LotComplianceSchema, default: undefined },

    tags: [{ type: String, trim: true }],
    images: [{ type: String, trim: true }],
    attachments: [{ type: String, trim: true }],

    publishedAt: { type: Date, index: true },
    expiresAt: { type: Date, index: true },
    reservedAt: { type: Date },
    soldAt: { type: Date },

    views: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// Indexes for supply discovery filters (BP-307)
LotSchema.index({ pathway: 1 })
LotSchema.index({ 'certifications.scheme': 1, 'certifications.status': 1 })
LotSchema.index({ 'complianceEligibility.corsia': 1 })
LotSchema.index({ 'complianceEligibility.refueleu': 1 })
LotSchema.index({ 'deliveryLocations.region': 1 })
LotSchema.index({ 'deliveryLocations.availableFrom': 1 })
LotSchema.index({ 'volume.available': 1 }, { sparse: true })
LotSchema.index({ orgId: 1, status: 1 })
LotSchema.index({ status: 1, publishedAt: -1 })
LotSchema.index({ type: 1, status: 1 })
LotSchema.index({ 'compliance.standards': 1 })
LotSchema.index({ createdAt: -1 })

// Normalize type: map legacy values to new values on save
LotSchema.pre('save', function (next) {
  const legacy = this.type as string
  if (LEGACY_TYPE_MAP[legacy]) {
    this.type = LEGACY_TYPE_MAP[legacy] as any
  }
  next()
})

// Derive complianceEligibility when pathway, certifications, or deliveryLocations change
LotSchema.pre('save', function (next) {
  const triggers = ['pathway', 'certifications', 'deliveryLocations']
  const isModified = triggers.some((f) => this.isModified(f))
  const hasRelevantData = this.pathway || (this.certifications && this.certifications.length > 0) || (this.deliveryLocations && this.deliveryLocations.length > 0)

  if (isModified && hasRelevantData) {
    this.complianceEligibility = deriveComplianceEligibility(this)
  } else if (!this.complianceEligibility && (this.pathway || this.certifications?.length || this.deliveryLocations?.length)) {
    this.complianceEligibility = deriveComplianceEligibility(this)
  }
  next()
})

// Price/volume calculation
LotSchema.pre('save', function (next) {
  if (this.pricing && this.volume && this.volume.amount > 0) {
    if (this.pricing.pricePerUnit !== undefined && this.pricing.pricePerUnit !== null) {
      this.pricing.price = this.pricing.pricePerUnit * this.volume.amount
    } else if (this.pricing.price !== undefined && this.pricing.price !== null) {
      this.pricing.pricePerUnit = this.pricing.price / this.volume.amount
    }
  }
  next()
})

const Lot: Model<ILot> = mongoose.models.Lot || mongoose.model<ILot>('Lot', LotSchema)

export default Lot
