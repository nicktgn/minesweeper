import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { DifficultyMap, type IGame } from '../model'
import { useAtomValue } from 'jotai'
import { difficultyLevelAtom } from '../atoms/globalAtom'
import GameController from '../controller'

const GameContext = createContext<IGame | null>(null)

interface GameProviderProps {
  children: ReactNode
}

export function GameProvider({ children }: GameProviderProps) {
  const difficultyLevel = useAtomValue(difficultyLevelAtom)
  const game = useMemo<IGame>(() => {
    const config = DifficultyMap[difficultyLevel].config
    return new GameController(config)
  }, [difficultyLevel])

  return (
    <GameContext.Provider value={game}>
      {children}
    </GameContext.Provider>
  )
}

export function useGameContext(): IGame {
  const context = useContext(GameContext)
  if (context === null) {
    throw new Error('useGameContext must be used within a GameProvider')
  }
  return context
}
