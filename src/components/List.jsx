import { useEffect, useRef, useState } from 'react'
import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { formatCoord, resolveMediaSrc } from '../utils/formatters.js'
import MapCenterFollower from './MapCenterFollower.jsx'

export default function List({ items, onRemove, onUpdate, categories }) {
  const [activeId, setActiveId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editPickerPoint, setEditPickerPoint] = useState(null)
  const [editGeo, setEditGeo] = useState({ lat: null, lng: null, acc: null })
  const [editMedia, setEditMedia] = useState([])
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
  const [editLocationOpen, setEditLocationOpen] = useState(false)
  const [editMediaOpen, setEditMediaOpen] = useState(false)
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const albumLimitCount = 20
  const albumLimitBytes = 15 * 1024 * 1024
  const categoryMap = new Map(categories.map(c => [Number(c.id), c.name]))

  useEffect(() => {
    canvasRef.current = document.createElement('canvas')
  }, [])

  function dataUrlBytes(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return 0
    const parts = dataUrl.split(',')
    if (parts.length < 2) return 0
    return Math.floor((parts[1].length * 3) / 4)
  }

  function currentAlbumBytes(list) {
    return list.reduce((sum, x) => sum + dataUrlBytes(x.data), 0)
  }

  function addMediaEntries(entries) {
    setEditMedia(prev => {
      const next = [...prev]
      for (const entry of entries) {
        if (next.length >= albumLimitCount) break
        const bytes = currentAlbumBytes(next) + dataUrlBytes(entry.data)
        if (bytes > albumLimitBytes) break
        next.push(entry)
      }
      return next
    })
  }

  function removeSelectedMedia() {
    setEditMedia(prev => prev.filter((_, i) => i !== selectedMediaIndex))
    setSelectedMediaIndex(prev => Math.max(0, prev - 1))
  }

  function clearAlbum() {
    setEditMedia([])
    setSelectedMediaIndex(0)
  }

  function setAsCover() {
    setEditMedia(prev => {
      if (!prev.length || selectedMediaIndex <= 0) return prev
      const next = [...prev]
      const [item] = next.splice(selectedMediaIndex, 1)
      next.unshift(item)
      setSelectedMediaIndex(0)
      return next
    })
  }

  async function onPickFiles(e) {
    const files = Array.from(e.target.files || [])
    const reads = await Promise.all(files.map(file => new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve({ mime_type: file.type || 'image/jpeg', data: String(reader.result || '') })
      reader.readAsDataURL(file)
    })))
    addMediaEntries(reads)
    e.target.value = ''
  }

  async function getGeo() {
    return new Promise(resolve => {
      if (!('geolocation' in navigator)) return resolve()
      navigator.geolocation.getCurrentPosition(p => {
        const next = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }
        setEditGeo(next)
        setEditPickerPoint(next)
        resolve(next)
      }, () => resolve(), { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 })
    })
  }

  function openEditLocation(item) {
    setEditPickerPoint({ lat: item.latitude, lng: item.longitude })
    setEditGeo({ lat: item.latitude, lng: item.longitude, acc: item.accuracy })
    setEditLocationOpen(true)
  }

  async function updateToCurrentLocation() {
    await getGeo()
  }

  function closeEditLocation() {
    // 清理orphan状态
    setEditLocationOpen(false)
    setEditPickerPoint(null)
    setEditGeo({ lat: null, lng: null, acc: null })
    setEditingId(null)
  }

  function applyEditLocation() {
    if (!editPickerPoint) return
    onUpdate(editingId, {
      latitude: editPickerPoint.lat,
      longitude: editPickerPoint.lng,
      accuracy: editGeo.acc
    })
    closeEditLocation()
  }

  function openEditMedia(item) {
    setEditMedia(item.media || [])
    setSelectedMediaIndex(0)
    setEditMediaOpen(true)
  }

  function closeEditMedia() {
    // 清理orphan状态
    setEditMediaOpen(false)
    setEditMedia([])
    setSelectedMediaIndex(0)
    setEditingId(null)
  }

  function saveEditMedia() {
    onUpdate(editingId, { media: editMedia })
    closeEditMedia()
  }

  return (
    <div className="list">
      {items.map(i => (
        <div key={i.id} className="card">
          <div className="title">
            <span>{categoryMap.get(Number(i.category_id)) || 'Uncategorized'}</span>
            <span>{new Date(i.created_at).toLocaleString()}</span>
          </div>
          <div className="summary" onClick={() => setActiveId(prev => prev === i.id ? null : i.id)}>
            <div className="summary-top">
              <button className="detail-btn">{activeId === i.id ? 'Collapse' : 'Details'}</button>
              <div className="summary-inline-desc">{i.description || 'No description'}</div>
            </div>
          </div>
          {activeId === i.id && (
            <div className="content">
              <div className="meta-grid">
                <div>Location: {formatCoord(i.latitude)},{formatCoord(i.longitude)}</div>
                <div>Heading: {i.heading ?? '-'}</div>
                <div>Pose: {i.orientation}</div>
              </div>
              <div className="desc">{i.description}</div>
              {i.media?.length ? (
                <div className="row thumbs">
                  {i.media.slice(0, 3).map((m, idx) => <img key={idx} src={resolveMediaSrc(m.data)} alt="" />)}
                </div>
              ) : null}
              <div className="actions">
                <button onClick={() => {
                  const text = window.prompt('Edit description', i.description || '')
                  if (text === null) return
                  onUpdate(i.id, { description: text })
                }}>
                  Edit Description
                </button>
                <button onClick={() => {
                  setEditingId(i.id)
                  openEditLocation(i)
                }}>
                  Edit Location
                </button>
                <button onClick={() => {
                  setEditingId(i.id)
                  openEditMedia(i)
                }}>
                  Edit Photos
                </button>
                <button onClick={() => onRemove(i.id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {!items.length && <div>No reports</div>}

      {editLocationOpen && (
        <div className="modal-backdrop" onClick={closeEditLocation}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span>Edit Location</span>
              <button onClick={closeEditLocation}>Close</button>
            </div>
            <div className="map-wrap">
              {editPickerPoint && (
                <MapContainer center={[editPickerPoint.lat, editPickerPoint.lng]} zoom={17} className="map-box">
                  <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <CircleMarker center={[editPickerPoint.lat, editPickerPoint.lng]} radius={8} pathOptions={{ color: '#1e66ff', fillColor: '#1e66ff', fillOpacity: 0.9 }} />
                  <MapCenterFollower onCenterChange={(lat, lng) => setEditPickerPoint({ lat, lng })} />
                </MapContainer>
              )}
            </div>
            <div className="grid">
              <div>Latitude: {editPickerPoint?.lat?.toFixed?.(6) || '-'}</div>
              <div>Longitude: {editPickerPoint?.lng?.toFixed?.(6) || '-'}</div>
              <div>Accuracy: {editGeo.acc ? `${Math.round(editGeo.acc)}m` : '-'}</div>
            </div>
            <div className="hstack">
              <button onClick={updateToCurrentLocation}>📍 Update Current GPS Location</button>
              <button onClick={applyEditLocation} className="btn-primary-lite">Save Location</button>
            </div>
          </div>
        </div>
      )}

      {editMediaOpen && (
        <div className="modal-backdrop" onClick={closeEditMedia}>
          <div className="modal camera-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span>Edit Photos</span>
              <button onClick={closeEditMedia}>Close</button>
            </div>
            <div className="camera-toolbar">
              <label className="file-pick">
                <span>Add photos</span>
                <input type="file" accept="image/*" multiple onChange={onPickFiles} />
              </label>
            </div>
            <div className="album-meta">Album: {editMedia.length}/{albumLimitCount} images, about {(currentAlbumBytes(editMedia) / (1024 * 1024)).toFixed(2)}MB</div>
            {editMedia[selectedMediaIndex] && <img className="album-cover" src={editMedia[selectedMediaIndex].data} alt="" />}
            <div className="hstack album-actions">
              <button onClick={setAsCover}>Set cover</button>
              <button onClick={removeSelectedMedia}>Remove selected</button>
              <button onClick={clearAlbum}>Clear album</button>
            </div>
            <div className="thumbs">
              {editMedia.map((m, i) => <img key={i} src={m.data} alt="" className={i === selectedMediaIndex ? 'thumb-active' : ''} onClick={() => setSelectedMediaIndex(i)} />)}
            </div>
            <div className="hstack">
              <button onClick={saveEditMedia} className="btn-primary-lite">Save Photos</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
