import { useState } from 'react'
import { formatCoord, resolveMediaSrc } from '../utils/formatters.js'

export default function List({ items, onRemove, onUpdate, categories }) {
  const [activeId, setActiveId] = useState(null)
  const categoryMap = new Map(categories.map(c => [Number(c.id), c.name]))

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
                }}
                >
                  Edit
                </button>
                <button onClick={() => onRemove(i.id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {!items.length && <div>No reports</div>}
    </div>
  )
}
