import { supabase } from './supabase';

export async function uploadAvatar(userId: string, uri: string, mimeType?: string | null): Promise<string> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Could not read the selected photo.');
  const contentType = mimeType || response.headers.get('content-type') || 'image/jpeg';
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[contentType];
  if (!extension) throw new Error('Choose a JPEG, PNG, WebP, or GIF photo.');
  const path = `${userId}/${Date.now()}.${extension}`;
  const bucket = supabase.storage.from('avatars');
  const { error } = await bucket.upload(path, await response.arrayBuffer(), { contentType });
  if (error) throw error;
  const url = bucket.getPublicUrl(path).data.publicUrl;
  const { error: updateError } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId).select('id').single();
  if (updateError) {
    await bucket.remove([path]);
    throw updateError;
  }
  return url;
}
