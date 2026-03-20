/**
 * ProducerOrganizationProfile — buyer-facing normalized profile from producer portal.
 * profileVersion: buyer-portal-v2, source: producer-portal
 */

export interface ProducerOrganizationProfileLegalIdentity {
  organizationName?: string
  legalEntityName?: string
  displayName?: string
  orgType?: string
  headquartersCountry?: string
  registeredCountry?: string
  businessAddress?: string
  website?: string
  primaryContactName?: string
  primaryContactEmail?: string
  primaryContactRole?: string
  summary?: string
}

export interface ProducerOrganizationProfileFacility {
  facilityId?: string
  facilityName?: string
  city?: string
  stateOrRegion?: string
  country?: string
  pathwaysProduced?: string[]
  feedstocksUsed?: string[]
  nameplateCapacityMTPerYear?: number
  expectedAvailableVolumeMTPerYear?: number
  annualUtilizationAssumptionPercent?: number
  commissioningStatus?: string
  fidStatus?: string
  currentStatusAsOfDate?: string
  minContractVolumeMT?: number
  maxContractVolumeMT?: number
  monthlyDeliverabilityMT?: number
  quarterlyDeliverabilityMT?: number
  storageCapacityMT?: number
  loadingModes?: string[]
  exportCapability?: boolean
}

export interface ProducerOrganizationProfileFeedstock {
  feedstockType?: string
  category?: string
  originCountry?: string
  originRegion?: string
  feedstockIsWasteResidue?: boolean
  highILUCRisk?: boolean
  deforestationRisk?: boolean
  annualRequirementTonnes?: number
  securedTonnes?: number
  securedPercent?: number
}

export interface ProducerOrganizationProfileProductLCA {
  methodology?: string
  baselineFramework?: string
  fossilBaselineValue?: number
  totalLifecycleValue_gCO2ePerMJ?: number
  reductionPercentVsFossilBaseline?: number
  defaultOrActual?: string
  independentVerificationStatus?: string
}

export interface ProducerOrganizationProfileProductCompliance {
  corsiaEligible?: boolean
  refuelEUEligible?: boolean
  ukRTFOEligible?: boolean
}

export interface ProducerOrganizationProfileProduct {
  productName?: string
  pathway?: string
  feedstockType?: string
  astmStandard?: string
  maxBlendPercentage?: number
  bookAndClaimEligible?: boolean
  physicalDeliveryAvailable?: boolean
  lca?: ProducerOrganizationProfileProductLCA
  complianceEligibility?: ProducerOrganizationProfileProductCompliance
}

export interface ProducerOrganizationProfileCertification {
  scheme?: string
  scope?: string
  status?: string
  certificationBody?: string
  certificateNumber?: string
  issueDate?: string
  expiryDate?: string
  expectedCompletionDate?: string
  linkedFacilityId?: string
  linkedProductName?: string
}

export interface ProducerOrganizationProfileComplianceTimelines {
  firstBookAndClaimDeliveryDate?: string
  firstPhysicalDeliveryDate?: string
  firstComplianceEligibleDeliveryDate?: string
  firstCORSIAEligibleDeliveryDate?: string
  firstReFuelEUEligibleDeliveryDate?: string
  firstUKRTFOEligibleDeliveryDate?: string
  proofOfSustainabilityReadinessDate?: string
}

export interface ProducerOrganizationProfileFrameworkTimeline {
  readinessStatus?: string
  targetEligibilityDate?: string
  dependencies?: string[]
}

export interface ProducerOrganizationProfileFrameworkTimelines {
  corsia?: ProducerOrganizationProfileFrameworkTimeline
  refuelEU?: ProducerOrganizationProfileFrameworkTimeline
  ukRTFO?: ProducerOrganizationProfileFrameworkTimeline
}

export interface ProducerOrganizationProfileCommercial {
  commercialStatus?: string
  availableVolumeMT?: number
  availableFromDate?: string
  pricingModel?: string
  contractTypesSupported?: string[]
}

export interface ProducerOrganizationProfileLogistics {
  deliveryReadiness?: string
  earliestDeliveryDate?: string
  deliveryRegions?: string[]
  deliveryCountries?: string[]
  bookAndClaimSupported?: boolean
  physicalDeliveryAvailable?: boolean
}

export interface ProducerOrganizationProfileProjectReadiness {
  projectStage?: string
  fidStatus?: string
  feedstockSecuredPercent?: number
  offtakeSecuredPercent?: number
  keyRisks?: string[]
}

export interface ProducerOrganizationProfileSupportingDocument {
  documentType?: string
  title?: string
  status?: string
  issueDate?: string
  expiryDate?: string
}

export interface ProducerOrganizationProfileDerived {
  isCurrentlyDeliverable?: boolean
  isComplianceEligibleNow?: boolean
  isPreCertificationSupply?: boolean
  earliestComplianceEligibleDate?: string
  headlineReductionPercent?: number
  headlinePathway?: string
  headlineFeedstock?: string
  headlineAvailableVolumeMT?: number
  headlineCertificationStatus?: string
  readinessScore?: number
  complianceReadinessScore?: number
  deliveryConfidenceScore?: number
}

export interface ProducerOrganizationProfileMetadata {
  profileVersion?: string
  source?: string
  generatedAt?: string
  updatedAt?: string
}

export interface ProducerOrganizationProfile {
  orgId?: string
  legalIdentity?: ProducerOrganizationProfileLegalIdentity
  organizationName?: string
  pathways?: string[]
  feedstocks?: string[]
  totalNameplateCapacityMTPerYear?: number
  totalExpectedAvailableVolumeMTPerYear?: number
  currentOperationalCapacityMTPerYear?: number
  committedVolumeMTPerYear?: number
  uncommittedVolumeMTPerYear?: number
  earliestDeliveryDate?: string
  firstComplianceEligibleDeliveryDate?: string
  deliveryReadiness?: string
  facilities?: ProducerOrganizationProfileFacility[]
  feedstockProfile?: ProducerOrganizationProfileFeedstock[]
  products?: ProducerOrganizationProfileProduct[]
  certifications?: ProducerOrganizationProfileCertification[]
  complianceTimelines?: ProducerOrganizationProfileComplianceTimelines
  frameworkTimelines?: ProducerOrganizationProfileFrameworkTimelines
  commercial?: ProducerOrganizationProfileCommercial
  logistics?: ProducerOrganizationProfileLogistics
  projectReadiness?: ProducerOrganizationProfileProjectReadiness
  keyRisks?: string[]
  supportingDocuments?: ProducerOrganizationProfileSupportingDocument[]
  derived?: ProducerOrganizationProfileDerived
  metadata?: ProducerOrganizationProfileMetadata
}
