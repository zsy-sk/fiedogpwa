export default function SyncPanel({ token, netOn, onUpload, onDownload, pendingCount, lastSyncAt }) {
  const syncTime = Date.parse(lastSyncAt || '')
  const syncText = Number.isFinite(syncTime) && syncTime > 0 ? new Date(lastSyncAt).toLocaleString() : '-'

  return (
    <div className="sync">
      <div className="row">
        <div>Network: {netOn ? 'Online' : 'Offline'}</div>
        <div>Storage: LocalStorage + IndexedDB</div>
        <div>Status: {token ? 'Signed in' : 'Signed out'}</div>
      </div>
      <div className="row">
        <div>Pending upload: {pendingCount}</div>
        <div>Last sync: {syncText}</div>
      </div>
      <div className="row">
        <button onClick={onUpload} disabled={!token}>Upload</button>
        <button onClick={onDownload} disabled={!token}>Download</button>
      </div>
    </div>
  )
}
