import { openDB } from 'idb';

export const initDB = async () => {
  return openDB('authDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth', { keyPath: 'key' });
      }
    },
  });
};

export const getAuthValue = async (storeName: string, key: string) => {
  try {
    const db = await initDB();
    const value = await db.get(storeName, key);
    return value?.token;
  } catch (error) {
    console.error('Error accessing IndexedDB:', error);
    return null;
  }
}; 