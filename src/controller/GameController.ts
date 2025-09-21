import type { FailState, GameConfig, ICell, IGame, Vector2 } from '../model'
import { GameState } from '../model'
import Grid from './Grid'

export class GameController implements IGame {
    private _gameState: GameState = GameState.NOT_STARTED
    private _grid: Grid

    private _stateListeners: Set<(state: GameState) => void> = new Set()
    private _tickListeners: Set<(time: number) => void> = new Set()

    // in seconds
    private _time: number = 0
    private _timer: number | null = null

    constructor(gameConfig: GameConfig) {
        this._grid = new Grid(gameConfig.grid)
    }

    get gameState() {
        return this._gameState
    }
    get grid() {
        return this._grid
    }
    get time() {
        return this._time
    }
    get isGameEnd() {
        return this._gameState === GameState.LOST
            || this._gameState === GameState.WON
    }

    get width() {
        return this._grid.width
    }
    get height() {
        return this._grid.height
    }
    get cellCount() {
        return this._grid.cellCount
    }
    get mineCount() {
        return this._grid.mineCount
    }
    get mineRatio() {
        return this._grid.mineRatio
    }
    get flagCount() {
        return this._grid.flagCount
    }
    get openedCellCount() {
        return this._grid.openedCellCount
    }

    init(startPos: Vector2) {
        if (this._gameState !== GameState.NOT_STARTED) {
            console.warn('Game already started')
            return
        }

        this._grid.init(startPos)
        this.startTimer()
        this.changeGameState(GameState.IN_PROGRESS)
        this._grid.onCellsChange(this.handleCellChange)
    }

    reset() {
        this.stopTimer()
        this._grid.offCellsChange(this.handleCellChange)
        this._grid.reset()
        this.changeGameState(GameState.NOT_STARTED)
    }

    getCell(pos: Vector2): ICell {
        return this._grid.getCell(pos)
    }

    openCell(pos: Vector2): boolean {
        if (this._gameState === GameState.NOT_STARTED) {
            this.init(pos)
        }
        return this._grid.openCell(pos)
    }

    flagCell(pos: Vector2): boolean {
        if (this._gameState === GameState.NOT_STARTED) {
            this.init(pos)
        }
        return this._grid.flagCell(pos)
    }

    revealAdjacentCells(pos: Vector2): boolean {
        if (this._gameState === GameState.NOT_STARTED) {
            this.init(pos)
        }
        return this._grid.revealAdjacentCells(pos)
    }

    pressPreview(pos: Vector2): Vector2[] {
        return this._grid.pressPreview(pos)
    }

    checkAllMinesFlagged() {
        return this._grid.checkAllMinesFlagged()
    }

    onStateChange(cb: (state: GameState) => void) {
        this._stateListeners.add(cb)
    }
    onTick(cb: (time: number) => void) {
        this._tickListeners.add(cb)
    }
    onProgress(cb: (flagCount: number) => void) {
        this._grid.onProgress(cb)
    }
    onCellsChange(cb: (updatedCells: Set<ICell>) => void) {
        this._grid.onCellsChange(cb)
    }
    onFailedState(cb: (failState: FailState) => void) {
        this._grid.onFailedState(cb)
    }
    offStateChange(cb: (state: GameState) => void) {
        this._stateListeners.delete(cb)
    }
    offTick(cb: (time: number) => void) {
        this._tickListeners.delete(cb)
    }
    offCellsChange(cb: (updatedCells: Set<ICell>) => void) {
        this._grid.offCellsChange(cb)
    }
    offProgress(cb: (flagCount: number) => void) {
        this._grid.offProgress(cb)
    }
    offFailedState(cb: (failState: FailState) => void) {
        this._grid.offFailedState(cb)
    }

    // ---------------------------- private ------------------------ //

    private emitStateChange(state: GameState) {
        for (const cb of this._stateListeners) {
            cb(state)
        }
    }

    private emitTick(time: number) {
        for (const cb of this._tickListeners) {
            cb(time)
        }
    }

    // this is handle of win and fail state
    private handleCellChange = (updatedCells: Set<ICell>) => {
        // check for fail condition
        for (const cell of updatedCells) {
            if (cell.hasMine && cell.isOpened) {
                this.changeGameState(GameState.LOST)
                this.stopTimer()
                return
            }
        }
        // check win condition
        if (this.checkWinCondition()) {
            this.changeGameState(GameState.WON)
            this.stopTimer()
        }
    }

    private checkWinCondition() {
        const { cellCount, mineCount, openedCellCount } = this._grid
        return cellCount - mineCount === openedCellCount &&
            this._grid.checkAllMinesFlagged()
    }

    private changeGameState(state: GameState) {
        this._gameState = state
        this.emitStateChange(state)
    }

    private startTimer() {
        this._timer = setInterval(() => {
            this._time++
            this.emitTick(this._time)
        }, 1000)
    }

    private stopTimer() {
        if (this._timer) {
            clearInterval(this._timer)
            this._timer = null
        }
    }
}
