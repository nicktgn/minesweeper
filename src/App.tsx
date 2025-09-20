import './App.css'
import { useAtomValue } from 'jotai'
import { screenAtom } from './atoms/globalAtom'
import GameScreen from './components/GameScreen'
import MainScreen from './components/MainScreen'

function App() {
  const screen = useAtomValue(screenAtom)

  return (
    <>
      <h1>Minesweeper</h1>
      {screen === 'main' && <MainScreen />}
      {screen === 'game' && <GameScreen />}
    </>
  )
}

export default App
