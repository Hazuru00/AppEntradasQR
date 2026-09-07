'use server';

import { revalidatePath } from 'next/cache';
import { checkIsAdmin } from '@/lib/auth';
import { checkDevPassword } from '@/lib/dev';
import { listMusicTracks, deleteTrack, MusicTrack, AUDIO_EXTS, readTrackMetadata, writeTrackMetadata, slugifyTitle } from '@/lib/music';
import { supabaseAdmin } from '@/lib/supabase';
import { writeAuditLog } from '@/lib/audit';

const BUCKET = 'music';
const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_COVER_BYTES = 5 * 1024 * 1024; // 5 MB

// Pública: devuelve la playlist para que suene en la web.
export async function getMusicPlaylistAction(): Promise<{ success: boolean; tracks: MusicTrack[]; error?: string }> {
  const tracks = await listMusicTracks();
  return { success: true, tracks };
}

async function authorize(devPassword: string): Promise<boolean> {
  if (!(await checkIsAdmin())) return false;
  return checkDevPassword(devPassword);
}

export interface SignedUpload {
  path: string;
  token: string;
  uploadUrl: string;
}

async function makeSignedUpload(path: string): Promise<SignedUpload | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
  if (error || !data) return null;
  return { path: data.path, token: data.token, uploadUrl: data.signedUrl };
}

export interface MusicUploadRequestInput {
  title: string;
  artist: string;
  audioName: string;
  audioType: string;
  audioSize: number;
  coverName?: string;
  coverType?: string;
  coverSize?: number;
}

// Dev: valida la credencial y genera URLs firmadas para que el navegador suba
// el audio/portada DIRECTAMENTE a Supabase (Vercel corta cuerpos >4.5 MB).
export async function devUploadRequestAction(
  devPassword: string,
  input: MusicUploadRequestInput
): Promise<{ success: boolean; slug?: string; audio?: SignedUpload; cover?: SignedUpload | null; error?: string }> {
  if (!(await authorize(devPassword))) {
    return { success: false, error: 'Contraseña de desarrollo incorrecta o sesión expirada.' };
  }

  const dot = input.audioName.lastIndexOf('.');
  const audioExt = dot >= 0 ? input.audioName.slice(dot + 1).toLowerCase() : '';
  if (!AUDIO_EXTS.includes(audioExt)) return { success: false, error: 'El archivo de audio no es válido.' };
  if (input.audioSize > MAX_AUDIO_BYTES) return { success: false, error: 'El audio supera 25 MB.' };

  let slug = slugifyTitle(input.title);
  if (!slug) {
    const base = dot >= 0 ? input.audioName.slice(0, dot) : input.audioName;
    slug = slugifyTitle(base.replace(/[-_]+/g, ' ')) || 'cancion';
  }

  const audio = await makeSignedUpload(`${slug}.${audioExt}`);
  if (!audio) return { success: false, error: 'No se pudo preparar la subida (revisa Storage/Supabase).' };

  let cover: SignedUpload | null = null;
  if (input.coverName) {
    if (!input.coverType) return { success: false, error: 'Tipo de portada inválido.' };
    if (!input.coverSize) return { success: false, error: 'Tamaño de portada inválido.' };
    if (input.coverSize > MAX_COVER_BYTES) return { success: false, error: 'La portada supera 5 MB.' };
    const cDot = input.coverName.lastIndexOf('.');
    const cExt = (cDot >= 0 ? input.coverName.slice(cDot + 1) : 'jpg').toLowerCase();
    const cleanExt = cExt === 'jpeg' ? 'jpg' : cExt;
    cover = await makeSignedUpload(`${slug}.${cleanExt}`);
    if (!cover) return { success: false, error: 'No se pudo preparar la subida de la portada.' };
  }

  return { success: true, slug, audio, cover };
}

// Dev: finaliza la subida guardando los metadatos (título/artista) y la playlist.
export async function devUploadTrackAction(
  devPassword: string,
  input: { slug: string; title: string; artist: string }
): Promise<{ success: boolean; error?: string }> {
  if (!(await authorize(devPassword))) {
    return { success: false, error: 'Contraseña de desarrollo incorrecta o sesión expirada.' };
  }
  if (!input.slug) return { success: false, error: 'Slug inválido.' };

  const meta = await readTrackMetadata();
  meta[input.slug] = {
    title: input.title || input.slug,
    ...(input.artist ? { artist: input.artist } : {}),
  };
  await writeTrackMetadata(meta);

  writeAuditLog({
    action: 'MUSIC_UPLOAD',
    details: JSON.stringify({ title: input.title || input.slug, artist: input.artist || null, slug: input.slug }),
  });

  revalidatePath('/');
  return { success: true };
}

// Dev: borra una canción (audio + portada) del bucket.
export async function devDeleteTrackAction(
  slug: string,
  devPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await authorize(devPassword))) {
    return { success: false, error: 'Contraseña de desarrollo incorrecta o sesión expirada.' };
  }

  const res = await deleteTrack(slug);
  if (!res.success) return { success: false, error: res.error };

  writeAuditLog({ action: 'MUSIC_DELETE', details: slug });

  revalidatePath('/');
  return { success: true };
}