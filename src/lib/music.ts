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
const METADATA_FILE = 'metadata.json';
export const AUDIO_EXTS = ['mp3', 'm4a', 'ogg', 'wav'];
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp'];

type TrackFilesMap = Map<string, { audio?: string; cover?: string; size: number }>;

interface TrackMeta {
  title: string;
  artist?: string;
}

type MetadataMap = Record<string, TrackMeta>;

function publicUrl(name: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${url}/storage/v1/object/public/${BUCKET}/${name}`;
}

// Lee metadata.json del bucket (si existe). No lanza: si falla/404 devuelve {}.
export async function readTrackMetadata(): Promise<MetadataMap> {
  try {
    const res = await fetch(publicUrl(METADATA_FILE), { cache: 'no-store' });
    if (!res.ok) return {};
    const data = await res.json();
    return data && typeof data === 'object' ? (data as MetadataMap) : {};
  } catch {
    return {};
  }
}

export async function writeTrackMetadata(meta: MetadataMap): Promise<void> {
  if (!supabaseAdmin) return;
  const body = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
  await supabaseAdmin.storage
    .from(BUCKET)
    .upload(METADATA_FILE, body, { contentType: 'application/json', upsert: true, cacheControl: '3600' });
}

function fallbackTitle(base: string): string {
  return base.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

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

  const byBase: TrackFilesMap = new Map();

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

  const meta = await readTrackMetadata();

  return Array.from(byBase.entries())
    .filter(([, entry]) => entry.audio)
    .map(([base, entry]) => ({
      id: base,
      title: meta[base]?.title || fallbackTitle(base),
      ...(meta[base]?.artist ? { artist: meta[base]!.artist } : {}),
      audioUrl: publicUrl(entry.audio!),
      coverUrl: entry.cover ? publicUrl(entry.cover) : null,
      size: entry.size,
    }));
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

  // Limpia la entrada del metadata.json.
  const meta = await readTrackMetadata();
  if (meta[slug]) {
    delete meta[slug];
    await writeTrackMetadata(meta);
  }

  if (error) return { success: false, error: error.message };
  return { success: true };
}