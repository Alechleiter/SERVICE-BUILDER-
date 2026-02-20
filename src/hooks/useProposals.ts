"use client";
import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { createClient } from "@/lib/supabase/client";
import type { Proposal, ProposalInsert, ProposalUpdate, ProposalSnapshotInsert } from "@/lib/supabase/database.types";
import type { PhotoEntry, MapData } from "@/lib/proposals/types";
import type { Json } from "@/lib/supabase/database.types";

export interface ProposalListItem {
  id: string;
  name: string | null;
  template_id: string;
  status: string;
  updated_at: string;
  client_id: string | null;
  bucket: string | null;
}

/**
 * Key used inside form_data to store serialized photos JSON.
 * Photos are stored as a JSON string inside form_data so we don't need
 * any new database columns or Supabase Storage buckets.
 */
const PHOTOS_KEY = "__photos_json";
const MAP_KEY = "__map_data_json";

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
        .select("id, name, template_id, status, updated_at, client_id, bucket")
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

      // ── Embed photos + mapData directly into form_data as JSON strings ──
      // This avoids needing any extra DB columns or Supabase Storage
      const formDataForDb: Record<string, string> = { ...proposal.formData };

      // Store photos as JSON inside form_data
      if (proposal.photos && proposal.photos.length > 0) {
        try {
          formDataForDb[PHOTOS_KEY] = JSON.stringify(proposal.photos);
          console.log("[useProposals] Embedded", proposal.photos.length, "photos in form_data, total JSON length:", formDataForDb[PHOTOS_KEY].length);
        } catch (e) {
          console.error("[useProposals] Failed to serialize photos:", e);
        }
      }

      // Store mapData as JSON inside form_data (stripped of huge imageSrc)
      if (proposal.mapData) {
        try {
          const cleaned = JSON.parse(JSON.stringify(proposal.mapData));
          if (cleaned.imageSrc && cleaned.imageSrc.length > 500) {
            cleaned.imageSrc = cleaned.imageSrc.substring(0, 200);
          }
          formDataForDb[MAP_KEY] = JSON.stringify(cleaned);
        } catch (e) {
          console.error("[useProposals] Failed to serialize mapData:", e);
        }
      }

      let proposalId: string | null = null;

      if (proposal.id) {
        // ── UPDATE existing proposal ──
        const update: ProposalUpdate = {
          template_id: proposal.templateId,
          name: proposal.name ?? null,
          form_data: formDataForDb as unknown as Json,
          inspection_date: proposal.inspectionDate ?? null,
          status: proposal.status ?? "draft",
          client_id: proposal.clientId ?? null,
          session_id: proposal.sessionId ?? null,
        };
        const { error } = await supabase.from("proposals").update(update).eq("id", proposal.id);
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
          form_data: formDataForDb as unknown as Json,
          inspection_date: proposal.inspectionDate ?? null,
          status: proposal.status ?? "draft",
          client_id: proposal.clientId ?? null,
          session_id: proposal.sessionId ?? null,
        };
        const { data, error } = await supabase
          .from("proposals")
          .insert(insert)
          .select("id")
          .single();
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

      console.log("[useProposals] Save successful, proposalId:", proposalId);
      return proposalId;
    },
    [user],
  );

  const load = useCallback(
    async (id: string): Promise<{ proposal: Proposal; photos: PhotoEntry[]; mapData: MapData | null } | null> => {
      if (!user) return null;
      const supabase = createClient();

      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("[useProposals] load error:", error.message);
      }
      if (!data) return null;

      // Cast to Proposal type (select * returns all columns)
      const proposal = data as unknown as Proposal;

      // Extract photos and mapData from form_data
      const rawFormData = (proposal.form_data ?? {}) as Record<string, string>;
      let photos: PhotoEntry[] = [];
      let mapData: MapData | null = null;

      // Parse embedded photos
      if (rawFormData[PHOTOS_KEY]) {
        try {
          photos = JSON.parse(rawFormData[PHOTOS_KEY]) as PhotoEntry[];
          console.log("[useProposals] Loaded", photos.length, "photos from form_data");
        } catch (e) {
          console.error("[useProposals] Failed to parse embedded photos:", e);
        }
      }

      // Parse embedded mapData
      if (rawFormData[MAP_KEY]) {
        try {
          mapData = JSON.parse(rawFormData[MAP_KEY]) as MapData;
        } catch (e) {
          console.error("[useProposals] Failed to parse embedded mapData:", e);
        }
      }

      // Strip internal keys from form_data so pages get clean formData
      const cleanFormData: Record<string, string> = {};
      for (const [k, v] of Object.entries(rawFormData)) {
        if (k !== PHOTOS_KEY && k !== MAP_KEY) {
          cleanFormData[k] = v;
        }
      }
      // Override form_data on the proposal with cleaned version
      const cleanProposal = { ...proposal, form_data: cleanFormData as unknown as Json };

      return { proposal: cleanProposal as Proposal, photos, mapData };
    },
    [user],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) return;
      const supabase = createClient();
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

  /** Quick-assign a bucket label to a proposal */
  const updateBucket = useCallback(
    async (id: string, bucket: string | null) => {
      if (!user) return;
      const supabase = createClient();
      const { error } = await supabase.from("proposals").update({ bucket }).eq("id", id);
      if (error) {
        console.error("[useProposals] updateBucket error:", error.message);
      }
    },
    [user],
  );

  /** Fetch all proposals for a given client (returns directly, no state) */
  const listByClient = useCallback(
    async (clientId: string): Promise<ProposalListItem[]> => {
      if (!user) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("proposals")
        .select("id, name, template_id, status, updated_at, client_id, bucket")
        .eq("user_id", user.id)
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false });
      if (error) {
        console.error("[useProposals] listByClient error:", error.message);
      }
      return (data ?? []) as ProposalListItem[];
    },
    [user],
  );

  return { proposals, loading, saveError, list, save, load, remove, updateStatus, finalize, updateBucket, listByClient };
}
