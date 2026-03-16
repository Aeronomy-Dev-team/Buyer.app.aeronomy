import mongoose, { Schema, Document, Model } from 'mongoose'
import {
  CertificationScheme,
  CertificationStatus,
  FacilityStatus,
  FuelPathway,
  LCAMethodology,
  ProducerProfile,
} from './producer-profile.types'

export interface IOrganizationBranding {
  logo?: string
  brandName?: string
}

// 2. Organization Profile
export interface ILegalEntity {
  legalName: string
  tradingName?: string
  registeredAddress: string
  billingAddress: string
  identifiers: {
    cin?: string
    vat?: string
    lei?: string
    other?: Map<string, string>
  }
}

export interface ICorporateStructure {
  parentCompany?: string
  subsidiaries?: string[]
  alliances?: string[] // e.g., Star Alliance, Oneworld
}

export interface IContactPoint {
  name: string
  email: string
  phone?: string
  role: string
}

export interface IContactPoints {
  primarySaf?: IContactPoint
  sustainability?: IContactPoint
  finance?: IContactPoint
  legal?: IContactPoint
}

// 3. Compliance and KYB
export interface IKYB {
  documents: {
    incorporation?: string // URL
    taxRegistration?: string // URL
    operatingCertificate?: string // URL
  }
  sanctionsScreening?: boolean
  pepChecks?: boolean
  status: 'pending' | 'approved' | 'rejected'
}

export interface IRegulatory {
  jurisdictions: string[] // EU, UK, US, etc.
  regimes: string[] // CORSIA, EU ETS, etc.
  complianceContacts?: IContactPoint[]
}

export interface IPolicies {
  termsAccepted: boolean
  termsAcceptedAt?: Date
  dataSharingAccepted: boolean
  documentationRetentionAccepted: boolean
}

// 4. Operational Footprint
export interface IOperationalFootprint {
  hubAirports: string[]
  focusAirports?: string[]
  regions: string[] // EU, MEA, APAC, Americas
  fuelSuppliers?: { airport: string; supplier: string }[]
  logisticPartners?: string[]
  fleet: {
    types: string[]
    annualBlockHours?: number
    annualFuelBurn?: number
  }
}

// 5. SAF Demand
export interface ISafDemand {
  targets: {
    adoptionTarget?: number // Percentage
    targetYear?: number
    driver?: 'mandate' | 'voluntary' | 'hybrid'
  }
  volume: {
    requirements: { year: number; amount: number; unit: string }[]
    minVolume?: number
    maxVolume?: number
    spotRatio?: number // 0-100
    longTermRatio?: number // 0-100
  }
  quality: {
    pathways?: string[] // HEFA, ATJ, etc.
    feedstockExclusions?: string[]
    minGhgReduction?: number
  }
}

// 6. Procurement
export interface IProcurement {
  model: {
    strategy?: 'spot' | 'long-term' | 'blended'
    delivery?: 'book-and-claim' | 'physical' | 'hybrid'
    contracting?: 'direct' | 'trader' | 'hybrid'
  }
  tendering: {
    horizon?: string
    minDuration?: number // Years
    lotSize?: { min: number; max: number; unit: string }
  }
  risk: {
    pricingModel?: 'fixed' | 'index-linked' | 'hybrid'
    allowedCurrencies?: string[]
    priceEscalatorsAccepted?: boolean
  }
}

// 7. Financial
export interface IFinancial {
  billing: {
    entityName?: string
    address?: string
    taxIds?: Map<string, string>
    paymentTerms?: string
    invoicingPreference?: 'shipment' | 'monthly' | 'contract'
  }
  credit: {
    financialsUrl?: string
    creditRating?: string
    creditLimit?: number
    transactionLimit?: number
  }
  payment: {
    methods: string[]
    bankDetails?: {
      bankName: string
      accountNumber: string // Masked or encrypted in real app
      swiftCode: string
      currency: string
    }
  }
}

