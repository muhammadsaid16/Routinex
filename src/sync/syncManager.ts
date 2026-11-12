import Peer, { DataConnection, PeerJSOption } from 'peerjs';
import { db } from '../db';
import { authProof, decryptPayload, deriveSyncKey, encryptPayload } from './cipher';
import { derivePeerId, generatePairingCode, normalizePairingCode } from './code';
import {
  SyncMessage,
  SyncState,
  SyncTable,
  SyncedEntry,
  SyncedHabit,
  SyncedSetting,
  SYNCED_SETTINGS,
  Tombstone,
} from './types';

const DEVICE_ID_KEY = 'routinix_device_id';
const SESSION_KEY = 'routinix_sync_session';
const MAX_TOMBSTONES = 800;
const PING_INTERVAL_MS = 25000;
const CONNECT_TIMEOUT_MS = 25000;
const MAX_RECONNECT_ATTEMPTS = 60;

interface SyncSession {
  role: 'host' | 'guest';
  code: string;
}

type StateListener = (state: SyncState) => void;
type DataListener = (table: SyncTable) => void;
type SettingListener = (key: string, value: any) => void;

function peerOptions(peerId: string): PeerJSOption {
  const env = (import.meta.env || {}) as Record<string, string | undefined>;
  const options: PeerJSOption = { debug: 0 };
  if (env.VITE_PEER_HOST) options.host = env.VITE_PEER_HOST;
  if (env.VITE_PEER_PORT) options.port = Number(env.VITE_PEER_PORT);
  if (env.VITE_PEER_PATH) options.path = env.VITE_PEER_PATH;
  if (env.VITE_PEER_SECURE) options.secure = env.VITE_PEER_SECURE !== 'false';
  if (env.VITE_PEER_KEY) options.key = env.VITE_PEER_KEY;

  // The broker keeps a peer id while the old socket is still open. Reusing the
  // same token lets the new page take the id back after a reload.
  options.token = peerToken(peerId);
  return options;
}

/**
 * A stable token per peer id.
 * The broker hands the id to the new connection when the token matches, so a
 * page reload takes the same id back instead of running into "ID is taken".
 */
function peerToken(peerId: string): string {
  const storageKey = `routinix_peer_token:${peerId}`;

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) return stored;

    const bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }

    const token = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    localStorage.setItem(storageKey, token);
    return token;
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

function stableStringify(value: any): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

/** Content signature of a record without the sync stamps. */
function contentSignature(record: any): string {
  const copy: Record<string, any> = { ...record };
  delete copy.updatedAt;
  delete copy.updatedBy;
  return stableStringify(copy);
}

function keyFor(table: SyncTable, record: any): string {
  if (table === 'habits') return String(record.id);
  if (table === 'entries') return `${record.habitId}|${record.date}`;
  return String(record.key);
}

/** Last write wins, with the device id as tie breaker. */
function isRemoteNewer(remote: any, local: any): boolean {
  if (!local) return true;
  const remoteAt = remote?.updatedAt ?? 0;
  const localAt = local.updatedAt ?? 0;
  if (remoteAt !== localAt) return remoteAt > localAt;
  return (remote?.updatedBy ?? '') > (local.updatedBy ?? '');
}

function readDeviceId(): string {
  try {
    const stored = localStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;
    const id = 'dev-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return 'dev-anonymous';
  }
}

/**
 * Device link manager.
 *
 * Mirrors the T3 Code model: local first data on every device, a short pairing
 * code to introduce two devices, a WebRTC data channel that never touches a
 * database, and a last write wins merge for every record.
 */
class SyncManager {
  private state: SyncState = {
    phase: 'idle',
    role: null,
    code: null,
    peerName: null,
    error: null,
    lastSyncAt: null,
    changesSent: 0,
    changesReceived: 0,
    linked: false,
  };

  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private key: Uint8Array | null = null;
  private nonce: string | null = null;
  private authenticated = false;
  private deviceId = readDeviceId();
  private deviceName = 'Device';
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private session: SyncSession | null = null;
  private suppressBroadcast = 0;

  private baseline: {
    habits: Map<string, SyncedHabit>;
    entries: Map<string, SyncedEntry>;
    settings: Map<string, SyncedSetting>;
  } = {
    habits: new Map(),
    entries: new Map(),
    settings: new Map(),
  };

