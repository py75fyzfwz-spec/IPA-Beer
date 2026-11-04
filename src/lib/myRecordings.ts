// The learner's own recordings, one per card, kept in this browser's
// IndexedDB. They are never uploaded. localStorage can't hold audio, and
// IndexedDB stores Blobs directly, including on iPhone Safari.

const DB = "ipa.recordings";
const STORE = "clips";

export type MyRecording = {
  cardId: string;
  blob: Blob;
  recordedAt: string; // ISO time
};

// Stored as bytes plus type rather than a Blob: some iOS Safari versions
// save MediaRecorder Blobs to IndexedDB but fail to read them back.
type Stored = { cardId: string; bytes: ArrayBuffer; type: string; recordedAt: string };

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "cardId" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function loadRecording(cardId: string): Promise<MyRecording | undefined> {
  const row = await run<Stored | undefined>("readonly", (s) => s.get(cardId));
  if (!row) return undefined;
  return { cardId, blob: new Blob([row.bytes], { type: row.type }), recordedAt: row.recordedAt };
}

export async function saveRecording(cardId: string, blob: Blob): Promise<void> {
  const row: Stored = { cardId, bytes: await blob.arrayBuffer(), type: blob.type, recordedAt: new Date().toISOString() };
  await run("readwrite", (s) => s.put(row));
}

export async function deleteRecording(cardId: string): Promise<void> {
  await run("readwrite", (s) => s.delete(cardId));
}

export async function deleteAllRecordings(): Promise<void> {
  await run("readwrite", (s) => s.clear());
}

export async function countRecordings(): Promise<number> {
  return run("readonly", (s) => s.count());
}

// Formats in order of preference. iPhone Safari records audio/mp4 (AAC);
// Chrome and Firefox record webm/ogg with Opus. Each browser plays back
// what it recorded, which is all a local clip needs.
const MIME_TYPES = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];

export function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return undefined;
  return MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

export function canRecord(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}
