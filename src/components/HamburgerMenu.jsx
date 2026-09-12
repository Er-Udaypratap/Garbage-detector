import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function HamburgerMenu({ profile, sensitivity, setSensitivity, detections }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('profile') // profile | settings | gallery

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="menu-wrap">
      <button className="hamburger-btn" onClick={() => setOpen(!open)} aria-label="Menu">
        ☰
      </button>

      {open && (
        <div className="menu-panel">
          <div className="menu-tabs">
            <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
              Profile
            </button>
            <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
              Settings
            </button>
            <button className={tab === 'gallery' ? 'active' : ''} onClick={() => setTab('gallery')}>
              Gallery ({detections.length})
            </button>
          </div>

          <div className="menu-body">
            {tab === 'profile' && (
              <div>
                <p><strong>Name:</strong> {profile?.name || '—'}</p>
                <p><strong>Email:</strong> {profile?.email || '—'}</p>
                <button className="logout-btn" onClick={handleLogout}>Log out</button>
              </div>
            )}

            {tab === 'settings' && (
              <div>
                <label>Detection sensitivity</label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                />
                <p className="settings-hint">
                  Lower = more sensitive (more false positives). Current: {sensitivity}%
                </p>
              </div>
            )}

            {tab === 'gallery' && (
              <div className="gallery-list">
                {detections.length === 0 && <p>No detections yet.</p>}
                {detections.map((d) => (
                  <a key={d.id} href={d.image_url} target="_blank" rel="noreferrer" className="gallery-item">
                    <img src={d.image_url} alt="detection" />
                    <span>{new Date(d.timestamp).toLocaleTimeString()}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
