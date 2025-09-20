import { useState } from 'react'
import { DifficultyLevel, DifficultyMap, type GameConfig } from '../model'
import './css/MainScreen.css'
import { useSetAtom } from 'jotai'
import { difficultyLevelAtom, screenAtom } from '../atoms/globalAtom'


export default function MainMenu() {
  const [selectedDifficulty, setSelectedDifficulty] = useState(DifficultyLevel.BEGINNER)
  const setDifficulty = useSetAtom(difficultyLevelAtom)
  const setScreen = useSetAtom(screenAtom)

  const handleStartGame = () => {
    setDifficulty(selectedDifficulty)
    setScreen('game')
  }

  return (
    <div className="main-menu">
      <div className="difficulty-selection">
        <h2>Select Difficulty</h2>
        {Object.values(DifficultyMap).map((level, index) => (
          <button
            key={level.name}
            className={`difficulty-btn ${selectedDifficulty === index ? 'selected' : ''}`}
            onClick={() => setSelectedDifficulty(index)}
          >
            {level.name}
            <span className="difficulty-info">
              {level.config.grid.width}×{level.config.grid.height},
              {Math.round(level.config.grid.width * level.config.grid.height * level.config.grid.mineRatio)} mines
            </span>
          </button>
        ))}
      </div>

      <button className="start-btn" onClick={handleStartGame}>
        Start Game
      </button>
    </div>
  )
}
