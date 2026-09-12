// Simple motion/change detection by comparing pixel data between two frames.
// No ML model needed — good enough for an MVP. Swap this out for TensorFlow.js
// (e.g. COCO-SSD) later if you want actual "is this garbage" classification.

/**
 * Compares two ImageData objects and returns what % of pixels changed
 * significantly between them.
 */
export function frameDifferencePercent(prevImageData, currImageData, pixelThreshold = 40) {
  const prev = prevImageData.data
  const curr = currImageData.data
  let changedPixels = 0
  const totalPixels = prev.length / 4

  for (let i = 0; i < prev.length; i += 4) {
    const diff =
      Math.abs(prev[i] - curr[i]) +
      Math.abs(prev[i + 1] - curr[i + 1]) +
      Math.abs(prev[i + 2] - curr[i + 2])

    if (diff > pixelThreshold) changedPixels++
  }

  return (changedPixels / totalPixels) * 100
}

/**
 * Decides if a detection should fire based on how much of the frame changed.
 * sensitivity: % of frame that must change to count as a detection (default 2%)
 */
export function isDetection(changePercent, sensitivity = 2) {
  return changePercent > sensitivity
}
