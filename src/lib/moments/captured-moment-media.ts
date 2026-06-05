const DB_NAME = "memories-captured-moment";
const STORE_NAME = "captures";
const CAPTURE_KEY = "latest";

type StoredCapture = {
  file: File;
  savedAt: string;
};

function openCaptureDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withCaptureStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openCaptureDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export async function saveCapturedMomentFile(file: File) {
  await withCaptureStore("readwrite", (store) =>
    store.put(
      {
        file,
        savedAt: new Date().toISOString(),
      } satisfies StoredCapture,
      CAPTURE_KEY
    )
  );
}

export async function takeCapturedMomentFile() {
  const capture = await withCaptureStore<StoredCapture | undefined>(
    "readonly",
    (store) => store.get(CAPTURE_KEY)
  );

  await withCaptureStore("readwrite", (store) => store.delete(CAPTURE_KEY));

  return capture?.file ?? null;
}
