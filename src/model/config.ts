export enum DifficultyLevel {
  BEGINNER,
  INTERMEDIATE,
  EXPERT,
}

export type DifficultyLevelConfig = {
  name: string
  config: GameConfig
}

export type GameConfig = {
    grid: GridConfig
}

export type GridConfig = {
    width: number
    height: number
    mineRatio: number
}

export const DifficultyMap: Record<DifficultyLevel, DifficultyLevelConfig> = {
  [DifficultyLevel.BEGINNER]: {
    name: 'Beginner',
    config: {
      grid: { width: 9, height: 9, mineRatio: 0.12 }
    }
  },
  [DifficultyLevel.INTERMEDIATE]: {
    name: 'Intermediate', 
    config: {
      grid: { width: 16, height: 16, mineRatio: 0.16 }
    }
  },
  [DifficultyLevel.EXPERT]: {
    name: 'Expert',
    config: {
      grid: { width: 30, height: 16, mineRatio: 0.21 }
    }
  }
}