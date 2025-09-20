import { createContext, useContext, type ReactNode } from 'react'
import type { IGame } from '../model'

const GameContext = createContext<IGame | null>(null)

interface GameProviderProps {
  children: ReactNode
  game: IGame
}

export function GameProvider({ children, game }: GameProviderProps) {
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