// 8. Sustainability
export interface ISustainability {
  certificates: {
    handling?: 'physical' | 'book-and-claim'
    applicationLevel?: 'route' | 'network' | 'corporate'
    stackingAllowed?: boolean
  }
  accounting: {
    frameworks?: string[]
    requiredOutputs?: string[]
    granularity?: string
  }
  audit: {
    accessList?: string[] // User IDs or Roles
    retentionPeriod?: number // Years
  }
}

// 9. Governance
export interface IGovernance {
  approvalThresholds?: { amount: number; currency: string; approverRole: string }[]
  segregationOfDuties?: boolean
}

// 10. Integrations
export interface IIntegrations {
  erpSystem?: string
  fuelSystem?: string
  esgTool?: string
  dataExchange?: {
    method?: 'api' | 'sftp' | 'portal'
    frequency?: 'real-time' | 'hourly' | 'daily'
  }
}

export type OnboardingStatus = 'pending' | 'in_progress' | 'completed'

export interface IOrganization extends Document {
  name: string
  type: 'airline' | 'producer' | 'trader'
  billingEmail?: string
  plan?: string
  branding?: IOrganizationBranding
  producerProfile?: ProducerProfile

  // Simplified onboarding fields
  userName?: string
  companyEmail?: string
  teamSize?: string
  headquarters?: string
  entityType?: string
  organizationType?: string
  intent?: string
  volumeRange?: string
  requirements?: string
  targetAirports?: string[]
  emailPreferences?: {
    marketingEmails: boolean
    bidNotifications: boolean
    contractUpdates: boolean
    securityAlerts: boolean
  }

  // Onboarding Data
  onboardingStatus: OnboardingStatus
  legalEntity?: ILegalEntity
  corporateStructure?: ICorporateStructure
  contactPoints?: IContactPoints
  compliance?: {
    kyb?: IKYB
    regulatory?: IRegulatory
    policies?: IPolicies
  }
  operational?: IOperationalFootprint
  safDemand?: ISafDemand
  procurement?: IProcurement
  financial?: IFinancial
  sustainability?: ISustainability
  governance?: IGovernance
  integrations?: IIntegrations

  createdAt: Date
  updatedAt: Date
}

const BrandingSchema = new Schema<IOrganizationBranding>(
  {
    logo: { type: String, trim: true },
    brandName: { type: String, trim: true },
  },
  { _id: false }
)

const ProducerFacilitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, maxlength: 2 },
    capacityMTPerYear: { type: Number, required: true, min: 0 },
    commissioningDate: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(FacilityStatus),
      default: FacilityStatus.PLANNED,
    },
  },
  { _id: false }
)

const ProducerCertificationSchema = new Schema(
  {
    scheme: {
      type: String,
      required: true,
      enum: Object.values(CertificationScheme),
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(CertificationStatus),
      default: CertificationStatus.PENDING,
    },
    certificationBody: { type: String, required: true, trim: true },
    expectedCompletion: { type: String, trim: true },
    certificateId: { type: String, trim: true },
    validUntil: { type: Date },
  },
  { _id: false }
)

const ProducerProfileSchema = new Schema(
  {
    pathways: {
      type: [String],
      enum: Object.values(FuelPathway),
      default: [],
    },
    feedstocks: { type: [String], default: [] },
    facilities: { type: [ProducerFacilitySchema], default: [] },
    certifications: { type: [ProducerCertificationSchema], default: [] },
    totalAvailableVolume: { type: Number, default: 0, min: 0 },
    deliveryReadiness: { type: String, default: 'planned' },
    lcaMethodology: {
      type: String,
      enum: Object.values(LCAMethodology),
      default: LCAMethodology.CORSIA_DEFAULT,
    },
  },
  { _id: false }
)

