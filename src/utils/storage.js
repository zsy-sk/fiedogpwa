export function readLocal(key, d) {
  try {
    const t = localStorage.getItem(key)
    return t ? JSON.parse(t) : d
  } catch {
    return d
  }
}

export function writeLocal(key, v) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
    return true
  } catch {
    return false
  }
}

const DB_NAME = 'fieldog-pwa'
const STORE_NAME = 'kv'

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function readIndexed(key, d) {
  try {
    const db = await openDb()
    const value = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    db.close()
    return value ?? d
  } catch {
    return d
  }
}

export async function writeIndexed(key, value) {
  try {
    const db = await openDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.objectStore(STORE_NAME).put(value, key)
    })
    db.close()
  } catch {
    return
  }
}
