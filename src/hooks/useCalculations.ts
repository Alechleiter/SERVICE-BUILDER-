"use client";
import { useCallback } from "react";
import { useProposals, type ProposalListItem } from "./useProposals";
import type { CalculationData } from "@/lib/cost-of-inaction/types";
import { COI_DATA_KEY, COI_TEMPLATE_ID } from "@/lib/cost-of-inaction/types";

/**
 * Hook for Cost of Inaction calculations.
 * Wraps useProposals with COI-specific serialization.
 * Data is stored in the proposals table with template_id = "cost_of_inaction".
 */
export function useCalculations() {
  const {
    proposals,
    loading,
    saveError,
    list: listAll,
    save: saveProposal,
    load: loadProposal,
    remove,
  } = useProposals();

  /** List only cost-of-inaction entries */
  const list = useCallback(async (): Promise<ProposalListItem[]> => {
    const all = await listAll();
    return all.filter((p) => p.template_id === COI_TEMPLATE_ID);
  }, [listAll]);

  /** Save a calculation */
  const save = useCallback(
    async (
      data: CalculationData,
      id?: string,
      clientId?: string,
    ): Promise<string | null> => {
      const formData: Record<string, string> = {
        [COI_DATA_KEY]: JSON.stringify(data),
      };
      return saveProposal({
        id,
        templateId: COI_TEMPLATE_ID,
        name: data.propertyName || data.industryName,
        formData,
        clientId,
      });
    },
    [saveProposal],
  );

  /** Load a calculation */
  const load = useCallback(
    async (id: string): Promise<CalculationData | null> => {
      const result = await loadProposal(id);
      if (!result) return null;
      const raw = (result.proposal.form_data ?? {}) as Record<string, string>;
      if (!raw[COI_DATA_KEY]) return null;
      try {
        return JSON.parse(raw[COI_DATA_KEY]) as CalculationData;
      } catch {
        console.error("[useCalculations] Failed to parse COI data");
        return null;
      }
    },
    [loadProposal],
  );

  return {
    calculations: proposals.filter((p) => p.template_id === COI_TEMPLATE_ID),
    loading,
    saveError,
    list,
    save,
    load,
    remove,
  };
}
