/**
 * BP-102: Producer Profile Types
 * 
 * Types for the producerProfile sub-document on Organization.
 * Enums mirror the producer portal's Plant model (facilities, pathways)
 * and the compliance-service enums (CS-102) so cross-repo data stays consistent.
 */
export enum FuelPathway{
    HEFA = 'HEFA',
    FT_SPK = 'FT_SPK',
    ATJ = 'ATJ',
    SIP = "SIP",
  PTL = "PTL",
  CHJ = "CHJ",
  CO_PROCESSING = "CO_PROCESSING",
  OTHER = "OTHER",
}
export enum CertificationScheme {
    ISCC_CORSIA = "ISCC_CORSIA",
    ISCC_EU = "ISCC_EU",
    ISCC_PLUS = "ISCC_PLUS",
    RSB_CORSIA = "RSB_CORSIA",
    RSB_EU_RED = "RSB_EU_RED",
    RSB_GLOBAL = "RSB_GLOBAL",
  }
  
  export enum CertificationStatus {
    ACTIVE = "active",
    PENDING = "pending",
    EXPIRED = "expired",
  }
  
  export enum FacilityStatus {
    OPERATIONAL = "operational",
    UNDER_CONSTRUCTION = "under_construction",
    PLANNED = "planned",
  }
  
  export enum LCAMethodology {
    CORSIA_DEFAULT = "corsia_default",
    CORSIA_ACTUAL = "corsia_actual",
    EU_RED_DEFAULT = "eu_red_default",
    EU_RED_ACTUAL = "eu_red_actual",
  }
  
  export interface ProducerFacility {
    name: string;
    location: string;
    country: string;
    capacityMTPerYear: number;
    commissioningDate: Date;
    status: FacilityStatus;
  }
  
  export interface ProducerCertification {
    scheme: CertificationScheme;
    status: CertificationStatus;
    certificationBody: string;
    expectedCompletion?: string;
    certificateId?: string;
    validUntil?: Date;
  }
  
  export interface ProducerProfile {
    pathways: FuelPathway[];
    feedstocks: string[];
    facilities: ProducerFacility[];
    certifications: ProducerCertification[];
    totalAvailableVolume: number;
    deliveryReadiness: string;
    lcaMethodology: LCAMethodology;
  }