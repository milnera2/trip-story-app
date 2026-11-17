import { supabase } from './supabase';

const BUCKET = 'trip-photos';

// Photos live in a private bucket, so each one is shown through a short-lived signed link.
export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  const out: Record<string, string> = {};
  data?.forEach((d) => {
    if (d.path && d.signedUrl) out[d.path] = d.signedUrl;
  });
  return out;
}

export type Picked = { uri: string; kind: 'photo' | 'video'; mime?: string };

export const MAX_VIDEO_SECONDS = 30;
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

const EXT: Record<string, string> = { 'video/quicktime': 'mov', 'video/webm': 'webm', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'image/jpeg': 'jpg' };

export async function uploadMedia(tripId: string, stopId: string, item: Picked): Promise<string> {
  const body = await (await fetch(item.uri)).arrayBuffer();
  const mime = item.mime && EXT[item.mime] ? item.mime : item.kind === 'video' ? 'video/mp4' : 'image/jpeg';
  const path = `${tripId}/${stopId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXT[mime]}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, { contentType: mime });
  if (error) throw error;
  return path;
}
