import { useCallback, useEffect, useMemo, useState } from 'react'
import { padZeros } from '../utils'
import { GameState } from '../model'
import { useGameContext } from '../context/GameContext'

// Classic Minesweeper-style top bar UI
// - Left: remaining mines (digital 3-digit display)
// - Middle: smiley button (reset / face changes by state)
// - Right: elapsed seconds (digital 3-digit display)
// Uses Tailwind classes for styling; placeholder values only.

type Face = '😑' | '🙂' | '😵' | '😎'

type DigitalCounterProps = {
  value: number
}

const DigitalCounter = ({ value }: DigitalCounterProps) => {
  const text = useMemo(() => padZeros(value), [value])
  return (
    <div
      className="flex h-10 min-w-[72px] items-center justify-end rounded-[4px] bg-[#1a0000] px-1 shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.8),inset_0_2px_0_0_rgba(255,60,60,0.2)] ring-2 ring-[#3a0000]"
    >
      <span className="font-mono text-[28px] font-black leading-none tracking-[0.1em] text-[#ff2a2a] drop-shadow-[0_0_6px_rgba(255,0,0,0.7)]">
        {text}
      </span>
    </div>
  )
}

type SimpleButtonProps = {
  face: Face
  onClick: () => void
}

const SmileyButton = ({
  face,
  onClick,
}: SimpleButtonProps) => {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      type="button"
      aria-label="Reset"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onClick}
      className={
        'grid h-12 w-12 place-items-center rounded bg-[#5e6a75] ring-2 ring-[#2f3942] shadow-[inset_0_2px_0_0_rgba(255,255,255,0.2),inset_0_-3px_0_0_rgba(0,0,0,0.4)]'
      }
      style={{
        transform: pressed ? 'translateY(1px)' : undefined,
        boxShadow: pressed
          ? 'inset 0 -2px 0 0 rgba(255,255,255,0.15), inset 0 3px 0 0 rgba(0,0,0,0.5)'
          : undefined,
      }}
    >
      <span className="text-2xl leading-none">{face}</span>
    </button>
  )
}

export default function GameUI() {
  // Placeholder state only; not connected to the actual game

  const game = useGameContext()
  const gameState = game.gameState

  const [minesLeft, setMinesLeft] = useState(game.mineCount)
  const [seconds, setSeconds] = useState(0)
  const [face, setFace] = useState<Face>(gameStateToFace(gameState))

  const handleProgress = useCallback(() => {
    setMinesLeft(game.mineCount - game.flagCount)
  }, [game, setMinesLeft])

  const handleGameStateChange = useCallback((state: GameState) => {
    setFace(gameStateToFace(state))
  } , [game, setFace])

  const handleGameTimerTick = useCallback((time: number) => {
    setSeconds(time)
  }, [game, setSeconds])

  const handleReset = useCallback(() => {
    game.reset()

    setSeconds(0)
    setMinesLeft(game.mineCount)
    setFace(gameStateToFace(game.gameState))
  }, [game, setSeconds, setMinesLeft, setFace])

  useEffect(() => {
    if (!game) {
      return
    }

    // set up game listeners
    game.onProgress(handleProgress)
    game.onStateChange(handleGameStateChange)
    game.onTick(handleGameTimerTick)

    // clean up
    return () => {
      game.offProgress(handleProgress)
      game.offStateChange(handleGameStateChange)
      game.offTick(handleGameTimerTick)
    }
  }, [game, gameState, handleProgress, handleGameStateChange, handleGameTimerTick])

  return (
    <div className="w-full select-none">
      {/* Panel frame to mimic classic bezel */}
      <div className={`
        rounded-md rounded-b-none bg-[#4f5962] p-2 border-b-0 border-2 border-[#2b333a]
      `}>
        <div className="rounded-sm bg-[#5a646e] p-3 ring-1 ring-[#1e2329] shadow-[inset_0_2px_0_0_rgba(255,255,255,0.12),inset_0_-2px_0_0_rgba(0,0,0,0.35)]">
          <div className="flex justify-between gap-8">
            <DigitalCounter value={minesLeft} />
            <SmileyButton face={face} onClick={handleReset} />
            <DigitalCounter value={seconds} />
          </div>
        </div>
      </div>

    </div>
  )
}

function gameStateToFace(gameState: GameState): Face {
  switch (gameState) {
    case GameState.NOT_STARTED:
      return '😑'
    case GameState.IN_PROGRESS:
      return '🙂'
    case GameState.LOST:
      return '😵'
    case GameState.WON:
      return '😎'
  }
}
