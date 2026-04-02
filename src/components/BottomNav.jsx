import { IconCamera, IconList, IconSync } from './icons.jsx'

export default function BottomNav({ active, setActive, authed }) {
  return (
    <nav className="bottom-nav" aria-label="Bottom navigation">
      <button aria-label="List" className={active==='list' ? 'active' : ''} onClick={() => setActive('list')} disabled={!authed}>
        <IconList /><span className="label">List</span>
      </button>
      <button aria-label="New" className={active==='new' ? 'active' : ''} onClick={() => setActive('new')} disabled={!authed}>
        <IconCamera /><span className="label">New</span>
      </button>
      <button aria-label="Sync" className={active==='sync' ? 'active' : ''} onClick={() => setActive('sync')} disabled={!authed}>
        <IconSync /><span className="label">Sync</span>
      </button>
    </nav>
  )
}
