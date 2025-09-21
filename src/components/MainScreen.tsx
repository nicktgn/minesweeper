import { useState } from 'react'
import { DifficultyMap } from '../model'
import { useAtomValue, useSetAtom } from 'jotai'
import { difficultyLevelAtom, screenAtom } from '../atoms/globalAtom'
import type { ButtonHTMLAttributes } from 'react'

type DifficultyButtonProps = {
  title: string
  info: string
  selected?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>

function DifficultyButton({ title, info, selected = false, className = '', ...props }: DifficultyButtonProps) {
  const base = `flex w-full items-center justify-between rounded-sm
  px-4 py-3 text-left text-[#1f2937] ring-1 ring-[#90979d]
  shadow-[inset_0_2px_0_rgba(255,255,255,0.7),inset_0_-4px_0_rgba(0,0,0,0.25)]
  transition hover:brightness-105`
  const surface = selected ? 'bg-[#eef1f3]' : 'bg-[#cfd4d8]'

  return (
    <button
      {...props}
      className={`${base} ${surface} ${className}`}
    >
      <span className="font-semibold">{title}</span>
      <span className="text-sm opacity-70">{info}</span>
    </button>
  )
}

export default function MainMenu() {
  const [selectedDifficulty, setSelectedDifficulty] = useState(
    useAtomValue(difficultyLevelAtom)
  )
  const setDifficulty = useSetAtom(difficultyLevelAtom)
  const setScreen = useSetAtom(screenAtom)

  const handleStartGame = () => {
    setDifficulty(selectedDifficulty)
    setScreen('game')
  }

  return (
    <div className="w-full max-w-[560px] select-none text-white">
      {/* Outer bezel/frame */}
      <div className="rounded-md bg-[#4f5962] p-4 border-2 border-[#2b333a] shadow-[0_6px_0_rgba(0,0,0,0.25)]">
        {/* Menu area styled like the board window */}
        <div className="mt-6 rounded-sm bg-[#5a646e] p-4 ring-1 ring-[#1e2329] shadow-[inset_0_2px_0_0_rgba(255,255,255,0.12),inset_0_-2px_0_0_rgba(0,0,0,0.35)]">
          <div className="mx-auto w-full max-w-[440px]">
            <h2 className="mb-3 text-center text-xl font-semibold text-slate-100">Select Difficulty</h2>

            <div className="space-y-2">
              {Object.values(DifficultyMap).map((level, index) => {
                const selected = selectedDifficulty === index
                const info = `${level.config.grid.width}×${level.config.grid.height}, ${Math.round(level.config.grid.width * level.config.grid.height * level.config.grid.mineRatio)} mines`
                return (
                  <DifficultyButton
                    key={level.name}
                    title={level.name}
                    info={info}
                    selected={selected}
                    onClick={() => setSelectedDifficulty(index)}
                  />
                )
              })}
            </div>

            <div className="mt-4 flex justify-center">
              <button
                onClick={handleStartGame}
                className="inline-flex items-center gap-2 rounded bg-yellow-400 px-5 py-3 font-bold text-black ring-2 ring-[#2f3942] shadow-[inset_0_2px_0_0_rgba(255,255,255,0.6),inset_0_-3px_0_0_rgba(0,0,0,0.4)] transition active:translate-y-[1px]"
              >
                <span className="text-xl">🙂</span>
                Start Game
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
