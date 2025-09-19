
export enum GameState {
    NOT_STARTED,
    IN_PROGRESS,
    WON,
    LOST,
}

export enum GameEvent {
    GAME_STATE_CHANGE,
}

export enum GridEvent {
    CELL_STATE_CHANGE,
}

export type Vector2 = {
    x: number
    y: number
}

export type GameConfig = {
    grid: GridConfig
}

export type GridConfig = {
    width: number
    height: number
    mineRatio: number
}

export interface ICell {
    hasMine: boolean
    isOpened: boolean
    isFlagged: boolean
    adjacentMines: number
    pos: Vector2
}

export interface IGrid {
    width: number
    height: number
    cellCount: number
    mineCount: number
    mineRatio: number
    flagCount: number
    openedCellCount: number
    init(startPos: Vector2): void
    getCell(pos: Vector2): ICell
    openCell(pos: Vector2): void
    flagCell(pos: Vector2): void
    revealAdjacentCells(pos: Vector2): void
    on(event: GridEvent, cb: (updatedCells: Set<ICell>) => void): void
    off(event: GridEvent, cb: (updatedCells: Set<ICell>) => void): void
}


export interface IGame {
    grid: IGrid
    gameState: GameState
    on(event: GameEvent, cb: (state: GameState) => void): void
    off(event: GameEvent, cb: (state: GameState) => void): void
}