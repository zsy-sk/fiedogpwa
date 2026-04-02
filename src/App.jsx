import { useEffect, useState } from 'react'
import './App.css'
import Auth from './pages/Auth.jsx'
import BottomNav from './components/BottomNav.jsx'
import ReportEditor from './components/ReportEditor.jsx'
import List from './components/List.jsx'
import SyncPanel from './components/SyncPanel.jsx'
import { IconLogout } from './components/icons.jsx'
import { defaultCategories, defaultUsers } from './constants/defaultData.js'
import { readIndexed, readLocal, writeIndexed, writeLocal } from './utils/storage.js'

function compactOp(op) {
  if (!op || typeof op !== 'object') return op
  const id = op.item?.id ?? op.id ?? null
  const status = op.item?.status ?? op.status ?? 'new'
  const updated_at = op.item?.updated_at ?? op.updated_at ?? new Date().toISOString()
  return { op: op.op || 'upsert', item: { id, status, updated_at } }
}

function App() {
  const [view, setView] = useState(localStorage.getItem('token') ? 'list' : 'auth')
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [categories] = useState(defaultCategories)
  const [items, setItems] = useState(readLocal('reports', []))
  const [inboxMessages, setInboxMessages] = useState(readLocal('inboxMessages', []))
  const [netOn, setNetOn] = useState(navigator.onLine)
  const [pendingOps, setPendingOps] = useState((readLocal('pendingOps', []) || []).map(compactOp))
  const [lastSyncAt, setLastSyncAt] = useState(() => {
    const saved = localStorage.getItem('lastSyncAt') || ''
    const ts = Date.parse(saved)
    return Number.isFinite(ts) && ts > 0 ? saved : ''
  })

  useEffect(() => {
    const h = () => setNetOn(navigator.onLine)
    window.addEventListener('online', h)
    window.addEventListener('offline', h)
    return () => {
      window.removeEventListener('online', h)
      window.removeEventListener('offline', h)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function hydrateFromIndexedDb() {
      const [reportDb, inboxDb, pendingDb, lastSyncDb] = await Promise.all([
        readIndexed('reports', []),
        readIndexed('inboxMessages', []),
        readIndexed('pendingOps', []),
        readIndexed('lastSyncAt', '')
      ])
      if (!mounted) return
      if (Array.isArray(reportDb)) setItems(reportDb)
      if (Array.isArray(inboxDb)) setInboxMessages(inboxDb)
      if (Array.isArray(pendingDb)) setPendingOps(pendingDb.map(compactOp))
      if (typeof lastSyncDb === 'string') {
        const ts = Date.parse(lastSyncDb)
        if (Number.isFinite(ts) && ts > 0) setLastSyncAt(lastSyncDb)
      }
    }
    hydrateFromIndexedDb()
    return () => { mounted = false }
  }, [])

  useEffect(() => { writeLocal('reports', items) }, [items])
  useEffect(() => { writeLocal('inboxMessages', inboxMessages) }, [inboxMessages])
  useEffect(() => { writeLocal('pendingOps', pendingOps.map(compactOp)) }, [pendingOps])
  useEffect(() => { localStorage.setItem('lastSyncAt', lastSyncAt) }, [lastSyncAt])
  useEffect(() => { writeIndexed('reports', items) }, [items])
  useEffect(() => { writeIndexed('inboxMessages', inboxMessages) }, [inboxMessages])
  useEffect(() => { writeIndexed('pendingOps', pendingOps) }, [pendingOps])
  useEffect(() => { writeIndexed('lastSyncAt', lastSyncAt) }, [lastSyncAt])

  async function addItem(r) {
    const now = new Date().toISOString()
    const item = { ...r, id: crypto.randomUUID(), created_at: now, updated_at: now, status: 'new' }
    setItems(prev => [item, ...prev])
    setPendingOps(prev => [...prev.filter(x => String(x.item?.id) !== String(item.id)), compactOp({ op: 'upsert', item })])
    if (Array.isArray(r.recipients) && r.recipients.length) {
      const categoryName = categories.find(c => c.id === Number(r.category_id))?.name || 'Report'
      const incoming = r.recipients.map(target => ({
        id: crypto.randomUUID(),
        from: target,
        title: `${categoryName} received`,
        body: r.description || 'No description',
        created_at: now
      }))
      setInboxMessages(prev => [...incoming, ...prev])
    }
    if (netOn) await syncUpload()
    setView('list')
  }

  async function syncUpload(opsArg) {
    let ops = Array.isArray(opsArg) ? opsArg : pendingOps
    if (!Array.isArray(ops) || !ops.length) {
      const stored = readLocal('pendingOps', [])
      ops = Array.isArray(stored) ? stored.map(compactOp) : []
    }
    if (!Array.isArray(ops) || !ops.length) return

    // 如果 syncUpload 在 setState 尚未完成时调用，用最新存储值保证不会读旧数据
    writeLocal('remoteReports', items)
    setPendingOps([])
    setLastSyncAt(new Date().toISOString())
  }

  async function syncDownload() {
    const remote = readLocal('remoteReports', [])
    if (Array.isArray(remote)) setItems(remote)
    setLastSyncAt(new Date().toISOString())
  }

  async function remove(id) {
    const now = new Date().toISOString()
    setItems(prev => prev.filter(i => String(i.id) !== String(id)))
    setPendingOps(prev => [...prev.filter(x => String(x.item?.id) !== String(id)), compactOp({ op: 'delete', item: { id, status: 'archived', updated_at: now } })])
    if (netOn) await syncUpload()
  }

  async function updateItem(id, patch) {
    const old = items.find(x => String(x.id) === String(id))
    if (!old) return
    const payload = { ...old, ...patch, updated_at: new Date().toISOString() }
    setItems(prev => prev.map(x => String(x.id) === String(id) ? payload : x))
    setPendingOps(prev => [...prev.filter(x => String(x.item?.id) !== String(id)), compactOp({ op: 'upsert', item: payload })])
    if (netOn) await syncUpload()
  }

  function onLogout() {
    setToken('')
    localStorage.removeItem('token')
    setView('auth')
  }

  function navigate(next) {
    setView(next)
  }

  if (view === 'auth') {
    return (
      <div className="app">
        <section className="panel">
          <Auth
            token={token}
            setToken={t => { setToken(t); localStorage.setItem('token', t); setView('list') }}
            onLogout={onLogout}
          />
        </section>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="bar">
        <div className="brand">FieldOG</div>
        <div className="bar-actions">
          <button className="logout-btn" onClick={onLogout} aria-label="Sign out">
            <IconLogout />
          </button>
        </div>
      </header>
      <section className="panel">
        {view === 'new' && <ReportEditor categories={categories} onSave={addItem} users={defaultUsers} />}
        {view === 'list' && <List items={items} onRemove={remove} onUpdate={updateItem} categories={categories} />}
        {view === 'sync' && (
          <SyncPanel token={token} netOn={netOn} onUpload={syncUpload} onDownload={syncDownload} pendingCount={pendingOps.length} lastSyncAt={lastSyncAt} />
        )}
      </section>
      <BottomNav active={view} setActive={navigate} authed={!!token} />
    </div>
  )
}

export default App
