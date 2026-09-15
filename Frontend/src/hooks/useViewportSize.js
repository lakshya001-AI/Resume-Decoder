import { useEffect, useState } from "react"

/** Live viewport size, throttled to one update per animation frame. */
export const useViewportSize = () => {
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  useEffect(() => {
    let frame = 0

    const handleResize = () => {
      // Resize fires far faster than the screen repaints; coalesce to one
      // setState per frame so dragging the window edge stays smooth.
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() =>
        setSize({ width: window.innerWidth, height: window.innerHeight }),
      )
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("orientationchange", handleResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleResize)
    }
  }, [])

  return size
}