const OrganizationSchema: Schema<IOrganization> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['airline', 'producer', 'trader'], default: 'airline' },
    billingEmail: { type: String, trim: true, lowercase: true },
    plan: { type: String, trim: true },
    branding: { type: BrandingSchema, default: undefined },
    producerProfile: {
      type: ProducerProfileSchema,
      default: undefined,
    },

    // Simplified onboarding fields
    userName: { type: String, trim: true },
    companyEmail: { type: String, trim: true, lowercase: true },
    teamSize: { type: String, trim: true },
    headquarters: { type: String, trim: true },
    entityType: { type: String, trim: true },
    organizationType: { type: String, trim: true },
    intent: { type: String, trim: true },
    volumeRange: { type: String, trim: true },
    requirements: { type: String, trim: true },
    targetAirports: [{ type: String, trim: true }],
    emailPreferences: {
      marketingEmails: { type: Boolean, default: true },
      bidNotifications: { type: Boolean, default: true },
      contractUpdates: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
    },

    onboardingStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
      index: true
    },

    // Nested Schemas
    legalEntity: {
      legalName: String,
      tradingName: String,
      registeredAddress: String,
      billingAddress: String,
      identifiers: {
        cin: String,
        vat: String,
        lei: String,
        other: { type: Map, of: String }
      }
    },

    corporateStructure: {
      parentCompany: String,
      subsidiaries: [String],
      alliances: [String]
    },

    contactPoints: {
      primarySaf: { name: String, email: String, phone: String, role: String },
      sustainability: { name: String, email: String, phone: String, role: String },
      finance: { name: String, email: String, phone: String, role: String },
      legal: { name: String, email: String, phone: String, role: String }
    },

    compliance: {
      kyb: {
        documents: {
          incorporation: String,
          taxRegistration: String,
          operatingCertificate: String
        },
        sanctionsScreening: Boolean,
        pepChecks: Boolean,
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
      },
      regulatory: {
        jurisdictions: [String],
        regimes: [String],
        complianceContacts: [{ name: String, email: String, phone: String, role: String }]
      },
      policies: {
        termsAccepted: Boolean,
        termsAcceptedAt: Date,
        dataSharingAccepted: Boolean,
        documentationRetentionAccepted: Boolean
      }
    },

    operational: {
      hubAirports: [String],
      focusAirports: [String],
      regions: [String],
      fuelSuppliers: [{ airport: String, supplier: String }],
      logisticPartners: [String],
      fleet: {
        types: [String],
        annualBlockHours: Number,
        annualFuelBurn: Number
      }
    },

    safDemand: {
      targets: {
        adoptionTarget: Number,
        targetYear: Number,
        driver: { type: String, enum: ['mandate', 'voluntary', 'hybrid'] }
      },
      volume: {
        requirements: [{ year: Number, amount: Number, unit: String }],
        minVolume: Number,
        maxVolume: Number,
        spotRatio: Number,
        longTermRatio: Number
      },
      quality: {
        pathways: [String],
        feedstockExclusions: [String],
        minGhgReduction: Number
      }
    },

    procurement: {
      model: {
        strategy: String,
        delivery: String,
        contracting: String
      },
      tendering: {
        horizon: String,
        minDuration: Number,
        lotSize: { min: Number, max: Number, unit: String }
      },
      risk: {
        pricingModel: String,
        allowedCurrencies: [String],
        priceEscalatorsAccepted: Boolean
      }
    },

    financial: {
      billing: {
        entityName: String,
        address: String,
        taxIds: { type: Map, of: String },
        paymentTerms: String,
        invoicingPreference: String
      },
      credit: {
        financialsUrl: String,
        creditRating: String,
        creditLimit: Number,
        transactionLimit: Number
      },
      payment: {
        methods: [String],
        bankDetails: {
          bankName: String,
          accountNumber: String,
          swiftCode: String,
          currency: String
        }
      }
    },

    sustainability: {
      certificates: {
        handling: String,
        applicationLevel: String,
        stackingAllowed: Boolean
      },
      accounting: {
        frameworks: [String],
        requiredOutputs: [String],
        granularity: String
      },
      audit: {
        accessList: [String],
        retentionPeriod: Number
      }
    },

    governance: {
      approvalThresholds: [{ amount: Number, currency: String, approverRole: String }],
      segregationOfDuties: Boolean
    },

    integrations: {
      erpSystem: String,
      fuelSystem: String,
      esgTool: String,
      dataExchange: {
        method: String,
        frequency: String
      }
    }
  },
  {
    timestamps: true,
  }
)

OrganizationSchema.index({ name: 1 }, { unique: false })

const Organization: Model<IOrganization> =
  mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema)

export default Organization



















