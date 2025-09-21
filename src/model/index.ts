export * from './config'

export enum GameState {
    NOT_STARTED,
    IN_PROGRESS,
    WON,
    LOST,
}

export type Vector2 = {
    x: number
    y: number
}

export type FailState = {
    triggeredMine: ICell
    mineCells: ICell[]
    wrongFlagCells: ICell[]
}

export interface ICell {
    hasMine: boolean
    isOpened: boolean
    isFlagged: boolean
    adjacentMines: number
    pos: Vector2

    is(cell: ICell): boolean
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
    reset(): void
    getCell(pos: Vector2): ICell
    openCell(pos: Vector2): boolean
    flagCell(pos: Vector2): boolean
    revealAdjacentCells(pos: Vector2): boolean
    /**
     * returns the list of cells that would be opened if pressed
     * both when opening closed cells and when chording cells around
     */
    pressPreview(pos: Vector2): Vector2[]
    checkAllMinesFlagged(): boolean

    onCellsChange(cb: (updatedCells: Set<ICell>) => void): void
    onProgress(cb: (flagCount: number) => void): void
    onFailedState(cb: (failState: FailState) => void): void
    offCellsChange(cb: (updatedCells: Set<ICell>) => void): void
    offProgress(cb: (flagCount: number) => void): void
    offFailedState(cb: (failState: FailState) => void): void
}

export interface IGame extends IGrid {
    grid: IGrid
    gameState: GameState
    time: number
    isGameEnd: boolean

    init(startPos: Vector2): void
    reset(): void

    onStateChange(cb: (state: GameState) => void): void
    onTick(cb: (time: number) => void): void
    offStateChange(cb: (state: GameState) => void): void
    offTick(cb: (time: number) => void): void
}