  private tombstones = new Map<string, Tombstone>();
  /**
   * Keys that the app currently shows for every table.
   * A record that is missing from the app array but was never shown to the app
   * is not a removal. It is a record that just arrived from the paired device.
   */
  private appSeen: { habits: Set<string>; entries: Set<string>; settings: Set<string> } = {
    habits: new Set(),
    entries: new Set(),
    settings: new Set(),
  };
  private stateListeners = new Set<StateListener>();
  private dataListeners = new Set<DataListener>();
  private settingListeners = new Set<SettingListener>();

  private ready: Promise<void>;

  constructor() {
    this.ready = this.loadBaseline();
  }

  // ---------------------------------------------------------------- lifecycle

  private async loadBaseline(): Promise<void> {
    try {
      const [habits, entries, settings, tombstones] = await Promise.all([
        db.habits.toArray(),
        db.entries.toArray(),
        db.settings.toArray(),
        db.tombstones.toArray(),
      ]);

      this.baseline.habits = new Map(habits.map((h) => [h.id, h as SyncedHabit]));
      this.baseline.entries = new Map(
        entries.map((e) => [`${e.habitId}|${e.date}`, e as SyncedEntry])
      );
      this.baseline.settings = new Map(settings.map((s) => [s.key, s as SyncedSetting]));
      this.tombstones = new Map(tombstones.map((t) => [t.id, t]));
    } catch (err) {
      console.error('Sync baseline load failed:', err);
    }
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  setDeviceName(name: string) {
    if (name && name.trim()) this.deviceName = name.trim();
  }

  subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  onRemoteData(listener: DataListener): () => void {
    this.dataListeners.add(listener);
    return () => this.dataListeners.delete(listener);
  }

  onRemoteSetting(listener: SettingListener): () => void {
    this.settingListeners.add(listener);
    return () => this.settingListeners.delete(listener);
  }

  private emitState(patch: Partial<SyncState>) {
    this.state = { ...this.state, ...patch };
    this.stateListeners.forEach((listener) => listener(this.state));
  }

  // ------------------------------------------------------------- public API

  async startHosting(existingCode?: string, isRetry = false): Promise<string> {
    await this.teardown();

    const code = existingCode ? normalizePairingCode(existingCode) : generatePairingCode();
    this.key = deriveSyncKey(code);

    if (!isRetry) this.retryCount = 0;
    this.saveSession({ role: 'host', code });

    this.emitState({
      phase: 'hosting',
      role: 'host',
      code,
      error: null,
      peerName: null,
      linked: false,
    });

    const peerId = await derivePeerId(code);
    this.peer = new Peer(peerId, peerOptions(peerId));
    const peer = this.peer;

    peer.on('open', () => {
      if (this.peer !== peer) return;
      if (this.state.phase === 'hosting') {
        this.emitState({ phase: 'hosting' });
      }
    });

    peer.on('connection', (conn) => {
      if (this.peer !== peer) return;
      this.attachConnection(conn, 'host');
    });

    peer.on('disconnected', () => {
      if (this.peer !== peer) return;
      this.emitState({ error: 'The signalling server dropped the link. Trying to reconnect...' });
      this.scheduleReconnect();
    });

    peer.on('error', (err) => {
      if (this.peer !== peer) return;
      this.handlePeerError(err);
    });

    return code;
  }

  async joinWithCode(input: string, isRetry = false): Promise<void> {
    const code = normalizePairingCode(input);
    if (code.length < 8) {
      this.emitState({ phase: 'error', error: 'That pairing code looks incomplete.' });
      return;
    }

    await this.teardown();

    this.key = deriveSyncKey(code);
    if (!isRetry) this.retryCount = 0;
    this.saveSession({ role: 'guest', code });

    this.emitState({
      phase: 'connecting',
      role: 'guest',
      code,
      error: null,
      peerName: null,
      linked: false,
    });

    const peerId = await derivePeerId(code);
    const guestId = `routinix-guest-${Math.random().toString(36).slice(2, 10)}`;
    this.peer = new Peer(guestId, peerOptions(guestId));
    const peer = this.peer;

    peer.on('open', () => {
      if (this.peer !== peer) return;
      const conn = peer.connect(peerId, { reliable: true, serialization: 'json' });
      this.attachConnection(conn, 'guest');
    });

    peer.on('disconnected', () => {
      if (this.peer !== peer) return;
      this.emitState({ error: 'The signalling server dropped the link. Trying to reconnect...' });
      this.scheduleReconnect();
    });

    peer.on('error', (err) => {
      if (this.peer !== peer) return;
      this.handlePeerError(err);
    });

    this.connectTimer = setTimeout(() => {
      if (!this.authenticated && this.state.phase === 'connecting') {
        this.emitState({
          phase: 'error',
          error: 'Could not reach the other device. Check the code and that both devices are online.',
        });
        this.scheduleReconnect();
      }
    }, CONNECT_TIMEOUT_MS);
  }

  /**
   * Restores the pairing that was active before a page reload.
   * The peer id of the host is derived from the code, so the same code brings
   * the same link back after a refresh.
   */
  async resumeSession(): Promise<void> {
    const session = this.loadSession();
    if (!session) return;

    if (session.role === 'host') {
      await this.startHosting(session.code, true);
    } else {
      await this.joinWithCode(session.code, true);
    }
  }

  /** The pairing code of the stored session, or null when there is none. */
  getSessionCode(): string | null {
    if (this.session) return this.session.code;
    return this.loadSession()?.code ?? null;
  }

  private saveSession(session: SyncSession) {    this.session = session;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      /* storage blocked */
    }
  }

