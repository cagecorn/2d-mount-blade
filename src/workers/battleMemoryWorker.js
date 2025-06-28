// src/workers/battleMemoryWorker.js

let tf = self.tf;

const DB_NAME = 'BattleMemoryDB';
const STORE_MEM = 'memories';
const STORE_MODEL = 'model';

let db = null;
let model = null;

async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_MEM)) {
        db.createObjectStore(STORE_MEM, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_MODEL)) {
        db.createObjectStore(STORE_MODEL);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadModel() {
  if (!db || !tf) return;
  const tx = db.transaction(STORE_MODEL, 'readonly');
  const req = tx.objectStore(STORE_MODEL).get('weights');
  return new Promise((res) => {
    req.onsuccess = async () => {
      const data = req.result;
      if (data) {
        model = await tf.loadLayersModel(tf.io.fromMemory(data.modelTopology, data.weightSpecs, data.weightData));
      }
      res();
    };
    req.onerror = () => res();
  });
}

async function saveModel() {
  if (!db || !model) return;
  const artifacts = await model.save(tf.io.withSaveHandler(async (artifacts) => artifacts));
  const tx = db.transaction(STORE_MODEL, 'readwrite');
  tx.objectStore(STORE_MODEL).put(artifacts, 'weights');
}

function ensureModel() {
  if (!tf) return;
  if (!model) {
    model = tf.sequential();
    model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [3] }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });
  }
}

async function getAllMemories() {
  if (!db) return [];
  const tx = db.transaction(STORE_MEM, 'readonly');
  const req = tx.objectStore(STORE_MEM).getAll();
  return new Promise((res) => { req.onsuccess = () => res(req.result || []); });
}

async function trainFromMemories() {
  if (!tf) return;
  const mems = await getAllMemories();
  if (mems.length === 0) return;
  const xs = tf.tensor2d(mems.map(m => m.features));
  const ys = tf.tensor2d(mems.map(m => [m.winner === 'A' ? 1 : 0]));
  await model.fit(xs, ys, { epochs: 5, batchSize: 8 });
  xs.dispose();
  ys.dispose();
  await saveModel();
  postMessage({ type: 'modelUpdated' });
}

onmessage = async (e) => {
  const { type, data } = e.data;
  if (type === 'init') {
    db = await openDB();
    ensureModel();
    await loadModel();
    postMessage({ type: 'ready' });
  } else if (type === 'saveMemory') {
    if (!db) return;
    const tx = db.transaction(STORE_MEM, 'readwrite');
    tx.objectStore(STORE_MEM).add(data);
  } else if (type === 'train') {
    ensureModel();
    await trainFromMemories();
  } else if (type === 'predict') {
    if (!model || !tf) { postMessage({ type: 'predicted', prediction: 'A' }); return; }
    const tensor = tf.tensor2d([data.features]);
    const pred = model.predict(tensor);
    const val = (await pred.data())[0];
    tensor.dispose();
    pred.dispose();
    postMessage({ type: 'predicted', prediction: val >= 0.5 ? 'A' : 'B' });
  }
};

