import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Link2,
  Link2Off,
  QrCode,
  RefreshCw,
  Smartphone,
  Monitor,
  Copy,
  Check,
  Radio,
  ShieldCheck,
  Camera,
  Globe,
} from 'lucide-react';
import { syncManager } from '../sync/syncManager';
import { SyncState } from '../sync/types';
import {
  describeBroker,
  loadBroker,
  parseBrokerAddress,
  saveBroker,
} from '../sync/syncManager';
import { formatPairingCode, normalizePairingCode, buildPairingUrl } from '../sync/code';
import { sound } from '../audio';
import { QrScanner } from './QrScanner';

const PHASE_LABEL: Record<string, string> = {
  idle: 'Not linked',
  hosting: 'Waiting for a device',
  connecting: 'Connecting',
  connected: 'Linked',
  error: 'Link problem',
};

export const DeviceSyncPanel: React.FC = () => {
  const [state, setState] = useState<SyncState>(() => ({
    phase: 'idle',
    role: null,
    code: null,
    peerName: null,
    error: null,
    lastSyncAt: null,
    changesSent: 0,
    changesReceived: 0,
    linked: false,
  }));
  const [inputCode, setInputCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isBrokerOpen, setIsBrokerOpen] = useState<boolean>(false);
  const [brokerInput, setBrokerInput] = useState<string>(describeBroker(loadBroker()));
  const [brokerNote, setBrokerNote] = useState<string | null>(null);

  useEffect(() => syncManager.subscribe(setState), []);

  const formattedCode = useMemo(
    () => (state.code ? formatPairingCode(state.code) : ''),
    [state.code]
  );

  const pairingUrl = useMemo(() => {
    if (!state.code) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return buildPairingUrl(state.code, origin);
  }, [state.code]);

  const handleHost = async () => {
    sound.playClick();
    setBusy(true);
    try {
      await syncManager.startHosting();
    } catch (err: any) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    const code = normalizePairingCode(inputCode);
    if (code.length < 8) return;
    sound.playClick();
    setBusy(true);
    try {
      await syncManager.joinWithCode(code);
    } catch (err: any) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDetected = useCallback((value: string) => {
    setIsScannerOpen(false);
    sound.playClick();

    let code = value.trim();

    try {
      // The QR code holds a link such as https://host/?pair=RXTXXXX
      if (code.includes('?')) {
        const params = new URLSearchParams(code.split('?')[1]);
        const pair = params.get('pair');
        if (pair) code = pair;
      }
    } catch {
      /* the value is not a link, use it as the code */
    }

    const normalized = normalizePairingCode(code);
    if (normalized.length < 8) return;

    setInputCode(normalized);
    void syncManager.joinWithCode(normalized);
  }, []);

  const handleSaveBroker = () => {
    const broker = parseBrokerAddress(brokerInput);
    if (!broker) {
      setBrokerNote('That address does not look right. Try https://host or http://host:9000');
      return;
    }
    saveBroker(broker);
    setBrokerInput(describeBroker(broker));
    setBrokerNote('Saved. Start a new pairing to use it.');
    sound.playClick();
  };

  const handleCopy = async () => {
    if (!formattedCode) return;
    try {
      await navigator.clipboard.writeText(formattedCode);
      setCopied(true);
      sound.playComplete();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const handleDisconnect = async () => {
    sound.playClick();
    await syncManager.disconnect();
  };

  const handleResync = async () => {
    sound.playClick();
    await syncManager.requestFullSync();
  };

  const statusColor =
    state.phase === 'connected'
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : state.phase === 'error'
      ? 'bg-red-500/15 text-red-400 border-red-500/30'
      : 'bg-ob-gold/10 text-ob-gold border-ob-gold/30';

  return (
    <div className="rounded-xl border border-ob-line bg-ob-sidebar p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ob-gold/15 flex items-center justify-center text-ob-gold shrink-0">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-ob-text">Device Sync &amp; Link</div>
            <div className="text-xs text-ob-dim mt-0.5">
              Pair this device with your phone or PC. Data moves peer to peer, never through a
              database.
            </div>
          </div>
        </div>
        <span
          className={`self-start sm:self-auto text-[10px] font-mono uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md border ${statusColor}`}
        >
          {PHASE_LABEL[state.phase] || state.phase}
        </span>
      </div>

      {state.error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400 flex items-start gap-2">
          <Radio className="w-4 h-4 shrink-0 mt-px" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Idle: choose a role */}
      {state.phase === 'idle' && !state.code && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleHost}
            disabled={busy}
            className="rounded-xl border border-ob-line bg-ob-s1 p-4 text-left hover:border-ob-gold transition-colors disabled:opacity-60"
          >
            <div className="flex items-center gap-2 text-ob-gold mb-1.5">
              <Monitor className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">This device hosts</span>
            </div>
            <p className="text-[11px] text-ob-dim leading-relaxed">
              Generate a pairing code and a QR code, then open it on the other device.
            </p>
          </button>

          <div className="rounded-xl border border-ob-line bg-ob-s1 p-4">
            <div className="flex items-center gap-2 text-ob-text mb-1.5">
              <Smartphone className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Join with a code</span>
            </div>
            <div className="flex gap-2 mt-2">
              <input
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="RXT-XXXX-XXXX-XXXX"
                spellCheck={false}
                autoComplete="off"
                className="bg-ob-raised border border-ob-line px-2.5 py-2 text-xs font-mono text-ob-text rounded-lg outline-none focus:ring-1 focus:ring-ob-gold flex-1 min-w-0"
              />
              <button
                onClick={handleJoin}
                disabled={busy || normalizePairingCode(inputCode).length < 8}
                className="px-3 py-2 rounded-lg bg-ob-gold text-ob-on-gold text-xs font-bold hover:bg-ob-gold-bright transition-colors disabled:opacity-40"
              >
                Link
              </button>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                setIsScannerOpen(true);
              }}
              className="mt-2 w-full py-2 px-3 rounded-lg border border-ob-line bg-ob-raised text-xs font-semibold text-ob-text hover:border-ob-gold hover:text-ob-gold transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan the QR code with the camera</span>
            </button>
          </div>
        </div>
      )}

      {/* Hosting: show the pairing code and the QR code */}
      {state.code && !state.linked && (
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 pt-1 items-start">
          <div className="rounded-xl bg-white p-3 border border-ob-line mx-auto sm:mx-0">
            <QRCodeSVG
              value={pairingUrl}
              size={168}
              level="M"
              bgColor="#ffffff"
              fgColor="#0b0a12"
              marginSize={1}
              title="Routinix device pairing"
            />
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ob-dim font-semibold">
                Pairing code
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="font-mono text-lg sm:text-xl font-bold text-ob-gold tracking-wider">
                  {formattedCode}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-ob-s1 border border-ob-line text-ob-dim hover:text-ob-gold transition-colors"
                  title="Copy pairing code"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-ob-dim mt-2 leading-relaxed">
                Scan the QR code with the other device, or type the code there. The link opens a
                direct encrypted channel between the two devices.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-ob-muted">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                End to end encrypted
              </span>
              <button
                onClick={handleDisconnect}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-ob-line bg-ob-s1 text-ob-dim hover:text-ob-danger hover:border-ob-danger/50 transition-colors"
              >
                <Link2Off className="w-3.5 h-3.5" />
                Stop pairing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Linked: live status */}
      {state.linked && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg bg-ob-s1 border border-ob-line px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-ob-dim">Peer</div>
              <div className="text-xs font-semibold text-ob-text truncate mt-0.5">
                {state.peerName || 'Paired device'}
              </div>
            </div>
            <div className="rounded-lg bg-ob-s1 border border-ob-line px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-ob-dim">Sent</div>
              <div className="text-xs font-semibold text-ob-text mt-0.5">
                {state.changesSent} changes
              </div>
            </div>
            <div className="rounded-lg bg-ob-s1 border border-ob-line px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-ob-dim">Received</div>
              <div className="text-xs font-semibold text-ob-text mt-0.5">
                {state.changesReceived} changes
              </div>
            </div>
            <div className="rounded-lg bg-ob-s1 border border-ob-line px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-ob-dim">Last sync</div>
              <div className="text-xs font-semibold text-ob-text mt-0.5">
                {state.lastSyncAt
                  ? new Date(state.lastSyncAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : '—'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResync}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-ob-line bg-ob-s1 text-ob-text hover:border-ob-gold hover:text-ob-gold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Send full sync
            </button>
            <button
              onClick={handleDisconnect}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-ob-line bg-ob-s1 text-ob-dim hover:text-ob-danger hover:border-ob-danger/50 transition-colors"
            >
              <Link2Off className="w-3.5 h-3.5" />
              Unlink
            </button>
          </div>
        </div>
      )}

      {/* Guest mode: show the entered code while connecting */}
      {state.phase === 'connecting' && !state.linked && state.role === 'guest' && (
        <div className="flex items-center gap-2 text-xs text-ob-dim pt-1">
          <QrCode className="w-4 h-4 text-ob-gold" />
          <span>
            Linking with <span className="font-mono text-ob-gold">{formatPairingCode(state.code || '')}</span>
            ...
          </span>
        </div>
      )}

      <QrScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleDetected}
      />

      {/* Signalling server */}
      <div className="pt-1 border-t border-ob-line">
        <button
          onClick={() => {
            sound.playClick();
            setIsBrokerOpen((prev) => !prev);
            setBrokerNote(null);
          }}
          className="text-[11px] text-ob-dim hover:text-ob-gold transition-colors flex items-center gap-1.5"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Signalling server: {describeBroker(loadBroker())}</span>
        </button>

        {isBrokerOpen && (
          <div className="mt-2 space-y-2">
            <p className="text-[11px] text-ob-muted leading-relaxed">
              The public broker limits how many devices can pair from one address. Point both
              devices at your own broker when that happens.
            </p>
            <div className="flex gap-2">
              <input
                value={brokerInput}
                onChange={(e) => setBrokerInput(e.target.value)}
                placeholder="https://0.peerjs.com"
                spellCheck={false}
                autoComplete="off"
                className="bg-ob-raised border border-ob-line px-2.5 py-2 text-xs font-mono text-ob-text rounded-lg outline-none focus:ring-1 focus:ring-ob-gold flex-1 min-w-0"
              />
              <button
                onClick={handleSaveBroker}
                className="px-3 py-2 rounded-lg bg-ob-raised border border-ob-line-strong text-xs font-bold text-ob-text hover:border-ob-gold hover:text-ob-gold transition-colors"
              >
                Save
              </button>
            </div>
            {brokerNote && (
              <p className="text-[11px] text-ob-gold">{brokerNote}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
