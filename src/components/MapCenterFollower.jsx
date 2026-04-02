import { useMapEvents } from 'react-leaflet'

export default function MapCenterFollower({ onCenterChange }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter()
      onCenterChange(c.lat, c.lng)
    }
  })
  return null
}
