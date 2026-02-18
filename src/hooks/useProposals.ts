"use client";
import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { createClient } from "@/lib/supabase/client";
import type { Proposal, ProposalInsert, ProposalUpdate, ProposalSnapshotInsert, ProposalPhoto } from "@/lib/supabase/database.types";
import type { PhotoEntry, MapData } from "@/lib/proposals/types";
import type { Json } from "@/lib/supabase/database.types";

export interface ProposalListItem {
  id: string;
  name: string | null;
  template_id: string;
  status: string;
  updated_at: string;
  client_id: string | null;
}

export function useProposals() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const list = useCallback(async () => {
    if (!user) return [];
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("proposals")
        .select("id, name, template_id, status, updated_at, client_id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) {
        console.error("[useProposals] list error:", error.message, error.details, error.hint);
      }
      const items = (data ?? []) as ProposalListItem[];
      setProposals(items);
      return items;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const save = useCallback(
    async (proposal: {
      id?: string;
      templateId: string;
      name?: string;
      formData: Record<string, string>;
      inspectionDate?: string;
      status?: "draft" | "sent" | "accepted" | "declined";
      clientId?: string;
      sessionId?: string;
      mapData?: MapData | null;
      photos?: PhotoEntry[];
    }): Promise<string | null> => {
      if (!user) {
        const msg = "Save failed: not logged in. Please sign in and try again.";
        console.error("[useProposals]", msg);
        setSaveError(msg);
        return null;
      }
      setSaveError(null);
      const supabase = createClient();

      // Serialize mapData for DB — strip imageSrc to avoid bloated JSON
      let mapDataForDb: Json | null = null;
      if (proposal.mapData) {
        try {
          // Deep-clone and strip imageSrc (can be huge base64)
          const cleaned = JSON.parse(JSON.stringify(proposal.mapData));
          if (cleaned.imageSrc && cleaned.imageSrc.length > 500) {
            // Keep a short marker so we know there was an image, but don't store megabytes
            cleaned.imageSrc = cleaned.imageSrc.substring(0, 200);
          }
          mapDataForDb = cleaned as Json;
        } catch {
          mapDataForDb = proposal.mapData as unknown as Json;
        }
      }

      let proposalId: string | null = null;

      if (proposal.id) {
        // ── UPDATE existing proposal ──
        const update: ProposalUpdate = {
          template_id: proposal.templateId,
          name: proposal.name ?? null,
          form_data: proposal.formData,
          map_data: mapDataForDb,
          inspection_date: proposal.inspectionDate ?? null,
          status: proposal.status ?? "draft",
          client_id: proposal.clientId ?? null,
          session_id: proposal.sessionId ?? null,
        };
        let { error } = await supabase.from("proposals").update(update).eq("id", proposal.id);
        // If map_data column doesn't exist yet, retry without it
        if (error && error.message?.includes("map_data")) {
          console.warn("[useProposals] map_data column not found, saving without it");
          const { map_data: _removed, ...updateWithout } = update;
          void _removed;
          const retry = await supabase.from("proposals").update(updateWithout).eq("id", proposal.id);
          error = retry.error;
        }
        if (error) {
          const msg = `Save failed (update): ${error.message}${error.details ? " — " + error.details : ""}${error.hint ? " — Hint: " + error.hint : ""}`;
          console.error("[useProposals]", msg, error);
          setSaveError(msg);
          return null;
        }
        proposalId = proposal.id;
      } else {
        // ── INSERT new proposal ──
        const insert: ProposalInsert = {
          user_id: user.id,
          template_id: proposal.templateId,
          name: proposal.name ?? null,
          form_data: proposal.formData,
          map_data: mapDataForDb,
          inspection_date: proposal.inspectionDate ?? null,
          status: proposal.status ?? "draft",
          client_id: proposal.clientId ?? null,
          session_id: proposal.sessionId ?? null,
        };
        let { data, error } = await supabase
          .from("proposals")
          .insert(insert)
          .select("id")
          .single();
        // If map_data column doesn't exist yet, retry without it
        if (error && error.message?.includes("map_data")) {
          console.warn("[useProposals] map_data column not found, saving without it");
          const { map_data: _removed, ...insertWithout } = insert;
          void _removed;
          const retry = await supabase
            .from("proposals")
            .insert(insertWithout)
            .select("id")
            .single();
          data = retry.data;
          error = retry.error;
        }
        if (error) {
          const msg = `Save failed (insert): ${error.message}${error.details ? " — " + error.details : ""}${error.hint ? " — Hint: " + error.hint : ""}`;
          console.error("[useProposals]", msg, error);
          setSaveError(msg);
          return null;
        }
        proposalId = data?.id ?? null;
        if (!proposalId) {
          const msg = "Save failed: no proposal ID returned from insert.";
          console.error("[useProposals]", msg);
          setSaveError(msg);
          return null;
        }
      }

      // Save photos if we have a valid proposal ID
      if (proposalId && proposal.photos && proposal.photos.length > 0) {
        try {
          console.log("[useProposals] Saving", proposal.photos.length, "photos for proposal", proposalId);
          await savePhotos(supabase, proposalId, proposal.photos);
          console.log("[useProposals] Photos saved successfully");
        } catch (e) {
          const photoMsg = e instanceof Error ? e.message : String(e);
          console.error("[useProposals] Photo save error:", photoMsg, e);
          // Don't fail the whole save — proposal data is already saved
          // But warn the user so they know photos didn't save
          setSaveError(`Proposal saved but photos failed: ${photoMsg}`);
        }
      }

      console.log("[useProposals] Save successful, proposalId:", proposalId);
      return proposalId;
    },
    [user],
  );

  const load = useCallback(
    async (id: string): Promise<{ proposal: Proposal; photos: PhotoEntry[]; mapData: MapData | null } | null> => {
      if (!user) return null;
      const supabase = createClient();

      // Load proposal + photos in parallel
      const [proposalResult, photosResult] = await Promise.all([
        supabase.from("proposals").select("*").eq("id", id).single(),
        supabase.from("proposal_photos").select("*").eq("proposal_id", id).order("sort_order"),
      ]);

      if (proposalResult.error) {
        console.error("[useProposals] load proposal error:", proposalResult.error.message);
      }
      if (photosResult.error) {
        console.error("[useProposals] load photos error:", photosResult.error.message);
      }

      const proposal = proposalResult.data as Proposal | null;
      if (!proposal) return null;

      // Convert DB photo rows to PhotoEntry objects
      // Use data_url (base64) directly — no Storage URLs needed
      const dbPhotos = (photosResult.data ?? []) as ProposalPhoto[];
      const photos: PhotoEntry[] = dbPhotos.map((p, i) => ({
        id: i + 1,
        src: p.data_url || "",
        caption: p.caption ?? "",
        fileName: p.file_name ?? "",
        zone: p.zone ?? "",
        unitNumber: p.unit_number ?? "",
        customZone: p.custom_zone ?? "",
        concernType: "",
        locationFound: "",
      }));

      // Parse mapData from JSON
      const mapData = proposal.map_data ? (proposal.map_data as unknown as MapData) : null;

      return { proposal, photos, mapData };
    },
    [user],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) return;
      const supabase = createClient();
      // Delete photo rows for this proposal
      await supabase.from("proposal_photos").delete().eq("proposal_id", id);
      // Delete the proposal itself
      const { error } = await supabase.from("proposals").delete().eq("id", id);
      if (error) {
        console.error("[useProposals] delete error:", error.message);
      }
    },
    [user],
  );

  const updateStatus = useCallback(
    async (id: string, status: "draft" | "sent" | "accepted" | "declined") => {
      if (!user) return;
      const supabase = createClient();
      const { error } = await supabase.from("proposals").update({ status }).eq("id", id);
      if (error) {
        console.error("[useProposals] updateStatus error:", error.message);
      }
    },
    [user],
  );

  /** Finalize a proposal: save customer + internal HTML snapshots, update status to "sent" */
  const finalize = useCallback(
    async (params: {
      proposalId: string;
      customerHtml: string;
      internalHtml: string;
      formData: Record<string, string>;
    }): Promise<number | null> => {
      if (!user) return null;
      const supabase = createClient();

      // Determine next version number
      const { data: existing, error: versionError } = await supabase
        .from("proposal_snapshots")
        .select("version_number")
        .eq("proposal_id", params.proposalId)
        .order("version_number", { ascending: false })
        .limit(1);

      if (versionError) {
        console.error("[useProposals] finalize version query error:", versionError.message);
      }

      const nextVersion = existing && existing.length > 0
        ? (existing[0] as { version_number: number }).version_number + 1
        : 1;

      // Insert both snapshots
      const snapshots: ProposalSnapshotInsert[] = [
        {
          proposal_id: params.proposalId,
          user_id: user.id,
          variant: "customer",
          html: params.customerHtml,
          snapshot_data: params.formData,
          version_number: nextVersion,
        },
        {
          proposal_id: params.proposalId,
          user_id: user.id,
          variant: "internal",
          html: params.internalHtml,
          snapshot_data: params.formData,
          version_number: nextVersion,
        },
      ];

      const { error: snapError } = await supabase.from("proposal_snapshots").insert(snapshots);
      if (snapError) {
        const msg = `Finalize failed (snapshots): ${snapError.message}`;
        console.error("[useProposals]", msg, snapError);
        setSaveError(msg);
        return null;
      }

      // Update proposal status to "sent"
      const { error: statusError } = await supabase
        .from("proposals")
        .update({ status: "sent" })
        .eq("id", params.proposalId);
      if (statusError) {
        console.error("[useProposals] finalize status update error:", statusError.message);
      }

      return nextVersion;
    },
    [user],
  );

  return { proposals, loading, saveError, list, save, load, remove, updateStatus, finalize };
}

