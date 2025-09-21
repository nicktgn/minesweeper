
import { useEffect, useRef, useState } from 'react'
import { useGameContext } from '../context/GameContext'
import { GridRenderer } from '../render/GridRenderer'

type CanvasProps = {
  forceOpenAllCells?: boolean
  nonInteractive?: boolean
}

export default function Canvas({
  forceOpenAllCells = false,
  nonInteractive = false
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<GridRenderer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const game = useGameContext()

  const destroyRenderer = () => {
    if (rendererRef.current) {
      const canvas = rendererRef.current.canvas
      if (canvas && containerRef.current?.contains(canvas)) {
        containerRef.current.removeChild(canvas)
      }
      rendererRef.current.destroy()
      rendererRef.current = null
    }
  }

  useEffect(() => {
    if (!containerRef.current) return

    if (rendererRef.current) {
      rendererRef.current.destroy()
    }

    let cancelled = false

    GridRenderer.create(game, { forceOpenAllCells, nonInteractive })
      .then(renderer => {
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
      cancelled = true
      destroyRenderer()
    }
  }, [game])

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div className={`
      border-t-0 border-2 rounded-lg rounded-t-none p-2
      bg-[#4f5962] border-[#2b333a]
    `}>
      <div ref={containerRef} className='flex justify-center items-center' />
    </div>
  )
}

