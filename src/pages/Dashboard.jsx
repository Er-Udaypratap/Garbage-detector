import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import CameraFeed from '../components/CameraFeed'
import HamburgerMenu from '../components/HamburgerMenu'

export default function Dashboard() {
  const { session } = useAuth()
  const userId = session.user.id

  const [profile, setProfile] = useState(null)
  const [sensitivity, setSensitivity] = useState(2)
  const [detections, setDetections] = useState([])

  useEffect(() => {
    async function loadData() {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(profileData)

      const { data: detectionData } = await supabase
        .from('detections')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
      setDetections(detectionData || [])
    }

    loadData()

    // Live update the gallery when a new detection row is inserted
    const channel = supabase
      .channel('detections-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'detections', filter: `user_id=eq.${userId}` },
        (payload) => setDetections((prev) => [payload.new, ...prev])
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Litter Watch</h1>
        <HamburgerMenu
          profile={profile}
          sensitivity={sensitivity}
          setSensitivity={setSensitivity}
          detections={detections}
        />
      </header>

      <main className="dashboard-main">
        <CameraFeed
          userId={userId}
          sensitivity={sensitivity}
          onNewDetection={(row) => setDetections((prev) => [row, ...prev])}
        />
      </main>
    </div>
  )
}
