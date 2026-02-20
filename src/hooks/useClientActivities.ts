"use client";
import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { createClient } from "@/lib/supabase/client";
import type { ClientActivity, ClientActivityInsert } from "@/lib/supabase/database.types";

export function useClientActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const list = useCallback(
    async (clientId: string) => {
      if (!user) return [];
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("client_activities")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false });
        if (error) {
          console.error("[useClientActivities] list error:", error.message);
        }
        const items = (data ?? []) as ClientActivity[];
        setActivities(items);
        return items;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  const add = useCallback(
    async (
      clientId: string,
      type: string,
      content: string,
      followUpDate?: string | null,
    ): Promise<string | null> => {
      if (!user) return null;
      const supabase = createClient();
      const insert: ClientActivityInsert = {
        user_id: user.id,
        client_id: clientId,
        type,
        content,
        follow_up_date: followUpDate ?? null,
      };
      const { data, error } = await supabase
        .from("client_activities")
        .insert(insert)
        .select("id")
        .single();
      if (error) {
        console.error("[useClientActivities] add error:", error.message);
        return null;
      }
      return data?.id ?? null;
    },
    [user],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) return;
      const supabase = createClient();
      const { error } = await supabase
        .from("client_activities")
        .delete()
        .eq("id", id);
      if (error) {
        console.error("[useClientActivities] remove error:", error.message);
      }
    },
    [user],
  );

  return { activities, loading, list, add, remove };
}
