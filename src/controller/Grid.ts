import type { ICell, IGrid, Vector2, GridConfig } from '../model'
import { GridEvent } from '../model'

class Grid implements IGrid {
    private _width: number
    private _height: number
    // ratio of mines to cells
    private _mineRatio: number 
    
    private _cells: ICell[][]
    private _numCells: number
    private _mineCount: number = 0
    private _flagCount: number = 0
    private _openedCellCount: number = 0

    private _listeners: Record<GridEvent, Set<(updatedCells: Set<ICell>) => void>> = {
        [GridEvent.CELL_STATE_CHANGE]: new Set(),
    }
    
    constructor(gridConfig: GridConfig) {
        this._width = gridConfig.width
        this._height = gridConfig.height
        this._mineRatio = gridConfig.mineRatio
        this._numCells = this._width * this._height

        // generate cells
        this._cells = Array.from({ length: this._height }, (_, y) =>
            Array.from({ length: this._width }, (_, x) => new Cell({ x, y }))
        )
    }

    get width() {
        return this._width
    }
    get height() {
        return this._height
    }
    get cellCount() {
        return this._numCells
    }
    get mineCount() {
        return this._mineCount
    }
    get mineRatio() {
        return this._mineRatio
    }
    get flagCount() {
        return this._flagCount
    }
    get openedCellCount() {
        return this._openedCellCount
    }

    init(startPos: Vector2) {
        this.checkCellPosition(startPos)
        
        this.placeMines(startPos)
        this.setAdjacentMineCounts()
    }

    on(event: GridEvent, cb: (updatedCells: Set<ICell>) => void) {
        this._listeners[event].add(cb)
    }

    off(event: GridEvent, cb: (updatedCells: Set<ICell>) => void) {
        this._listeners[event].delete(cb)
    }

    getCell(pos: Vector2) {
        this.checkCellPosition(pos)
        return this._cells[pos.y][pos.x]
    }

    openCell(pos: Vector2) {
        this.checkCellPosition(pos)

        // core logic is in this method
        const updatedCells = new Set<ICell>()
        this.openCellByRef(this.getCell(pos), updatedCells)

        if (updatedCells.size) {
            this.emit(GridEvent.CELL_STATE_CHANGE, updatedCells)
        }
    }

    flagCell(pos: Vector2) {
        this.checkCellPosition(pos)
        const cell = this.getCell(pos)
        if (cell.isFlagged) {
            return
        }

        cell.isFlagged = true
        this._flagCount++

        this.emit(GridEvent.CELL_STATE_CHANGE, new Set([cell]))
    }

    // to be called externally when doing chording - https://minesweeper.fandom.com/wiki/Chording
    revealAdjacentCells(pos: Vector2) {
        this.checkCellPosition(pos)
        const updatedCells = new Set<ICell>()
        this.revealAdjacentCellsIntl(pos, updatedCells)
    }

    // ---------------------------- private ------------------------ //

    private emit(event: GridEvent, updatedCells: Set<ICell>) {
        for (const cb of this._listeners[event]) {
            cb(updatedCells)
        }
    }

    private openCellByRef(cell: ICell, updatedCells: Set<ICell>) {
        // don't open it if correctly flagged
        if (cell.hasMine && cell.isFlagged) {
            return
        }

        // in all other cases add to updated cells and we open it
        updatedCells.add(cell)
        this._openedCellCount++
        cell.isOpened = true

        // this is GAME OVER
        if (cell.hasMine) {
            return
        }

        // if cell has no adjacent mines, reveal adjacent cells
        if (cell.adjacentMines === 0) {
            this.revealAdjacentCellsIntl(cell.pos, updatedCells)
        }
    }

    /**
     * Will add all updated cells to the provided set (if provided)
     */
    private revealAdjacentCellsIntl(pos: Vector2, updatedCells: Set<ICell>) {
        for (const cell of this.adjacentCells(pos.x, pos.y)) {
            this.openCellByRef(cell, updatedCells)
        }
    }

    private checkCellPosition(pos: Vector2) {
        const { x, y } = pos
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
            throw new Error('Invalid cell coordinates')
        }
    }

    private placeMines(startPos: Vector2) {
        this._mineCount = Math.floor(this._numCells * this._mineRatio)
        let minesPlaced = 0
        while (minesPlaced < this._mineCount) {
            const x = Math.floor(Math.random() * this._width)
            const y = Math.floor(Math.random() * this._height)
            if (x === startPos.x && y === startPos.y) {
                continue
            }
            if (this._cells[y][x].hasMine) {
                continue
            }
            this._cells[y][x].hasMine = true
            minesPlaced++
        }
    }

    private setAdjacentMineCounts() {
        // TODO: consider if this can be optimized for faster starts
        for (let y = 0; y < this._height; y++) {
            for (let x = 0; x < this._width; x++) {
                this._cells[y][x].adjacentMines = this.countAdjacentMines(x, y)
            }
        }
    }

    private countAdjacentMines(x: number, y: number) {
        let count = 0
        for (const cell of this.adjacentCells(x, y)) {
            if (cell.hasMine) {
                count++
            }
        }
        return count
    }

    private *adjacentCells(x: number, y: number): Generator<ICell> {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) {
                    continue
                }
                const cell = this._cells[y + i]?.[x + j]
                if (!cell) {
                    continue
                }
                yield cell
            }
        }
    }

} 

class Cell implements ICell {
    hasMine: boolean
    isOpened: boolean
    isFlagged: boolean
    adjacentMines: number
    pos: Vector2

    constructor(pos: Vector2) {
        this.hasMine = false
        this.isOpened = false
        this.isFlagged = false
        this.adjacentMines = 0
        this.pos = pos
    }
}

export default Grid
