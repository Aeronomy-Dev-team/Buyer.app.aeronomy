/**
 * BP-102: Yoki seed data. Used by BP-401 seed script.
 * Also the reference implementation — if BP-307 renders this correctly,
 * the schema is right.
 */

import {
    FuelPathway,
    CertificationScheme,
    CertificationStatus,
    FacilityStatus,
    LCAMethodology,
    type ProducerProfile,
  } from "@/models/producer-profile.types";
  
  export const YOKI_PRODUCER_PROFILE: ProducerProfile = {
    pathways: [FuelPathway.FT_SPK],
    feedstocks: ["Municipal Solid Waste"],
    facilities: [
      {
        name: "Maharashtra FT-SPK Plant",
        location: "Maharashtra",
        country: "IN",
        capacityMTPerYear: 50_000,
        commissioningDate: new Date("2027-01-01T00:00:00.000Z"),
        status: FacilityStatus.UNDER_CONSTRUCTION,
      },
    ],
    certifications: [
      {
        scheme: CertificationScheme.ISCC_CORSIA,
        status: CertificationStatus.PENDING,
        certificationBody: "ISCC",
        expectedCompletion: "2026-Q4",
      },
    ],
    totalAvailableVolume: 50_000,
    deliveryReadiness: "2027-01-01",
    lcaMethodology: LCAMethodology.CORSIA_DEFAULT,
  };