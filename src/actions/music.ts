'use server';

import { revalidatePath } from 'next/cache';
import { parseBuffer } from 'music-metadata';
import { checkIsAdmin } from '@/lib/auth';
import { checkDevPassword } from '@/lib/dev';
import { listMusicTracks, uploadTrack, deleteTrack, MusicTrack, AUDIO_EXTS } from '@/lib/music';
import { writeAuditLog } from '@/lib/audit';

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

// Dev: sube/reemplaza una canción y su portada al bucket 'music'.
export async function devUploadTrackAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const devPassword = (formData.get('devPassword') as string) || '';
  if (!(await authorize(devPassword))) {
    return { success: false, error: 'Contraseña de desarrollo incorrecta.' };
  }

  const title = (formData.get('title') as string || '').trim();
  const artist = (formData.get('artist') as string || '').trim();
  const audio = formData.get('audio') as File | null;
  const cover = formData.get('cover') as File | null;

  if (!audio || !audio.size) return { success: false, error: 'Selecciona un archivo de audio.' };
  if (!audio.type.startsWith('audio/')) return { success: false, error: 'El archivo de audio no es válido.' };
  if (audio.size > MAX_AUDIO_BYTES) return { success: false, error: 'El audio supera 25 MB.' };
  if (cover && cover.size > MAX_COVER_BYTES) return { success: false, error: 'La portada supera 5 MB.' };

  const audioBuffer = await audio.arrayBuffer();

  // --- Extracción automática de metadatos: título, artista y portada del MP3 ---
  let finalTitle = title;
  let finalArtist = artist;
  let coverBuffer = cover ? await cover.arrayBuffer() : null;
  let coverType = cover?.type;

  const dot = audio.name.lastIndexOf('.');
  const fileExt = dot >= 0 ? audio.name.slice(dot + 1).toLowerCase() : '';
  const coverFallbackNeed = !coverBuffer;
  const needMeta = !finalTitle || !finalArtist || coverFallbackNeed;

  if (needMeta) {
    try {
      const md = await parseBuffer(Buffer.from(audioBuffer), { mimeType: audio.type, size: audio.size });
      if (!finalTitle) finalTitle = (md.common.title || '').trim();
      if (!finalArtist) finalArtist = (md.common.artist || '').trim();
      if (coverFallbackNeed && md.common.picture && md.common.picture.length > 0) {
        const pic = md.common.picture[0];
        const data = pic.data as Uint8Array;
        coverBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
        coverType = pic.format || 'image/jpeg';
      }
    } catch {
      // Sin metadatos legibles; seguimos con los valores manuales (o el nombre del archivo).
    }
  }

  // Título por defecto: nombre del archivo sin extensión.
  if (!finalTitle) {
    const base = dot >= 0 ? audio.name.slice(0, dot) : audio.name;
    finalTitle = base.replace(/[-_]+/g, ' ').trim() || 'Sin título';
  }

  const { slug, error } = await uploadTrack({
    title: finalTitle,
    artist: finalArtist,
    audio: audioBuffer,
    audioType: audio.type,
    audioExt: AUDIO_EXTS.includes(fileExt) ? fileExt : fileExt || 'mp3',
    cover: coverBuffer,
    coverType,
  });

  if (error) return { success: false, error };

  writeAuditLog({
    action: 'MUSIC_UPLOAD',
    details: JSON.stringify({ title: finalTitle, artist: finalArtist || null, slug }),
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
    return { success: false, error: 'Contraseña de desarrollo incorrecta.' };
  }

  const res = await deleteTrack(slug);
  if (!res.success) return { success: false, error: res.error };

  writeAuditLog({ action: 'MUSIC_DELETE', details: slug });

  revalidatePath('/');
  return { success: true };
}