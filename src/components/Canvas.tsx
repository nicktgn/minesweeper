
import { useEffect, useRef, useState } from 'react'
import { useGameContext } from '../context/GameContext'
import { GridRenderer } from '../render/GridRenderer'

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<GridRenderer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const game = useGameContext()

  useEffect(() => {
    console.log('Game context:', game)
    console.log('Grid dimensions:', game.grid.width, 'x', game.grid.height)

    if (!containerRef.current) return
  
    let cancelled = false

    console.log('Creating GridRenderer...')
    GridRenderer.create(game)
      .then(renderer => {
        console.log('GridRenderer created successfully', cancelled, renderer.canvas)
        if (!cancelled && renderer.canvas) {
          rendererRef.current = renderer
          containerRef.current!.appendChild(renderer.canvas)
          setError(null)
        } else if (cancelled) {
          renderer.destroy()
        }
      })
      .catch(error => {
        console.error('Failed to create GridRenderer:', error)
        if (!cancelled) {
          setError("Failed to initialize game renderer")
        }
      })

    return () => {
      console.log('Canvas component unmounted. Cleaning up GridRenderer...')
      cancelled = true
      if (rendererRef.current) {
        const canvas = rendererRef.current.canvas
        if (canvas && containerRef.current?.contains(canvas)) {
          containerRef.current.removeChild(canvas)
        }
        rendererRef.current.destroy()
        rendererRef.current = null
      }
    }
  }, [game])

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return <div ref={containerRef} style={{ border: '1px solid black' }} />
}

