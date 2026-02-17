"use client";
import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { createClient } from "@/lib/supabase/client";
import type { Client, ClientInsert, ClientUpdate } from "@/lib/supabase/database.types";

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const list = useCallback(async () => {
    if (!user) return [];
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      const items = (data ?? []) as Client[];
      setClients(items);
      return items;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const save = useCallback(
    async (client: {
      id?: string;
      name: string;
      address?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      verticalId?: string;
      notes?: string;
    }): Promise<string | null> => {
      if (!user) return null;
      const supabase = createClient();

      if (client.id) {
        const update: ClientUpdate = {
          name: client.name,
          address: client.address ?? null,
          contact_name: client.contactName ?? null,
          contact_email: client.contactEmail ?? null,
          contact_phone: client.contactPhone ?? null,
          vertical_id: client.verticalId ?? null,
          notes: client.notes ?? null,
        };
        await supabase.from("clients").update(update).eq("id", client.id);
        return client.id;
      } else {
        const insert: ClientInsert = {
          user_id: user.id,
          name: client.name,
          address: client.address ?? null,
          contact_name: client.contactName ?? null,
          contact_email: client.contactEmail ?? null,
          contact_phone: client.contactPhone ?? null,
          vertical_id: client.verticalId ?? null,
          notes: client.notes ?? null,
        };
        const { data } = await supabase
          .from("clients")
          .insert(insert)
          .select("id")
          .single();
        return data?.id ?? null;
      }
    },
    [user],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) return;
      const supabase = createClient();
      await supabase.from("clients").delete().eq("id", id);
    },
    [user],
  );

  return { clients, loading, list, save, remove };
}
