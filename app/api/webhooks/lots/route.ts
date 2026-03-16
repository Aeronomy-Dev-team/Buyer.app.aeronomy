/**
 * BP-102: Webhook endpoint for Producer Portal events
 * 
 * Receives events from cist.aeronomy.co:
 *   - lot.created / lot.updated / lot.deleted (existing)
 *   - organization.updated (BP-102 — producer profile sync)
 *
 * The producer portal POSTs here with:
 *   { event: "organization.updated", data: { orgId, producerProfile } }
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Organization from "@/models/Organization";

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth — verify webhook secret ──────────────────────────────
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.PRODUCER_DASHBOARD_WEBHOOK_SECRET;

    if (expectedSecret) {
      const token = authHeader?.replace("Bearer ", "");
      if (token !== expectedSecret) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    // ── 2. Parse payload ─────────────────────────────────────────────
    const payload = await request.json();
    const { event, data } = payload;

    console.log("📥 Received webhook:", event);

    // ── 3. Route by event type ───────────────────────────────────────
    switch (event) {
      // ── Lot events (existing — flesh these out as needed) ────────
      case "lot.created":
      case "lot.updated":
      case "lot.deleted": {
        console.log(`📦 Lot event: ${event}`, data?.lotId || "");
        // TODO: process lot events when needed
        // For now these are acknowledged but not acted on
        // (the buyer portal reads lots from its own DB)
        break;
      }

      // ── BP-102: Producer profile sync ────────────────────────────
      case "organization.updated": {
        await handleOrganizationUpdated(data);
        break;
      }

      default: {
        console.warn(`⚠️ Unknown webhook event: ${event}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Webhook ${event} processed`,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to process webhook";
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * BP-102: Handle producer profile updates from the producer portal.
 *
 * Uses $set with dot notation so a partial update (e.g., only
 * totalAvailableVolume changed) doesn't wipe other profile fields.
 *
 * Expected payload:
 * {
 *   orgId: "the Organization._id in buyer portal DB",
 *   name?: "updated org name",
 *   producerProfile?: {
 *     pathways?: [...],
 *     feedstocks?: [...],
 *     facilities?: [...],
 *     certifications?: [...],
 *     totalAvailableVolume?: number,
 *     deliveryReadiness?: string,
 *     lcaMethodology?: string,
 *   }
 * }
 */
async function handleOrganizationUpdated(
  data: Record<string, unknown> | undefined
) {
  if (!data || !data.orgId) {
    console.warn("[BP-102] organization.updated missing orgId");
    return;
  }

  await dbConnect();

  const { orgId, name, producerProfile } = data as {
    orgId: string;
    name?: string;
    producerProfile?: Record<string, unknown>;
  };

  const updateFields: Record<string, unknown> = {};

  if (name) {
    updateFields.name = name;
  }

  if (producerProfile && typeof producerProfile === "object") {
    for (const [key, value] of Object.entries(producerProfile)) {
      updateFields[`producerProfile.${key}`] = value;
    }
  }

  if (Object.keys(updateFields).length === 0) {
    console.warn("[BP-102] organization.updated had no fields to update");
    return;
  }

  const result = await Organization.findByIdAndUpdate(
    orgId,
    { $set: updateFields },
    { new: true }
  );

  if (!result) {
    console.error(`[BP-102] Organization ${orgId} not found`);
    return;
  }

  console.log(
    `✅ [BP-102] Updated producer profile for ${result.name} (${orgId})`
  );
}