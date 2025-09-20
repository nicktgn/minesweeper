import { useState, useEffect } from 'react'
import './App.css'
import GameController from './controller'
import { GameProvider } from './context/GameContext'
import Canvas from './components/Canvas'
import { GameEvent } from './model'


function App() {
  // Initialize game controller
  const gameController = new GameController({
    grid: {
      width: 9,
      height: 9,
      mineRatio: 0.05
    }
  })

  // Initialize the grid with a starting position
  useEffect(() => {
    console.log('App component mounted')
    gameController.grid.init({ x: 0, y: 0 })

    // // test
    // const grid = gameController.grid
    // for (let i = 0; i < grid.height; i++) {
    //   for (let j = 0; j < grid.width; j++) {
    //     grid.getCell({ x: j, y: i }).isOpened = true
    //   }
    // }

    // gameController.on(GameEvent.GAME_STATE_CHANGE, (state) => {
    //   console.log('Game state changed:', state)
    // })

    console.log('Grid initialized')
  }, [])

  return (
    <>
      <GameProvider game={gameController}>
        <h1>Minesweeper. rrrrr</h1>
        <div className='grid-container'>
          <Canvas />
        </div>
      </GameProvider>
    </>
  )
}

export default App
