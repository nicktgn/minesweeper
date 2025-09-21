import type { ICell, IGrid, Vector2, GridConfig, FailState } from '../model'

class Grid implements IGrid {
    private _width: number
    private _height: number
    // ratio of mines to cells
    private _mineRatio: number

    private _cells: ICell[][]
    // used when revealing all mines on FAIL
    private _mineCells = new Set<ICell>()
    private _flagCells = new Set<ICell>()
    private _cellCount: number
    private _mineCount: number
    private _flagCount: number = 0
    private _openedCellCount: number = 0

    private _cellStateListeners: Set<(updatedCells: Set<ICell>) => void> = new Set()
    private _failedStateListeners: Set<(failState: FailState) => void> = new Set()
    private _progressListeners: Set<(flagCount: number) => void> = new Set()

    constructor(gridConfig: GridConfig) {
        this._width = gridConfig.width
        this._height = gridConfig.height
        this._mineRatio = gridConfig.mineRatio
        this._cellCount = this._width * this._height
        this._mineCount = Math.floor(this._cellCount * this._mineRatio)

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
        return this._cellCount
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

    reset() {
        for (let y = 0; y < this._height; y++) {
            for (let x = 0; x < this._width; x++) {
                // no need to recreate cells, just reset their state
                this.resetCell(this._cells[y][x])
            }
        }
        this._mineCells.clear()
        this._flagCells.clear()
        this._flagCount = 0
        this._openedCellCount = 0
        // TODO: should we clear listeners here?
    }

    onCellsChange(cb: (updatedCells: Set<ICell>) => void) {
        this._cellStateListeners.add(cb)
    }
    onProgress(cb: (flagCount: number) => void) {
        this._progressListeners.add(cb)
    }
    onFailedState(cb: (failState: FailState) => void) {
        this._failedStateListeners.add(cb)
    }
    offCellsChange(cb: (updatedCells: Set<ICell>) => void) {
        this._cellStateListeners.delete(cb)
    }
    offProgress(cb: (flagCount: number) => void) {
        this._progressListeners.delete(cb)
    }
    offFailedState(cb: (failState: FailState) => void) {
        this._failedStateListeners.delete(cb)
    }

    getCell(pos: Vector2) {
        this.checkCellPosition(pos)
        return this._cells[pos.y][pos.x]
    }

    /**
     * @returns true if opened any cells, false if not; last mine ICell if opened any mines
     */
    openCell(pos: Vector2): boolean {
        const cell = this.getCell(pos)

        // prevent directly opening flagged cells - need to unflag first
        if (cell.isFlagged) {
            return false
        }

        if (cell.isOpened) {
            if (cell.adjacentMines > 0) {
                // redirect to do chording instead - convenience (no need to dbl-click every time)
                return this.revealAdjacentCells(pos)
            }
            // otherwise just return if oppened and empty
            return false
        }

        const updatedCells = new Set<ICell>()
        const lastMine = this.openCellsByRef([cell], updatedCells)
        if (updatedCells.size) {
            this.emitCellChange(updatedCells)
            if (lastMine) {
                this.emitFailedState(lastMine)
            }
            return true
        }
        return false
    }

    flagCell(pos: Vector2): boolean {
        const cell = this.getCell(pos)

        this.toggleCellFlag(cell)

        this.emitCellChange(new Set([cell]))
        return true
    }

    /**
     * chording - https://minesweeper.fandom.com/wiki/Chording
     * @returns true if opened any cells, false if not; last mine ICell if opened any mines
     */
    revealAdjacentCells(pos: Vector2): boolean {
        const cell = this.getCell(pos)

        // if not open, just redirect to open cell call, no chording
        if (!cell.isOpened) {
            return this.openCell(pos)
        }

        // if number on cell doesn't match number of flags around, no chording
        if (cell.adjacentMines == 0
            || cell.adjacentMines !== this.countAdjacentFlags(pos.x, pos.y)) {
            return false
        }

        const updatedCells = new Set<ICell>()

        // adjacent UNOPENED and UNFLAGGED cells
        const adjacentCells = Array.from(
            this.adjacentCells(pos.x, pos.y,
                (cell) => !cell.isOpened && !cell.isFlagged))

        if (adjacentCells.length === 0) {
            return false
        }

        // do chording
        const lastMine = this.openCellsByRef(adjacentCells, updatedCells)
        if (updatedCells.size) {
            this.emitCellChange(updatedCells)
            if (lastMine) {
                this.emitFailedState(lastMine)
            }
            return true
        }
        return false
    }

    pressPreview(pos: Vector2): Vector2[] {
        const cell = this.getCell(pos)
        // for closed cells - preview press for that cell
        if (!cell.isOpened) {
            return [pos]
        }
        // for opened cells with adjacent mines - preview press for adjacent cells
        if (cell.adjacentMines > 0) {
            return Array.from(this.adjacentCells(pos.x, pos.y,
                (cell) => !cell.isOpened && !cell.isFlagged),
                (cell) => cell.pos)
        }
        return []
    }

    checkAllMinesFlagged() {
        return this._mineCells.size === this._flagCells.size
            && Array.from(this._mineCells).every((cell) => cell.isFlagged)
    }

    // ---------------------------- private ------------------------ //

    private emitCellChange(updatedCells: Set<ICell>) {
        for (const cb of this._cellStateListeners) {
            cb(updatedCells)
        }
    }

    private emitProgress() {
        for (const cb of this._progressListeners) {
            cb(this._flagCount)
        }
    }

    private emitFailedState(triggeredMine : ICell) {
        for (const cb of this._failedStateListeners) {
            cb({
                triggeredMine,
                mineCells: Array.from(this._mineCells),
                wrongFlagCells: Array.from(this._flagCells)
                    .filter((cell) => !cell.hasMine),
            })
        }
    }

    private resetCell(cell: ICell) {
        cell.hasMine = false
        cell.isOpened = false
        cell.isFlagged = false
        cell.adjacentMines = 0
    }

    private toggleCellFlag(cell: ICell, unflagOnly: boolean = false) {
        if (cell.isFlagged) {
            cell.isFlagged = false
            this._flagCount--
            this._flagCells.delete(cell)
            this.emitProgress()
        } else if (!unflagOnly) {
            cell.isFlagged = true
            this._flagCount++
            this._flagCells.add(cell)
            this.emitProgress()
        }
    }

    // returns last opened mine cell if any
    private openCellsByRef(
        cellStack: ICell[],
        updatedCells: Set<ICell>,
    ): ICell | null {
        let lastMineCell: ICell | null = null
        while(cellStack.length) {
            const cell = cellStack.pop() as ICell

            const opened = this.openSingleCellByRef(cell)
            if (!opened) {
                continue
            }
            this._openedCellCount++
            updatedCells.add(cell)

            // this is a condition for GAME OVER
            if (cell.hasMine) {
                lastMineCell = cell
            }
            // if cell has no mine and no adjacent mines, reveal adjacent cells
            else if (cell.adjacentMines === 0) {
                for (const adjacentCell of this.adjacentCells(cell.pos.x, cell.pos.y)) {
                    cellStack.push(adjacentCell)
                }
            }
        }
        return lastMineCell
    }

    /**
     * @returns true if cell was opened
     */
    private openSingleCellByRef(cell: ICell): boolean {
        // don't open it is already opened or if correctly flagged
        if (cell.isOpened || (cell.hasMine && cell.isFlagged)) {
            return false
        }

        // in all other cases open it
        cell.isOpened = true
        // unflag incorreclty flagged cell
        this.toggleCellFlag(cell, true)
        return true
    }

    private checkCellPosition(pos: Vector2) {
        const { x, y } = pos
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
            throw new Error('Invalid cell coordinates')
        }
    }

    private placeMines(startPos: Vector2) {
        let minesPlaced = 0
        while (minesPlaced < this._mineCount) {
            const x = Math.floor(Math.random() * this._width)
            const y = Math.floor(Math.random() * this._height)
            if (x === startPos.x && y === startPos.y) {
                continue
            }
            const cell = this._cells[y][x]
            if (cell.hasMine) {
                continue
            }
            cell.hasMine = true
            this._mineCells.add(cell)
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

    private countAdjacentFlags(x: number, y: number) {
        let count = 0
        for (const cell of this.adjacentCells(x, y)) {
            if (cell.isFlagged) {
                count++
            }
        }
        return count
    }

    private *adjacentCells(
        x: number, y: number,
        filter?: (cell: ICell) => boolean
    ): Generator<ICell> {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) {
                    continue
                }
                const cell = this._cells[y + i]?.[x + j]
                if (!cell) {
                    continue
                }
                if (filter && !filter(cell)) {
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

    is(cell: ICell) {
        return this.pos.x === cell.pos.x
            && this.pos.y === cell.pos.y
    }
}

export default Grid
