import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "proposal-photos";

/**
 * Upload a photo to Supabase Storage.
 * Path: {userId}/{proposalId}/{timestamp}_{filename}
 */
export async function uploadProposalPhoto(
  supabase: SupabaseClient,
  userId: string,
  proposalId: string,
  file: File,
): Promise<{ storagePath: string; publicUrl: string } | null> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${userId}/${proposalId}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Photo upload failed:", error.message);
    return null;
  }

  const url = getPhotoUrl(supabase, storagePath);
  return { storagePath, publicUrl: url };
}

/**
 * Delete a photo from Supabase Storage.
 */
export async function deleteProposalPhoto(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<void> {
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

/**
 * Get a signed URL for a private photo (valid 1 hour).
 */
export function getPhotoUrl(
  supabase: SupabaseClient,
  storagePath: string,
): string {
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  // If the bucket is private, use createSignedUrl instead:
  // const { data } = await supabase.storage
  //   .from(BUCKET)
  //   .createSignedUrl(storagePath, 3600);
  // return data?.signedUrl ?? "";

  return data?.publicUrl ?? "";
}

/**
 * Get a signed (expiring) URL for a private photo.
 */
export async function getPhotoSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresIn = 3600,
): Promise<string> {
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  return data?.signedUrl ?? "";
}
