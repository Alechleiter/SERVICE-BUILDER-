"use client";
import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { createClient } from "@/lib/supabase/client";
import type { Proposal, ProposalInsert, ProposalUpdate, ProposalSnapshotInsert } from "@/lib/supabase/database.types";

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

  const list = useCallback(async () => {
    if (!user) return [];
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("proposals")
        .select("id, name, template_id, status, updated_at, client_id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
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
    }): Promise<string | null> => {
      if (!user) return null;
      const supabase = createClient();

      if (proposal.id) {
        const update: ProposalUpdate = {
          template_id: proposal.templateId,
          name: proposal.name ?? null,
          form_data: proposal.formData,
          inspection_date: proposal.inspectionDate ?? null,
          status: proposal.status ?? "draft",
          client_id: proposal.clientId ?? null,
          session_id: proposal.sessionId ?? null,
        };
        await supabase.from("proposals").update(update).eq("id", proposal.id);
        return proposal.id;
      } else {
        const insert: ProposalInsert = {
          user_id: user.id,
          template_id: proposal.templateId,
          name: proposal.name ?? null,
          form_data: proposal.formData,
          inspection_date: proposal.inspectionDate ?? null,
          status: proposal.status ?? "draft",
          client_id: proposal.clientId ?? null,
          session_id: proposal.sessionId ?? null,
        };
        const { data } = await supabase
          .from("proposals")
          .insert(insert)
          .select("id")
          .single();
        return data?.id ?? null;
      }
    },
    [user],
  );

  const load = useCallback(
    async (id: string): Promise<Proposal | null> => {
      if (!user) return null;
      const supabase = createClient();
      const { data } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", id)
        .single();
      return (data as Proposal) ?? null;
    },
    [user],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) return;
      const supabase = createClient();
      await supabase.from("proposals").delete().eq("id", id);
    },
    [user],
  );

  const updateStatus = useCallback(
    async (id: string, status: "draft" | "sent" | "accepted" | "declined") => {
      if (!user) return;
      const supabase = createClient();
      await supabase.from("proposals").update({ status }).eq("id", id);
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
      const { data: existing } = await supabase
        .from("proposal_snapshots")
        .select("version_number")
        .eq("proposal_id", params.proposalId)
        .order("version_number", { ascending: false })
        .limit(1);

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

      await supabase.from("proposal_snapshots").insert(snapshots);

      // Update proposal status to "sent"
      await supabase
        .from("proposals")
        .update({ status: "sent" })
        .eq("id", params.proposalId);

      return nextVersion;
    },
    [user],
  );

  return { proposals, loading, list, save, load, remove, updateStatus, finalize };
}
