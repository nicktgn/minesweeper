import type { GameConfig, ICell, IGame } from '../model'
import { GameState, GridEvent, GameEvent } from '../model'
import Grid from './Grid'

class GameController implements IGame {
    private _gameState: GameState = GameState.NOT_STARTED
    private _grid: Grid
    private _listeners: Record<GameEvent, Set<(state: GameState) => void>> = {
        [GameEvent.GAME_STATE_CHANGE]: new Set(),
    }

    constructor(gameConfig: GameConfig) {
        this._grid = new Grid(gameConfig.grid)

        this.addGridListeners()
    }

    get gameState() {
        return this._gameState
    }
    get grid() {
        return this._grid
    }

    on(event: GameEvent, cb: (state: GameState) => void): void {
        this._listeners[event].add(cb)
    }

    off(event: GameEvent, cb: (state: GameState) => void): void {
        this._listeners[event].delete(cb)
    }

    // ---------------------------- private ------------------------ //

    private emit(event: GameEvent, state: GameState) {
        for (const cb of this._listeners[event]) {
            cb(state)
        }
    }

    private addGridListeners() {
        this._grid.on(GridEvent.CELL_STATE_CHANGE, (updatedCells: Set<ICell>) => {
            this.updateGameState(updatedCells)
        })
    }

    private updateGameState(updatedCells: Set<ICell>) {
        for (const cell of updatedCells) {
            if (cell.hasMine && cell.isOpened) {
                this.changeGameState(GameState.LOST)
                return
            }

            // TODO: come back to this
            if (this._grid.cellCount - this._grid.mineCount === this._grid.openedCellCount) {
                this.changeGameState(GameState.WON)
                return
            }
        }
    }

    private changeGameState(state: GameState) {
        this._gameState = state
        this.emit(GameEvent.GAME_STATE_CHANGE, state)
    }
}

export default GameController