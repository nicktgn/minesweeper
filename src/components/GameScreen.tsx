
import { useSetAtom } from 'jotai'
import { GameProvider } from '../context/GameContext'
import Canvas from '../components/Canvas'
import GameUI from '../components/GameUI'
import { screenAtom } from '../atoms/globalAtom'

function BackButton() {
  const setScreen = useSetAtom(screenAtom)

  const handleBackToMenu = () => {
    setScreen('main')
  }

  return (
    <div className="mt-4 flex justify-center">
      <button
        onClick={handleBackToMenu}
        className={`inline-flex items-center gap-2 rounded
          bg-gray-300 px-5 py-3 font-bold text-black ring-2 ring-[#2f3942]
          shadow-[inset_0_2px_0_0_rgba(255,255,255,0.6),inset_0_-3px_0_0_rgba(0,0,0,0.4)]
          transition active:translate-y-[1px]`
        }
      >
        <span className="text-xl">👈</span>
        Back to Main Menu
      </button>
    </div>
  )
}

const GameScreen = () => {
  const debugCanvas = import.meta.env.VITE_DEBUG_GRID === 'true'

  return (
    <>
      <GameProvider>
        <div className='flex max-w-[742px] flex-col justify-center items-center'>
          <div className="flex flex-col w-full justify-center">
            <GameUI />
            <Canvas />
            {debugCanvas && <Canvas forceOpenAllCells nonInteractive />}

            {/* back to main menu button */}
            <BackButton />
          </div>
        </div>
      </GameProvider>
    </>
  )
}

export default GameScreen
