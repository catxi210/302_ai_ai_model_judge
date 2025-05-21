import { openDB, DBSchema, IDBPDatabase } from "idb";

const DB_NAME = "model_judge_db";
const STORE_NAME = "model_responses";

interface IRecord {
  id?: number;
  modelAnswer: string;
  judgeAnswer?: string;
  prompt: string;
  createdAt: Date;
  bestModel?: string;
}

interface MyDB extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: IRecord;
  };
}

export async function initDB(): Promise<IDBPDatabase<MyDB>> {
  const db = await openDB<MyDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    },
  });
  return db;
}

let db: IDBPDatabase<MyDB> | null = null;

async function getDB(): Promise<IDBPDatabase<MyDB>> {
  if (!db) {
    db = await initDB();
  }
  return db;
}

export async function addData(
  data: Omit<IRecord, "id" | "createdAt">
): Promise<IRecord[]> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const newRecord: IRecord = {
    ...data,
    createdAt: new Date(),
  };

  await store.add(newRecord);
  await tx.done;

  return getList();
}

export async function updateJudgeAnswer(
  id: number,
  judgeAnswer: string
): Promise<IRecord | undefined> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const record = await store.get(id);
  if (!record) return undefined;

  const updatedRecord = {
    ...record,
    judgeAnswer,
  };

  await store.put(updatedRecord);
  await tx.done;

  return updatedRecord;
}

export async function deleteData(id: number): Promise<IRecord[]> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  await store.delete(id);
  await tx.done;

  return getList();
}

export async function getList(): Promise<IRecord[]> {
  const db = await getDB();
  const store = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
  const allRecords = await store.getAll();
  return allRecords.sort((a, b) => b.id! - a.id!);
}

export async function getById(id: number): Promise<IRecord | undefined> {
  const db = await getDB();
  const store = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
  return store.get(id);
}

export async function deleteModelAnswerByModelId(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const allRecords = await store.getAll();
  const latestRecord = allRecords[allRecords.length - 1];

  const models = JSON.parse(latestRecord.modelAnswer);

  const filteredModels = models.models.filter((model: any) => model.id !== id);
  const updatedModelAnswer = JSON.stringify({
    models: filteredModels,
    judge: models.judge,
  });
  await store.put({
    ...latestRecord,
    modelAnswer: updatedModelAnswer,
  });
  await tx.done;
}

export async function deleteModelAnswerByRecordId(
  id: number,
  modelId: string
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const allRecords = await store.getAll();
  const record = allRecords.find((record) => record.id === id);
  if (!record) return;
  const models = JSON.parse(record.modelAnswer);
  const filteredModels = models.models.filter(
    (model: any) => model.id !== modelId
  );
  const updatedModelAnswer = JSON.stringify({
    models: filteredModels,
    judge: models.judge,
  });
  await store.put({
    ...record,
    modelAnswer: updatedModelAnswer,
  });
  await tx.done;
}
