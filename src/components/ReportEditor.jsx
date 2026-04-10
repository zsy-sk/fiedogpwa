import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { IconCamera, IconCategory, IconContact, IconLocation, IconSave, IconText } from './icons.jsx'
import MapCenterFollower from './MapCenterFollower.jsx'

export default function ReportEditor({ categories, onSave, users }) {
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(categories[0]?.id || 1)
  const [recipients, setRecipients] = useState([])
  const [media, setMedia] = useState([])
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [cameraModalOpen, setCameraModalOpen] = useState(false)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [pickerPoint, setPickerPoint] = useState(null)
  const [geo, setGeo] = useState({ lat: null, lng: null, acc: null })
  const [heading, setHeading] = useState(null)
  const [pose, setPose] = useState('unknown')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)
  const scanningRef = useRef(false)
  const [scanning, setScanning] = useState(false)
  const [scanText, setScanText] = useState('')
  const albumLimitCount = 20
  const albumLimitBytes = 15 * 1024 * 1024

  useEffect(() => {
    canvasRef.current = document.createElement('canvas')
  }, [])

  useEffect(() => {
    if (!cameraModalOpen) {
      scanningRef.current = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [cameraModalOpen])

  function stopScan() {
    scanningRef.current = false
    setScanning(false)
  }

  async function getGeo() {
    return new Promise(resolve => {
      if (!('geolocation' in navigator)) return resolve()
      navigator.geolocation.getCurrentPosition(p => {
        const next = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }
        setGeo(next)
        resolve(next)
      }, () => resolve(), { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 })
    })
  }

  async function openLocationPicker() {
    const current = await getGeo()
    const base = current || (geo.lat && geo.lng ? { lat: geo.lat, lng: geo.lng, acc: geo.acc } : { lat: 39.9042, lng: 116.4074, acc: null })
    setPickerPoint({ lat: base.lat, lng: base.lng })
    setLocationModalOpen(true)
  }

 function applyPickedLocation() {
  if (!pickerPoint) return
  setGeo(prev => ({ ...prev, lat: pickerPoint.lat, lng: pickerPoint.lng,acc: null}))
  setLocationModalOpen(false)
}

  function onOrientation(e) {
    if (typeof e.alpha === 'number') {
      const h = 360 - e.alpha
      setHeading(Math.round(h))
    }
  }

  function onMotion(e) {
    const g = e.accelerationIncludingGravity
    if (!g) return
    const z = g.z || 0
    if (z > 7) setPose('up')
    else if (z < -7) setPose('down')
    else setPose('flat')
  }

  useEffect(() => {
    if (window.DeviceOrientationEvent) window.addEventListener('deviceorientation', onOrientation)
    if (window.DeviceMotionEvent) window.addEventListener('devicemotion', onMotion)
    return () => {
      if (window.DeviceOrientationEvent) window.removeEventListener('deviceorientation', onOrientation)
      if (window.DeviceMotionEvent) window.removeEventListener('devicemotion', onMotion)
    }
  }, [])

  async function openCamera() {
    if (!navigator.mediaDevices) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        videoRef.current.playsInline = true
        await videoRef.current.play()
      }
    } catch (error) {
      console.warn('Camera access failed:', error)
      alert('The camera cannot be opened. Please check the permissions and device support.')
      closeCamera()
    }
  }

  function closeCamera() {
    stopScan()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

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
    setMedia(prev => {
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
    setMedia(prev => prev.filter((_, i) => i !== selectedMediaIndex))
    setSelectedMediaIndex(prev => Math.max(0, prev - 1))
  }

  function clearAlbum() {
    setMedia([])
    setSelectedMediaIndex(0)
  }

  function setAsCover() {
    setMedia(prev => {
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

  function capturePhoto() {
    const v = videoRef.current
    if (!v) return
    const c = canvasRef.current
    c.width = v.videoWidth
    c.height = v.videoHeight
    const ctx = c.getContext('2d')
    ctx.drawImage(v, 0, 0)
    const data = c.toDataURL('image/jpeg', 0.8)
    addMediaEntries([{ mime_type: 'image/jpeg', data }])
  }

  async function startScan() {
    if (!videoRef.current) {
      await new Promise(r => requestAnimationFrame(r))
    }
    if (!streamRef.current) await openCamera()
    let v = videoRef.current
    if (!v) {
      await new Promise(r => requestAnimationFrame(r))
      v = videoRef.current
    }
    if (!v) return
    if (!v.videoWidth || !v.videoHeight) {
      await new Promise(resolve => {
        const handler = () => {
          v.removeEventListener('loadedmetadata', handler)
          resolve()
        }
        v.addEventListener('loadedmetadata', handler, { once: true })
      })
    }
    const hasNative = 'BarcodeDetector' in window
    let detector = null
    if (hasNative) {
      try {
        detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      } catch {
        detector = null
      }
    }
    scanningRef.current = true
    setScanning(true)
    setScanText('')
    const c = canvasRef.current
    const ctx = c.getContext('2d', { willReadFrequently: true })
    async function tick() {
      if (!scanningRef.current) return
      if (detector) {
        try {
          const codes = await detector.detect(v)
          if (Array.isArray(codes) && codes.length > 0) {
            const text = String(codes[0].rawValue || '')
            if (text) {
              setScanText(text)
              scanningRef.current = false
              setScanning(false)
              return
            }
          }
        } catch {
          detector = null
        }
      }
      if (!detector) {
        try {
          const vw = v.videoWidth || 640
          const vh = v.videoHeight || 480
          const scale = Math.min(640 / vw, 640 / vh)
          const tw = Math.floor(vw * scale)
          const th = Math.floor(vh * scale)
          c.width = tw
          c.height = th
          ctx.drawImage(v, 0, 0, tw, th)
          const imageData = ctx.getImageData(0, 0, c.width, c.height)
          const result = jsQR(imageData.data, imageData.width, imageData.height)
          if (result && result.data) {
            setScanText(String(result.data))
            scanningRef.current = false
            setScanning(false)
            return
          }
        } catch {
          scanningRef.current = false
          setScanning(false)
          return
        }
      }
      requestAnimationFrame(tick)
    }
    tick()
  }

  function chooseContacts() {
    setContactModalOpen(true)
  }

  function pickUser(user) {
    setRecipients(prev => prev.includes(user.contact) ? prev : [...prev, user.contact])
  }

  async function save() {
    let lat = geo.lat
    let lng = geo.lng
    let acc = geo.acc
    if ((lat === null || lng === null) && pickerPoint) {
      lat = pickerPoint.lat
      lng = pickerPoint.lng
    }
    if (lat === null || lng === null) {
      const nowGeo = await getGeo()
      if (nowGeo) {
        lat = nowGeo.lat
        lng = nowGeo.lng
        acc = nowGeo.acc
      }
    }
    if (lat === null || lng === null) {
      alert('Location not available. Please choose a point in the map dialog or allow location permission.')
      return
    }
    await onSave({
      description,
      category_id: Number(category),
      recipients,
      media,
      latitude: lat,
      longitude: lng,
      accuracy: acc,
      heading,
      orientation: pose
    })
    setDescription('')
    setRecipients([])
    setMedia([])
    setSelectedMediaIndex(0)
    closeCamera()
  }

  return (
    <div className="editor">
      <div className="row">
        <label className="field-label"><IconCategory />Category</label>
        <div className="category-wrap">
          <div className="sensor-icons">
            <button className="icon-only-btn" onClick={() => setCameraModalOpen(true)} aria-label="Open camera dialog">
              <IconCamera width="20" height="20" />
            </button>
            <button className="icon-only-btn" onClick={openLocationPicker} aria-label="Open location dialog">
              <IconLocation />
            </button>
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="row">
        <label className="field-label"><IconText />Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
      </div>

      <div className="row">
        <label className="field-label"><IconContact />Recipients</label>
        <div className="hstack">
          <input placeholder="Type email/phone then press Enter" onKeyDown={e => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              setRecipients(prev => Array.from(new Set([...prev, e.currentTarget.value.trim()])))
              e.currentTarget.value = ''
            }
          }} />
          <button onClick={chooseContacts}>From contacts</button>
        </div>
        <div className="chips">
          {recipients.map(r => (
            <span key={r} className="chip" onClick={() => setRecipients(prev => prev.filter(x => x !== r))}>{r} ×</span>
          ))}
        </div>
      </div>

      <div className="row">
        <button className="save-btn" onClick={save}><IconSave />Save</button>
      </div>

      {cameraModalOpen && (
        <div className="modal-backdrop" onClick={() => { setCameraModalOpen(false); closeCamera() }}>
          <div className="modal camera-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span>Camera</span>
              <button onClick={() => { setCameraModalOpen(false); closeCamera() }}>Close</button>
            </div>
            <div className="camera-toolbar">
              <div className="hstack camera-actions">
                <button onClick={openCamera}>Open</button>
                <button onClick={capturePhoto}>Capture</button>
                <button onClick={startScan} disabled={scanning}>Scan QR</button>
              </div>
              <label className="file-pick">
                <span>Import photos</span>
                <input type="file" accept="image/*" multiple onChange={onPickFiles} />
              </label>
            </div>
            {(scanning || scanText) && (
              <div className="scan-result">
                <div>{scanning ? 'Scanning…' : 'Scan result:'}</div>
                {!scanning && !!scanText && (
                  <div className="hstack">
                    <div className="scan-text">{scanText}</div>
                    <button onClick={() => setDescription(prev => prev ? (prev + ' ' + scanText) : scanText)}>Insert</button>
                    <button onClick={() => setScanText('')}>Clear</button>
                  </div>
                )}
              </div>
            )}
            <div className="album-meta">Album: {media.length}/{albumLimitCount} images, about {(currentAlbumBytes(media) / (1024 * 1024)).toFixed(2)}MB</div>
            {media[selectedMediaIndex] && <img className="album-cover" src={media[selectedMediaIndex].data} alt="" />}
            <div className="hstack album-actions">
              <button onClick={setAsCover}>Set cover</button>
              <button onClick={removeSelectedMedia}>Remove selected</button>
              <button onClick={clearAlbum}>Clear album</button>
            </div>
            <video ref={videoRef} className="preview" playsInline muted autoPlay />
            <div className="thumbs">
              {media.map((m, i) => <img key={i} src={m.data} alt="" className={i === selectedMediaIndex ? 'thumb-active' : ''} onClick={() => setSelectedMediaIndex(i)} />)}
            </div>
          </div>
        </div>
      )}

      {locationModalOpen && (
        <div className="modal-backdrop" onClick={() => setLocationModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span>Location</span>
              <button onClick={() => setLocationModalOpen(false)}>Close</button>
            </div>
            <div className="map-wrap">
              {pickerPoint && (
                <MapContainer center={[pickerPoint.lat, pickerPoint.lng]} zoom={17} className="map-box">
                  <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <CircleMarker center={[pickerPoint.lat, pickerPoint.lng]} radius={8} pathOptions={{ color: '#1e66ff', fillColor: '#1e66ff', fillOpacity: 0.9 }} />
                  <MapCenterFollower onCenterChange={(lat, lng) => setPickerPoint({ lat, lng })} />
                </MapContainer>
              )}
            </div>
            <div className="grid">
              <div>Latitude: {pickerPoint?.lat?.toFixed?.(6) || '-'}</div>
              <div>Longitude: {pickerPoint?.lng?.toFixed?.(6) || '-'}</div>
              <div>Accuracy: {geo.acc ? `${Math.round(geo.acc)}m` : '-'}</div>
              <div>Heading: {heading ?? '-'}</div>
              <div>Pose: {pose}</div>
            </div>
            <div className="hstack">
              <button onClick={openLocationPicker}>Back to current location</button>
              <button className="btn-primary-lite" onClick={applyPickedLocation}>Use selected coordinates</button>
            </div>
          </div>
        </div>
      )}

      {contactModalOpen && (
        <div className="modal-backdrop" onClick={() => setContactModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span>Select contact</span>
              <button onClick={() => setContactModalOpen(false)}>Close</button>
            </div>
            <div className="contact-list">
              {users.map(user => (
                <button key={user.id} className="contact-item" onClick={() => pickUser(user)}>
                  <div className="contact-name">{user.name}</div>
                  <div className="contact-meta">{user.contact}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
