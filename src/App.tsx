import { useAtomValue } from 'jotai'
import { screenAtom } from './atoms/globalAtom'
import GameScreen from './components/GameScreen'
import MainScreen from './components/MainScreen'

function App() {
  const screen = useAtomValue(screenAtom)

  return (
    <main className="container h-screen mx-auto justify-center items-center">
      <div className="flex flex-col h-full justify-center items-center">
        <h1 className="mb-8 text-5xl text-center font-bold">
          Minesweeper
        </h1>
        {screen === 'main' && <MainScreen />}
        {screen === 'game' && <GameScreen />}
      </div>
    </main>
  )
}

export default App
