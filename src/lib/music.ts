// src/lib/music.ts
// Gestión de la playlist del evento en Supabase Storage (bucket público 'music').
// Convención de nombres: <slug>.mp3 + portada <slug>.jpg|.png|.webp
import { supabaseAdmin } from './supabase';

export interface MusicTrack {
  id: string; // slug (nombre base del archivo)
  title: string;
  artist?: string;
  audioUrl: string;
  coverUrl: string | null;
  size: number;
}

const BUCKET = 'music';
const AUDIO_EXTS = ['mp3', 'm4a', 'ogg', 'wav'];
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp'];

export function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function publicUrl(name: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${url}/storage/v1/object/public/${BUCKET}/${name}`;
}

export async function listMusicTracks(): Promise<MusicTrack[]> {
  if (!supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).list('', {
    limit: 100,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error || !data) {
    console.error('Error listando música:', error?.message);
    return [];
  }

  const byBase = new Map<string, { audio?: string; cover?: string; size: number }>();

  for (const file of data) {
    const dot = file.name.lastIndexOf('.');
    if (dot <= 0) continue;
    const base = file.name.slice(0, dot);
    const ext = file.name.slice(dot + 1).toLowerCase();

    const entry = byBase.get(base) || { size: 0 };
    if (AUDIO_EXTS.includes(ext)) {
      entry.audio = file.name;
      entry.size = file.metadata?.size || 0;
    } else if (IMAGE_EXTS.includes(ext)) {
      entry.cover = file.name;
    }
    byBase.set(base, entry);
  }

  return Array.from(byBase.entries())
    .filter(([, entry]) => entry.audio)
    .map(([base, entry]) => ({
      id: base,
      title: base.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      audioUrl: publicUrl(entry.audio!),
      coverUrl: entry.cover ? publicUrl(entry.cover) : null,
      size: entry.size,
    }));
}

export interface UploadTrackInput {
  title: string;
  artist?: string;
  audio: ArrayBuffer;
  audioType: string;
  cover?: ArrayBuffer | null;
  coverType?: string;
}

// Sube (o reemplaza) una canción y su portada al bucket. Retorna el slug.
export async function uploadTrack(input: UploadTrackInput): Promise<{ slug: string; error?: string }> {
  if (!supabaseAdmin) return { slug: '', error: 'Supabase no está configurado.' };

  const slug = slugifyTitle(input.title);
  if (!slug) return { slug: '', error: 'Título inválido para generar el nombre del archivo.' };

  const audioName = `${slug}.mp3`;
  const { error: audioErr } = await supabaseAdmin.storage.from(BUCKET).upload(audioName, input.audio, {
    contentType: input.audioType || 'audio/mpeg',
    upsert: true,
  });
  if (audioErr) return { slug: '', error: `Error subiendo audio: ${audioErr.message}` };

  if (input.cover) {
    const coverExt = (input.coverType || 'image/jpeg').split('/')[1] || 'jpg';
    const coverName = `${slug}.${coverExt === 'jpeg' ? 'jpg' : coverExt}`;
    const { error: coverErr } = await supabaseAdmin.storage.from(BUCKET).upload(coverName, input.cover, {
      contentType: input.coverType || 'image/jpeg',
      upsert: true,
    });
    if (coverErr) console.warn('Error subiendo portada:', coverErr.message);
  }

  return { slug };
}

export async function deleteTrack(slug: string): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Supabase no está configurado.' };
  if (!slug) return { success: false, error: 'Slug inválido.' };

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).list('', {
    search: slug,
    limit: 20,
  });

  const toDelete = (data || []).filter((f) => {
    const base = f.name.slice(0, f.name.lastIndexOf('.'));
    return base === slug;
  });

  if (toDelete.length > 0) {
    const paths = toDelete.map((f) => f.name);
    const { error: delErr } = await supabaseAdmin.storage.from(BUCKET).remove(paths);
    if (delErr) return { success: false, error: `Error borrando: ${delErr.message}` };
  }

  if (error) return { success: false, error: error.message };
  return { success: true };
}