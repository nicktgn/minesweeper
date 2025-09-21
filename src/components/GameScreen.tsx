
import { GameProvider } from '../context/GameContext'
import Canvas from '../components/Canvas'
import GameUI from '../components/GameUI'

const GameScreen = () => {
  const debugCanvas = import.meta.env.VITE_DEBUG_GRID === 'true'

  return (
    <>
      <GameProvider>
        <div className='flex max-w-[520px] flex-col justify-center items-center'>
          <div className="flex flex-col w-full justify-center">
            <GameUI />
            <Canvas />
            {debugCanvas && <Canvas forceOpenAllCells nonInteractive />}
          </div>
        </div>
      </GameProvider>
    </>
  )
}

export default GameScreen
