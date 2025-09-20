export * from './config'

export enum GameState {
    NOT_STARTED,
    IN_PROGRESS,
    WON,
    LOST,
}

export enum GameEvent {
    GAME_STATE_CHANGE,
    GAME_TIMER_TICK,
    CELL_STATE_CHANGE
}

export type Vector2 = {
    x: number
    y: number
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
    onCellsChange(cb: (updatedCells: Set<ICell>) => void): void
    offCellsChange(cb: (updatedCells: Set<ICell>) => void): void
}

export interface IGame extends IGrid {
    grid: IGrid
    gameState: GameState
    time: number
    init(startPos: Vector2): void
    stop(): void

    onStateChange(cb: (state: GameState) => void): void
    onTick(cb: (time: number) => void): void
    offStateChange(cb: (state: GameState) => void): void
    offTick(cb: (time: number) => void): void
}
