'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Disc3,
  ListMusic,
} from 'lucide-react';
import { MusicTrack } from '@/lib/music';
import { getMusicPlaylistAction } from '@/actions/music';

export function CassettePlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [listOpen, setListOpen] = useState(false);
  const autoplayAttemptedRef = useRef(false);

  const current: MusicTrack | undefined = tracks[currentIdx];

  const attemptAutoplay = useCallback(() => {
    if (autoplayAttemptedRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      autoplayAttemptedRef.current = true;
      return;
    }
    audio
      .play()
      .then(() => {
        autoplayAttemptedRef.current = true;
      })
      .catch(() => {
        autoplayAttemptedRef.current = true;
      });
  }, []);

  useEffect(() => {
    if (loading || tracks.length === 0) return;

    // Arquitectura de autoplay: la mayoría de navegadores bloquean reproducir
    // audio con sonido sin interacción previa. Lo intentamos al entrar; si lo
    // bloquean, arranca en cuanto el usuario haga su primer gesto (click/tap/tecla).
    const onGesture = () => attemptAutoplay();
    attemptAutoplay();
    document.addEventListener('pointerdown', onGesture);
    document.addEventListener('keydown', onGesture);
    return () => {
      document.removeEventListener('pointerdown', onGesture);
      document.removeEventListener('keydown', onGesture);
    };
  }, [loading, tracks.length, attemptAutoplay]);

  useEffect(() => {
    let cancelled = false;
    getMusicPlaylistAction()
      .then((res) => {
        if (!cancelled && res.tracks.length > 0) setTracks(res.tracks);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const artistLabel = useMemo(
    () =>
      tracks.length > 0
        ? (tracks[currentIdx]?.title || '') + (tracks.length > 1 ? ` (${currentIdx + 1}/${tracks.length})` : '')
        : '',
    [tracks, currentIdx]
  );

  if (loading) {
    return null;
  }

  if (tracks.length === 0) {
    return null;
  }

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !current) return;

    if (audio.paused) {
      audio.play().catch(() => {});
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const playAt = (i: number) => {
    const idx = (i + tracks.length) % tracks.length;
    setCurrentIdx(idx);
    const audio = audioRef.current;
    if (audio) {
      audio.load();
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  const handleEnded = () => {
    if (tracks.length > 1) {
      playAt((currentIdx + 1) % tracks.length);
    } else {
      setPlaying(false);
      if (audioRef.current) audioRef.current.currentTime = 0;
    }
  };

  const trackSrc = current ? `${current.audioUrl}#t=${currentIdx}` : '#';

  return (
    <>
      <audio
        ref={audioRef}
        src={trackSrc}
        onEnded={handleEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        preload="auto"
      />

      <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 z-40">
        <div className="win98-box overflow-hidden shadow-2xl sm:w-[380px] ml-auto">
          <div className="win98-titlebar">
            <div className="flex items-center gap-1.5">
              <Disc3 className="w-3.5 h-3.5 text-white" />
              <span className="text-xs">MIXTAPE.EXE - [Cassette del Evento]</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setListOpen(!listOpen)} className="win98-winbtn" title="Playlist">
                <ListMusic className="w-3 h-3" />
              </button>
              <div className="win98-winbtn">✕</div>
            </div>
          </div>

          {listOpen ? (
            <div className="bg-[#1f2029] max-h-56 overflow-y-auto divide-y divide-[#262836]">
              {tracks.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => playAt(i)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/[0.05] transition-colors ${
                    i === currentIdx ? 'bg-white/[0.07]' : ''
                  }`}
                >
                  <div className="w-9 h-9 bg-[#121318] border border-[#2e3142] shrink-0 overflow-hidden">
                    {t.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Disc3 className="w-4 h-4 text-[#8f92a8] m-auto mt-2.5" />
                    )}
                  </div>
                  <span className={`text-xs truncate ${i === currentIdx ? 'text-white font-bold' : 'text-[#8f92a8]'}`}>
                    {t.title}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-[#1f2029] flex items-center gap-3">
              <div className="w-12 h-12 bg-[#121318] border-2 border-[#5a5d72] shrink-0 overflow-hidden relative">
                {current?.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={current.coverUrl} alt="" className={`w-full h-full object-cover ${playing ? 'animate-[spin_2.8s_linear_infinite]' : ''}`} />
                ) : (
                  <Disc3 className={`w-6 h-6 text-[#b5a642] m-auto mt-3 ${playing ? 'animate-spin' : ''}`} />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] text-[#8f92a8] uppercase block">Sonando ahora</span>
                <span className="block text-xs font-bold text-white truncate">{artistLabel}</span>
                <div className="w-full h-1.5 win98-sunken">
                  <div className="h-full bg-[#457b9d]" style={{ width: '35%' }} />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-2 bg-[#181922]">
            <button
              type="button"
              onClick={() => playAt(currentIdx - 1)}
              className="win98-btn py-1 px-2 text-xs"
              title="Anterior"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="win98-btn win98-btn-primary py-1 px-3 text-xs flex items-center gap-1"
              title={playing ? 'Pausar' : 'Reproducir'}
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => playAt(currentIdx + 1)}
              className="win98-btn py-1 px-2 text-xs"
              title="Siguiente"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => {
                const next = volume > 0 ? 0 : 0.8;
                setVolume(next);
              }}
              className="win98-btn py-1 px-2 text-xs"
              title="Silencio"
            >
              {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16"
              aria-label="Volumen"
            />
          </div>

          <div className="win98-statusbar">
            <span>{playing ? 'REPRODUCIENDO' : 'EN PAUSA'}</span>
            <span>{tracks.length} canción(es)</span>
          </div>
        </div>
      </div>
    </>
  );
}