import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, X } from 'lucide-react';

interface QrScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (value: string) => void;
}

/**
 * Camera based QR scanner.
 *
 * The camera is only available in a secure context, so this works on https
 * (the deployed app and the Android APK) and on localhost. On a plain http
 * address the panel explains how to get a secure address.
 */
export const QrScanner: React.FC<QrScannerProps> = ({ isOpen, onClose, onDetected }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string>('Point the camera at the QR code on the other screen.');

  useEffect(() => {
    if (!isOpen) return;

    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;

    const start = async () => {
      const media = navigator.mediaDevices;
      if (!media || !media.getUserMedia) {
        setError(
          'This browser only opens the camera on a secure address. Use https://routinex-one.vercel.app or install the Android app.'
        );
        return;
      }

      try {
        stream = await media.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch (err: any) {
        const name = err?.name || '';
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setError('Camera permission was refused. Allow the camera for this site and try again.');
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setError('No camera was found on this device.');
        } else {
          setError('The camera could not be opened.');
        }
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || stopped) return;

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;

      try {
        await video.play();
      } catch {
        /* the browser may block autoplay until a tap */
      }

      const context = canvas.getContext('2d', { willReadFrequently: true });

      const scan = () => {
        if (stopped) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
          const width = video.videoWidth;
          const height = video.videoHeight;

          if (width > 0 && height > 0) {
            canvas.width = width;
            canvas.height = height;
            context.drawImage(video, 0, 0, width, height);

            const image = context.getImageData(0, 0, width, height);
            const found = jsQR(image.data, width, height, { inversionAttempts: 'attemptBoth' });

            if (found?.data) {
              stopped = true;
              stream?.getTracks().forEach((track) => track.stop());
              onDetected(found.data);
              return;
            }
          }
        }

        frame = requestAnimationFrame(scan);
      };

      frame = requestAnimationFrame(scan);
    };

    setError(null);
    setHint('Point the camera at the QR code on the other screen.');
    void start();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [isOpen, onDetected]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-ob-line bg-ob-sidebar p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-ob-text">
            <Camera className="w-4 h-4 text-ob-gold" />
            <span>Scan the pairing code</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ob-dim hover:text-ob-text hover:bg-ob-s1 transition-colors"
            title="Close scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
          <div className="pointer-events-none absolute inset-0 border-[18px] border-black/40" />
          <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-ob-gold/80" />
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center bg-black/85">
              <CameraOff className="w-7 h-7 text-red-400" />
              <p className="text-[11px] leading-relaxed text-ob-text-2">{error}</p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-ob-dim leading-relaxed">{hint}</p>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-ob-raised border border-ob-line-strong text-xs font-bold text-ob-text hover:border-ob-gold hover:text-ob-gold transition-colors"
        >
          Enter the code instead
        </button>
      </div>
    </div>
  );
};