// ── Internal helpers ──

/**
 * Save photos directly to proposal_photos table with base64 data_url.
 * No Supabase Storage needed — simpler and avoids bucket/policy complexity.
 */
async function savePhotos(
  supabase: ReturnType<typeof createClient>,
  proposalId: string,
  photos: PhotoEntry[],
): Promise<void> {
  // Delete existing photos for this proposal (simple replace strategy)
  const { error: deleteErr } = await supabase
    .from("proposal_photos")
    .delete()
    .eq("proposal_id", proposalId);

  if (deleteErr) {
    console.warn("[savePhotos] Delete old photos failed:", deleteErr.message);
    // Continue anyway — inserts may still work
  }

  // Insert each photo with base64 data directly in data_url column
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    console.log(`[savePhotos] Inserting photo ${i + 1}/${photos.length}, src length: ${photo.src.length}`);

    const { error: insertErr } = await supabase.from("proposal_photos").insert({
      proposal_id: proposalId,
      storage_path: `inline_${i}`,  // placeholder — not used for inline storage
      file_name: photo.fileName || `photo_${i + 1}.jpg`,
      caption: photo.caption || "",
      zone: photo.zone || "",
      unit_number: photo.unitNumber || "",
      custom_zone: photo.customZone || "",
      sort_order: i,
      data_url: photo.src,  // Store base64 data URL directly in DB
    });

    if (insertErr) {
      console.error(`[savePhotos] Insert failed for photo ${i + 1}:`, insertErr.message);
      // If data_url column doesn't exist, try without it (fallback)
      if (insertErr.message?.includes("data_url")) {
        console.warn("[savePhotos] data_url column not found — run the migration SQL! Photo will be skipped.");
      }
    } else {
      console.log(`[savePhotos] Photo ${i + 1} saved to DB`);
    }
  }
}
