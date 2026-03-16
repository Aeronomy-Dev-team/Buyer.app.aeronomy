/**
 * BP-102: GET /api/producers/:orgId/profile
 *
 * Buyer-facing read endpoint for producer profiles.
 * Any Clerk-authenticated user can view any producer's profile.
 * This is marketplace discovery — not org-scoped private data.
 *
 * The IDOR concern from the audit does NOT apply here.
 * Dashboard/stats routes should scope to the user's org.
 * This route is intentionally cross-org readable.
 */
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Organization from "@/models/Organization";

interface RouteParams {
    params: {
        orgId: string;
    };
}
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
      // 1. Clerk auth — reject unauthenticated
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      // 2. Validate param
      const { orgId } = await params;
      if (!orgId) {
        return NextResponse.json(
          { error: "Organization ID is required" },
          { status: 400 }
        );
      }

  // 3. Database
    await dbConnect();

    // 4. Fetch — .select() limits exposure, .lean() for performance
    const organization = await Organization.findById(orgId)
      .select("name orgType producerProfile")
      .lean();

    // 5. Validate producer
    if (!organization) {
      return NextResponse.json(
        { error: "Producer not found" },
        { status: 404 }
      );
    }
    const isProducer =
    organization.orgType === "producer" ||
    organization.orgType === "both";

  if (!isProducer) {
    return NextResponse.json(
      { error: "Producer not found" },
      { status: 404 }
    );
  }
   // 6. Default profile if not yet populated
   const defaultProfile = {
    pathways: [],
    feedstocks: [],
    facilities: [],
    certifications: [],
    totalAvailableVolume: 0,
    deliveryReadiness: "planned",
    lcaMethodology: "corsia_default",
  };

  return NextResponse.json({
    orgId: organization._id.toString(),
    name: organization.name,
    orgType: organization.orgType,
    producerProfile: organization.producerProfile || defaultProfile,
  });
} catch (error) {
  console.error("[BP-102] Error fetching producer profile:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
}