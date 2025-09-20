
import { useEffect } from 'react'
import { useAtomValue } from 'jotai'

import GameController from '../controller'
import { GameProvider } from '../context/GameContext'
import Canvas from '../components/Canvas'
import { DifficultyMap, GameState } from '../model'
import { difficultyLevelAtom } from '../atoms/globalAtom'


const GameScreen = () => {
  const difficultyLevel = useAtomValue(difficultyLevelAtom)
  const difficultyConfig = DifficultyMap[difficultyLevel].config
  const game = new GameController(difficultyConfig)

  const handleGameStateChange = (state: GameState) => {
    console.log('Game state changed:', state)
  }

  const handleGameTimerTick = (time: number) => {
    console.log('Game timer tick:', time)
  }

  useEffect(() => {
    console.log('Game screen mounted')

    // set up game listeners
    if (game) {
      game.onStateChange(handleGameStateChange)
      game.onTick(handleGameTimerTick)
    }

    return () => {
      if (game) {
        game.offStateChange(handleGameStateChange)
        game.offTick(handleGameTimerTick)
        game.stop()
      }
    }
  }, [game])

  return (
    <>
      <GameProvider game={game}>
        <div className='grid-container'>
          <Canvas />
        </div>
      </GameProvider>
    </>
  )
}

export default GameScreen
