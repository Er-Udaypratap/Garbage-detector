import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { frameDifferencePercent, isDetection } from '../lib/detection'

const CAPTURE_INTERVAL_MS = 1000 // check one frame per second
const COOLDOWN_MS = 5000 // don't re-trigger for 5s after a detection

export default function CameraFeed({ userId, sensitivity, onNewDetection }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const prevFrameRef = useRef(null)
  const lastDetectionAtRef = useRef(0)
  const [cameraError, setCameraError] = useState('')
  const [status, setStatus] = useState('starting') // starting | live | error
  const [facingMode, setFacingMode] = useState('environment') // 'environment' = back camera, 'user' = front
  const [lastChangePercent, setLastChangePercent] = useState(0)
  const [debugMsg, setDebugMsg] = useState('')

  useEffect(() => {
    let stream

    async function startCamera() {
      setStatus('starting')
      try {
        // Stop any previous stream before requesting a new facing mode
        if (videoRef.current?.srcObject) {
          videoRef.current.srcObject.getTracks().forEach((t) => t.stop())
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        prevFrameRef.current = null // reset comparison baseline on camera switch
        setStatus('live')
      } catch (err) {
        setCameraError(
          'Camera permission denied, unavailable, or this device has no ' +
            (facingMode === 'environment' ? 'back' : 'front') +
            ' camera. Try switching camera or check browser permissions.'
        )
        setStatus('error')
      }
    }

    startCamera()

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop())
    }
  }, [facingMode])

  useEffect(() => {
    if (status !== 'live') return

    const interval = setInterval(() => {
      checkFrame()
    }, CAPTURE_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [status, sensitivity])

  function checkFrame() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height)

    if (prevFrameRef.current) {
      const changePercent = frameDifferencePercent(prevFrameRef.current, currentFrame)
      setLastChangePercent(changePercent)

      const inCooldown = Date.now() - lastDetectionAtRef.current < COOLDOWN_MS

      if (isDetection(changePercent, sensitivity) && !inCooldown) {
        lastDetectionAtRef.current = Date.now()
        captureAndUpload(canvas)
      }
    }

    prevFrameRef.current = currentFrame
  }

  function captureAndUpload(canvas) {
    setDebugMsg('Detected change — uploading...')
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setDebugMsg('Failed to create image from frame.')
        return
      }

      const timestamp = new Date().toISOString()
      const filePath = `${userId}/${timestamp.replace(/[:.]/g, '-')}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(filePath, blob, { contentType: 'image/jpeg' })

      if (uploadError) {
        setDebugMsg('Upload failed: ' + uploadError.message)
        return
      }

      const { data: urlData } = supabase.storage.from('screenshots').getPublicUrl(filePath)

      const { data: row, error: insertError } = await supabase
        .from('detections')
        .insert({
          user_id: userId,
          image_url: urlData.publicUrl,
          timestamp,
          status: 'unverified',
        })
        .select()
        .single()

      if (insertError) {
        setDebugMsg('Database save failed: ' + insertError.message)
        return
      }

      setDebugMsg('Saved ✓')
      onNewDetection?.(row)
    }, 'image/jpeg', 0.85)
  }

  function toggleCamera() {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  return (
    <div className="camera-wrap">
      <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {status === 'starting' && <div className="camera-overlay">Requesting camera access...</div>}
      {status === 'error' && <div className="camera-overlay camera-overlay--error">{cameraError}</div>}

      {status === 'live' && (
        <>
          <div className="camera-badge">● Monitoring</div>
          <button className="camera-switch-btn" onClick={toggleCamera} title="Switch camera">
            ⟲ {facingMode === 'environment' ? 'Back' : 'Front'}
          </button>
          <div className="camera-debug">
            Change: {lastChangePercent.toFixed(1)}% / threshold {sensitivity}%
            {debugMsg && <div>{debugMsg}</div>}
          </div>
        </>
      )}
    </div>
  )
}
