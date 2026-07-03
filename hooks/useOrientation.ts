'use client'

/**
 * useOrientation
 *
 * Detects the current device/window orientation and listens for changes.
 * Returns 'portrait' or 'landscape'.
 *
 * Defaults to 'portrait' on the server (SSR-safe).
 * Switches to the real orientation on the client after mount.
 *
 * Usage:
 *   const orientation = useOrientation()
 *   if (orientation === 'landscape') { ... }
 */

import { useState, useEffect } from 'react'

export type Orientation = 'portrait' | 'landscape'

export function useOrientation(): Orientation {
  // Default to portrait for SSR and first render to avoid hydration mismatch
  const [orientation, setOrientation] = useState<Orientation>('portrait')

  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)')

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setOrientation(e.matches ? 'landscape' : 'portrait')
    }

    // Set immediately on mount
    handleChange(mq)

    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  return orientation
}
