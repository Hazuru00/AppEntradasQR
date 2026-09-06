'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Volume2,
  VolumeX,
  Search,
  Users,
  Monitor,
} from 'lucide-react';
import { validateTokenAction } from '@/actions/tickets';
import { ValidationResponse } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { EventConfig } from '@/config/event';

interface QrScannerComponentProps {
  event: EventConfig;
}

export function QrScannerComponent({ event }: QrScannerComponentProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingScanRef = useRef(false);

  const playFeedbackSound = (isSuccess: boolean) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      if (isSuccess) {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(587.33, now);
        osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.15);
        osc2.frequency.setValueAtTime(880.00, now + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);
      } else {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(160, now + 0.15);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch {}
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.warn('Error al detener cámara:', err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find(
            (c) =>
              c.label.toLowerCase().includes('back') ||
              c.label.toLowerCase().includes('rear') ||
              c.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.warn('No se pudieron listar cámaras:', err);
      });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraIdToUse?: string) => {
    setCameraError(null);
    const camId = cameraIdToUse || selectedCameraId;

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      }

      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      const cameraConfig = camId ? { deviceId: { exact: camId } } : { facingMode: 'environment' };

      await html5QrCodeRef.current.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        onScanSuccess,
        undefined
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Error al iniciar cámara:', err);
      setCameraError('No se pudo acceder a la cámara. Revisa los permisos o usa la validación manual.');
      setIsScanning(false);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (isProcessingScanRef.current) return;
    isProcessingScanRef.current = true;

    let token = decodedText.trim();
    if (token.includes('/validar/')) {
      const parts = token.split('/validar/');
      token = parts[1].split('?')[0].split('/')[0].trim();
    }

    await handleValidateToken(token);

    setTimeout(() => {
      isProcessingScanRef.current = false;
    }, 1500);
  };

  const handleValidateToken = async (tokenToValidate: string) => {
    if (!tokenToValidate) return;

    setIsValidating(true);
    try {
      const res = await validateTokenAction(tokenToValidate);
      playFeedbackSound(res.success);

      setValidationResult({
        success: res.success,
        status: res.status,
        message: res.message,
        ticket: res.ticket,
      });
    } catch (err) {
      playFeedbackSound(false);
      setValidationResult({
        success: false,
        status: 'NOT_FOUND',
        message: 'Error de conexión con el servidor.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleValidateToken(manualToken.trim());
  };

  const dismissModal = () => {
    setValidationResult(null);
    isProcessingScanRef.current = false;
  };

  return (
    <div className="min-h-screen bg-[#14151b] text-white px-4 py-6 max-w-2xl mx-auto space-y-4 font-mono">
      {/* Barra de navegación superior */}
      <div className="flex items-center justify-between border-b border-[#363847] pb-3">
        <Link
          href="/admin"
          className="win98-btn text-xs py-1 px-3 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Panel</span>
        </Link>

        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="win98-btn text-xs py-1 px-2.5 flex items-center gap-1"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#6b8e23]" /> : <VolumeX className="w-3.5 h-3.5 text-[#8f92a8]" />}
          <span className="text-[11px]">{soundEnabled ? 'Sonido ON' : 'MUTE'}</span>
        </button>
      </div>

      {/* VENTANA DEL ESCÁNER */}
      <div className="win98-box overflow-hidden">
        {/* Barra de título */}
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5 text-white" />
            <span className="text-xs">GATE_SCANNER.EXE - [Portería & Puerta]</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="win98-winbtn">_</div>
            <div className="win98-winbtn">□</div>
            <div className="win98-winbtn">✕</div>
          </div>
        </div>

        {/* Contenido de la ventana */}
        <div className="p-4 sm:p-5 space-y-4 bg-[#1f2029]">
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {cameras.length > 1 && (
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  if (isScanning) startScanner(e.target.value);
                }}
                className="win98-sunken w-full sm:w-auto flex-1 p-2 text-xs font-mono text-white focus:outline-none"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Cámara ${c.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => (isScanning ? stopScanner() : startScanner())}
              className={`win98-btn w-full sm:w-auto py-2 px-4 text-xs font-bold uppercase flex items-center justify-center gap-2 ${
                isScanning ? 'bg-[#8c2727] text-white border-t-[#c24646]' : 'win98-btn-primary'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{isScanning ? 'Detener Cámara' : 'Encender Cámara'}</span>
            </button>
          </div>

          {/* ÁREA DE LA CÁMARA */}
          <div className="win98-sunken relative bg-[#0a0b0e] aspect-square max-h-[340px] mx-auto flex items-center justify-center overflow-hidden">
            <div id="qr-reader" className="w-full h-full object-cover" />

            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center space-y-2 bg-[#0a0b0e]/95">
                <Camera className="w-10 h-10 text-[#8f92a8]" />
                <span className="text-xs font-bold text-white uppercase block">
                  CÁMARA APAGADA
                </span>
                <p className="text-[11px] text-[#8f92a8] max-w-xs">
                  Presiona &quot;Encender Cámara&quot; para escanear los códigos QR de los invitados.
                </p>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="p-3 bg-[#3a1818] border border-[#8c2727] text-white text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#e05252] shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* VALIDACIÓN MANUAL */}
          <div className="win98-sunken p-3 bg-[#121318] space-y-2">
            <span className="text-[11px] text-[#8f92a8] uppercase font-bold block">
              &gt;&gt; VALIDACIÓN MANUAL POR TOKEN UUID:
            </span>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Pega el código o token..."
                className="win98-sunken flex-1 p-2 text-xs font-mono text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={isValidating || !manualToken.trim()}
                className="win98-btn py-1 px-3 text-xs uppercase disabled:opacity-40"
              >
                {isValidating ? '...' : 'Validar'}
              </button>
            </form>
          </div>
        </div>

        {/* Barra de estado */}
        <div className="win98-statusbar">
          <span>Escáner: {isScanning ? 'ONLINE' : 'OFFLINE'}</span>
          <span>FPS: 10</span>
          <span>Modo: Portería</span>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* MODAL GIGANTE DE RESULTADO (VERDE ACCESO / ROJO ALERTA) */}
      {/* ====================================================================== */}
      {validationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          {validationResult.success ? (
            /* MODAL VERDE: ACCESO AUTORIZADO CON CONTEO DE PERSONAS */
            <div className="win98-box w-full max-w-md bg-[#122416] border-2 border-[#6b8e23] p-6 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-[#6b8e23]/20 border-2 border-[#6b8e23] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-[#86b53a]" />
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#86b53a] uppercase font-bold tracking-wider block">
                  [ PUERTA DE ACCESO: OK ]
                </span>
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white">
                  ¡ACCESO AUTORIZADO!
                </h2>
              </div>

              {/* FICHA RESALTADA CON ADMISIÓN DE PERSONAS */}
              <div className="win98-sunken p-4 bg-[#0d160f] text-left space-y-2.5 text-xs">
                <div>
                  <span className="text-[#86b53a] text-[10px] uppercase block">TITULAR DEL BOLETO:</span>
                  <span className="text-lg font-bold text-white block">
                    {validationResult.ticket?.buyerName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e3b23]">
                  <div>
                    <span className="text-[#86b53a] text-[10px] uppercase block">CÉDULA:</span>
                    <span className="text-white font-bold block">{validationResult.ticket?.buyerCedula}</span>
                  </div>
                  <div>
                    <span className="text-[#b5a642] text-[10px] uppercase block font-bold">TOTAL QUE ENTRAN:</span>
                    <span className="text-white font-bold text-sm block">
                      {validationResult.ticket?.quantity} {validationResult.ticket?.quantity === 1 ? 'PERSONA' : 'PERSONAS'}
                    </span>
                  </div>
                </div>

                {validationResult.ticket?.quantity && validationResult.ticket.quantity > 1 && (
                  <div className="p-2 bg-[#1b351f] border border-[#6b8e23] text-center text-[#86b53a] font-bold text-xs uppercase">
                    Pase Grupal: Deben ingresar {validationResult.ticket.quantity} personas juntas
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={dismissModal}
                className="win98-btn win98-btn-primary w-full py-3 text-sm font-bold uppercase"
              >
                [ Escanear Siguiente Invitado ]
              </button>
            </div>
          ) : (
            /* MODAL ROJO: DENEGADO / YA UTILIZADA */
            <div className="win98-box w-full max-w-md bg-[#2b1616] border-2 border-[#8c2727] p-6 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-[#8c2727]/20 border-2 border-[#8c2727] flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-[#e05252]" />
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#e05252] uppercase font-bold tracking-wider block">
                  [ ALERTA DE SEGURIDAD EN PUERTA ]
                </span>
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white">
                  ¡ACCESO DENEGADO!
                </h2>
              </div>

              <div className="win98-sunken p-4 bg-[#1a0c0c] text-center space-y-2 text-xs">
                <p className="text-white font-bold">
                  {validationResult.message}
                </p>

                {validationResult.status === 'USADO' && validationResult.ticket && (
                  <div className="pt-2 border-t border-[#3d1818] space-y-1 text-left">
                    <p className="text-[#8f92a8]">Titular: <strong className="text-white">{validationResult.ticket.buyerName}</strong></p>
                    <p className="text-[#8f92a8]">Cédula: <strong className="text-white">{validationResult.ticket.buyerCedula}</strong></p>
                    {validationResult.ticket.usedAt && (
                      <p className="text-[#e05252] text-[11px]">
                        Hora de ingreso previo: {formatDateTime(validationResult.ticket.usedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={dismissModal}
                className="win98-btn w-full py-3 text-sm font-bold uppercase bg-[#8c2727] text-white border-t-[#c24646]"
              >
                [ Cerrar Alerta y Continuar ]
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