  private loadSession(): SyncSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.role && parsed?.code) return parsed as SyncSession;
    } catch {
      /* ignore */
    }
    return null;
  }

  private clearSession() {
    this.session = null;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }

  /**
   * Brings the link back after a dropped connection or a page reload.
   * The retry waits a little longer after every attempt.
   */
  private scheduleReconnect() {
    if (this.retryTimer || !this.session) return;

    if (this.retryCount >= MAX_RECONNECT_ATTEMPTS) {
      this.emitState({
        phase: 'error',
        error: 'The link to the other device could not be restored.',
      });
      return;
    }

    const delay = Math.min(5000, 600 * Math.pow(1.4, this.retryCount));
    this.retryCount++;

    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.attemptReconnect();
    }, delay);
  }

  private async attemptReconnect() {
    const session = this.session;
    if (!session) return;

    if (session.role === 'host') {
      await this.startHosting(session.code, true);
    } else {
      await this.joinWithCode(session.code, true);
    }
  }

  async disconnect(): Promise<void> {
    this.clearSession();
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.retryCount = 0;

    await this.teardown();
    this.emitState({
      phase: 'idle',
      role: null,
      code: null,
      peerName: null,
      error: null,
      linked: false,
    });
  }

  /** Pushes a fresh full snapshot to the paired device. */
  async requestFullSync(): Promise<void> {
    if (!this.authenticated) return;
    await this.sendSnapshot();
    this.emitState({ lastSyncAt: Date.now() });
  }

  // ------------------------------------------------------- local change feed

  /**
   * Called by the storage layer after a local write. Diffs the new state
   * against the last known state, stamps the changed records and pushes them
   * to the paired device.
   */
  async recordLocal(table: SyncTable, records: any[]): Promise<void> {
    if (this.suppressBroadcast > 0) return;
    await this.ready;

    const now = Date.now();
    const next = new Map<string, any>();
    const changed: any[] = [];
    const removed: string[] = [];
    const dropped: string[] = [];

    for (const record of records) {
      if (!record) continue;
      const key = keyFor(table, record);

      // A record without a stamp was just created on this device, so it is
      // newer than any delete that happened before it.
      const writtenAt = record.updatedAt ?? now;
      const tombstone = this.tombstones.get(`${table}:${key}`);

      if (tombstone && (tombstone.updatedAt ?? 0) > writtenAt) {
        // The delete is newer than this write. The delete wins, so the record
        // is removed again instead of being pushed back to the other device.
        dropped.push(key);
        continue;
      }

      if (tombstone) {
        // This write is newer than the delete, so the delete is done.
        this.tombstones.delete(tombstone.id);
        db.tombstones.delete(tombstone.id).catch(() => {});
      }

      next.set(key, record);

      const previous = this.baseline[table].get(key);
      if (!previous || contentSignature(previous) !== contentSignature(record)) {
        record.updatedAt = now;
        record.updatedBy = this.deviceId;
        changed.push(record);
      }
    }

    for (const key of this.baseline[table].keys()) {
      if (next.has(key)) continue;
      if (dropped.includes(key)) continue;
      // Only a record that the app showed before can be a removal.
      if (!this.appSeen[table].has(key)) continue;
      removed.push(key);
    }

    (this.baseline as Record<string, Map<string, any>>)[table] = next;
    this.appSeen[table] = new Set(next.keys());

    if (changed.length === 0 && removed.length === 0 && dropped.length === 0) return;

    try {
      if (changed.length > 0) {
        if (table === 'habits') await db.habits.bulkPut(changed);
        else if (table === 'entries') await db.entries.bulkPut(changed);
        else await db.settings.bulkPut(changed);
      }

      for (const key of removed) {
        await this.deleteLocalRecord(table, key);
      }

      for (const key of dropped) {
        await this.deleteLocalRecord(table, key);
      }
    } catch (err) {
      console.error('Sync stamp write failed:', err);
    }

    for (const key of removed) {
      await this.writeTombstone(table, key);
    }

    for (const record of changed) {
      this.send({ t: 'upsert', table, record });
    }
  }

  /** Removes a record from the local database. */
  private async deleteLocalRecord(table: SyncTable, key: string): Promise<void> {
    try {
      if (table === 'habits') {
        await db.habits.delete(key);
      } else if (table === 'entries') {
        const [habitId, date] = key.split('|');
        if (habitId && date) await db.entries.delete([habitId, date]);
      } else {
        await db.settings.delete(key);
      }
    } catch (err) {
      console.error('Sync local delete failed:', err);
    }
  }

  /** Syncs a single preference value (theme, scale, user name). */
  async recordSetting(key: string, value: any): Promise<void> {
    if (this.suppressBroadcast > 0) return;
    await this.ready;

    const previous = this.baseline.settings.get(key);
    const record: SyncedSetting = {
      key,
      value,
      updatedAt: Date.now(),
      updatedBy: this.deviceId,
    };

    if (previous && contentSignature(previous) === contentSignature(record)) return;

    this.baseline.settings.set(key, record);
    this.appSeen.settings.add(key);

    try {
      await db.settings.put(record);
    } catch (err) {
      console.error('Sync setting write failed:', err);
    }

    this.send({ t: 'upsert', table: 'settings', record });
  }

  // ------------------------------------------------------------- connection

  private attachConnection(conn: DataConnection, role: 'host' | 'guest') {
    this.conn = conn;

    conn.on('open', () => {
      if (role === 'host') {
        this.nonce = this.makeNonce();
        this.sendPlain({ t: 'challenge', nonce: this.nonce });
      }
    });

    conn.on('data', (data: any) => this.handleIncomingData(data));

    conn.on('close', () => this.handleDisconnect());

    conn.on('error', (err: any) => {
      console.error('Sync connection error:', err);
      this.handleDisconnect();
    });
  }

  private makeNonce(): string {
    const bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private handleIncomingData(data: any) {
    let message: SyncMessage | null = null;

    try {
      if (data && typeof data === 'object' && typeof data.p === 'string') {
        if (!this.key) return;
        message = decryptPayload<SyncMessage>(this.key, data.p);
      } else if (data && typeof data === 'object' && typeof data.t === 'string') {
        message = data as SyncMessage;
      } else {
        return;
      }
    } catch (err) {
      console.error('Sync message rejected:', err);
      return;
    }

    void this.processMessage(message);
  }

  private async processMessage(message: SyncMessage): Promise<void> {
    switch (message.t) {
      case 'challenge': {
        if (!this.key) return;
        this.nonce = message.nonce;
        this.sendPlain({ t: 'auth', proof: authProof(this.key, message.nonce) });
        return;
      }

      case 'auth': {
        if (!this.key || !this.nonce) return;
        const expected = authProof(this.key, this.nonce);
        if (message.proof !== expected) {
          this.emitState({ phase: 'error', error: 'The other device sent an invalid pairing proof.' });
          this.closeConnection();
          return;
        }
        this.authenticated = true;
        this.sendPlain({
          t: 'welcome',
          deviceName: this.deviceName,
          proof: expected,
        });
        this.onAuthenticated();
        return;
      }

      case 'welcome': {
        if (!this.key || !this.nonce) return;
        const expected = authProof(this.key, this.nonce);
        if (message.proof !== expected) {
          this.emitState({ phase: 'error', error: 'The other device failed the pairing check.' });
          this.closeConnection();
          return;
        }
        this.authenticated = true;
        this.emitState({ peerName: message.deviceName });
        this.onAuthenticated();
        return;
      }

      case 'snapshot': {
        await this.applySnapshot(message);
        return;
      }

      case 'upsert': {
        await this.applyUpsert(message.table, message.record);
        return;
      }

      case 'remove': {
        await this.applyRemove(message.table, message.key, message.updatedAt, message.updatedBy);
        return;
      }

      case 'ping': {
        this.send({ t: 'pong' });
        return;
      }

      case 'pong': {
        this.emitState({ lastSyncAt: Date.now() });
        return;
      }
    }
  }

  private onAuthenticated() {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }

    this.emitState({
      phase: 'connected',
      linked: true,
      error: null,
      lastSyncAt: Date.now(),
    });

    void this.sendSnapshot();

    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => this.send({ t: 'ping' }), PING_INTERVAL_MS);
  }

  private handleDisconnect() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }

    const wasLinked = this.authenticated;
    this.authenticated = false;
    this.conn = null;
    this.nonce = null;

    if (this.state.phase === 'idle') return;

    const stillHosting = this.state.role === 'host' && this.peer !== null;

    this.emitState({
      phase: wasLinked ? (stillHosting ? 'hosting' : 'idle') : this.state.phase,
      linked: false,
      peerName: null,
      error: wasLinked ? 'The link to the other device closed. Trying to reconnect...' : this.state.error,
    });

    // A reload on the guest drops the data channel. The pairing code stays
    // the same, so the link comes back on its own. The host only waits for
    // the guest to come back, it keeps its peer registered.
    if (this.session && this.state.role === 'guest') {
      this.scheduleReconnect();
    }
  }

  private handlePeerError(err: any) {
    const type = err?.type || err?.message || 'unknown';
    let message = 'The device link failed.';

    if (type === 'peer-unavailable') {
      message = 'No device is answering with that pairing code.';
    } else if (type === 'unavailable-id') {
      message = 'That pairing code is already in use. Generate a new one.';
    } else if (type === 'network' || type === 'socket-error' || type === 'server-error') {
      message = 'Could not reach the signalling server. Check the connection.';
    } else if (type === 'browser-not-supported') {
      message = 'This browser cannot open a peer to peer link.';
    }

    console.error('Sync peer error:', err);

    // A broker error during a restore attempt is not fatal. The retry loop
    // keeps trying until the other device is back.
    if (this.session && (type === 'peer-unavailable' || type === 'unavailable-id' || type === 'network' || type === 'socket-error')) {
      this.emitState({ error: message });
      this.scheduleReconnect();
      return;
    }

    this.emitState({ phase: 'error', error: message });
  }

  private closeConnection() {
    try {
      this.conn?.close();
    } catch {
      /* ignore */
    }
    this.conn = null;
    this.authenticated = false;
  }

  private async teardown() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    this.closeConnection();

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        /* ignore */
      }
      this.peer = null;
    }

    this.authenticated = false;
    this.nonce = null;
    this.key = null;
  }

  // ------------------------------------------------------------- transport

  private sendPlain(message: SyncMessage) {
    if (!this.conn || this.conn.open !== true) return;
    try {
      this.conn.send(message as any);
    } catch (err) {
      console.error('Sync send failed:', err);
    }
  }

  private send(message: SyncMessage) {
    if (!this.key || !this.conn || this.conn.open !== true) return;
    try {
      this.conn.send({ t: 'enc', p: encryptPayload(this.key, message) } as any);
      this.emitState({ changesSent: this.state.changesSent + 1 });
    } catch (err) {
      console.error('Sync send failed:', err);
    }
  }

  // ---------------------------------------------------------------- merging

  private async sendSnapshot() {
    await this.ready;

    const habits = Array.from(this.baseline.habits.values());
    const entries = Array.from(this.baseline.entries.values());
    const settings = Array.from(this.baseline.settings.values()).filter((s) =>
      (SYNCED_SETTINGS as readonly string[]).includes(s.key)
    );
    const tombstones = Array.from(this.tombstones.values());

    this.send({ t: 'snapshot', habits, entries, settings, tombstones });
    this.emitState({ lastSyncAt: Date.now() });
  }

  private async applySnapshot(message: Extract<SyncMessage, { t: 'snapshot' }>) {
    this.suppressBroadcast++;

    try {
      for (const habit of message.habits || []) {
        await this.applyUpsert('habits', habit);
      }
      for (const entry of message.entries || []) {
        await this.applyUpsert('entries', entry);
      }
      for (const setting of message.settings || []) {
        await this.applyUpsert('settings', setting);
      }
      for (const tombstone of message.tombstones || []) {
        await this.applyRemove(
          tombstone.table,
          tombstone.key,
          tombstone.updatedAt ?? 0,
          tombstone.updatedBy ?? ''
        );
      }
    } finally {
      this.suppressBroadcast--;
    }

    this.emitState({ lastSyncAt: Date.now(), changesReceived: this.state.changesReceived + 1 });
    this.notifyData('habits');
  }

  private async applyUpsert(table: SyncTable, record: any) {
    if (!record) return;

    const key = keyFor(table, record);
    const local = this.baseline[table].get(key);

    if (!isRemoteNewer(record, local)) return;

    // A delete that is newer than this record wins. The record stays deleted.
    const tombstone = this.tombstones.get(`${table}:${key}`);
    if (tombstone && (tombstone.updatedAt ?? 0) > (record.updatedAt ?? 0)) return;

    this.suppressBroadcast++;
    try {
      if (table === 'habits') {
        await db.habits.put(record);
        this.baseline.habits.set(key, record as SyncedHabit);
      } else if (table === 'entries') {
        await db.entries.put(record);
        this.baseline.entries.set(key, record as SyncedEntry);
      } else {
        await db.settings.put(record);
        this.baseline.settings.set(key, record as SyncedSetting);
      }
    } catch (err) {
      console.error('Sync remote write failed:', err);
    } finally {
      this.suppressBroadcast--;
    }

    this.emitState({ changesReceived: this.state.changesReceived + 1 });

    if (table === 'settings') {
      this.settingListeners.forEach((listener) => listener(record.key, record.value));
    } else {
      this.notifyData(table);
    }
  }

  private async applyRemove(
    table: SyncTable,
    key: string,
    updatedAt: number,
    updatedBy: string
  ) {
    const local = this.baseline[table].get(key);
    if (local && (local.updatedAt ?? 0) > updatedAt) return;

    this.suppressBroadcast++;
    try {
      if (table === 'habits') {
        await db.habits.delete(key);
        this.baseline.habits.delete(key);
      } else if (table === 'entries') {
        const [habitId, date] = key.split('|');
        if (habitId && date) await db.entries.delete([habitId, date]);
        this.baseline.entries.delete(key);
      } else {
        await db.settings.delete(key);
        this.baseline.settings.delete(key);
      }

      const tombstone: Tombstone = {
        id: `${table}:${key}`,
        table,
        key,
        updatedAt,
        updatedBy,
      };
      await db.tombstones.put(tombstone);
      this.tombstones.set(tombstone.id, tombstone);
      await this.pruneTombstones();
    } catch (err) {
      console.error('Sync remote delete failed:', err);
    } finally {
      this.suppressBroadcast--;
    }

    this.emitState({ changesReceived: this.state.changesReceived + 1 });
    this.notifyData(table);
  }

  /**
   * The app tells the sync layer which records it shows right now.
   * A record that the app never showed is not a removal, even when it is
   * missing from the array that the app hands over.
   */
  confirmAppState(habits: any[], entries: any[]) {
    this.appSeen.habits = new Set((habits || []).map((habit) => String(habit.id)));
    this.appSeen.entries = new Set(
      (entries || []).map((entry) => `${entry.habitId}|${entry.date}`)
    );
  }

  private async writeTombstone(table: SyncTable, key: string) {
    const tombstone: Tombstone = {
      id: `${table}:${key}`,
      table,
      key,
      updatedAt: Date.now(),
      updatedBy: this.deviceId,
    };

    this.tombstones.set(tombstone.id, tombstone);

    try {
      await db.tombstones.put(tombstone);
      await this.pruneTombstones();
    } catch (err) {
      console.error('Sync tombstone write failed:', err);
    }

    this.send({
      t: 'remove',
      table,
      key,
      updatedAt: tombstone.updatedAt ?? 0,
      updatedBy: tombstone.updatedBy ?? this.deviceId,
    });
  }

  private async pruneTombstones() {
    if (this.tombstones.size <= MAX_TOMBSTONES) return;
    const sorted = Array.from(this.tombstones.values()).sort((a, b) => (a.updatedAt ?? 0) - (b.updatedAt ?? 0));
    const excess = sorted.slice(0, sorted.length - MAX_TOMBSTONES);
    for (const tombstone of excess) {
      this.tombstones.delete(tombstone.id);
      try {
        await db.tombstones.delete(tombstone.id);
      } catch {
        /* ignore */
      }
    }
  }

  private notifyData(table: SyncTable) {
    this.dataListeners.forEach((listener) => listener(table));
  }
}

export const syncManager = new SyncManager();
export type { SyncState };
