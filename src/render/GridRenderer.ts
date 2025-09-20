import {
    Application,
    Container,
    Graphics,
    Text,
    TextStyle,
    FederatedEvent
} from 'pixi.js'
import type { IGame, ICell } from '../model'
import { GameInputEvent, GameInputEventEmitter } from './InputEventEmitter'


class CellRenderer {
    x: number
    y: number
    containter: Container
    graphic: Graphics
    text: Text
    eventEmitter: GameInputEventEmitter

    constructor(x: number, y: number, size: number) {
        this.x = x
        this.y = y

        this.containter = new Container()
        this.containter.eventMode = 'static'

        this.eventEmitter = new GameInputEventEmitter(this.containter)

        this.graphic = new Graphics()
        this.text = new Text({
            text: '',
            style: new TextStyle({
                fontSize: 14,
                fontWeight: 'bold',
                fontFamily: 'monospace'
            })
        })

        this.graphic.x = x * size
        this.graphic.y = y * size

        this.containter.addChild(this.graphic)
        this.containter.addChild(this.text)
    }

    on(event: GameInputEvent, cb: (event: FederatedEvent) => void) {
        this.eventEmitter.on(event, cb)
    }

    off(event: GameInputEvent, cb: (event: FederatedEvent) => void) {
        this.eventEmitter.off(event, cb)
    }
}

export class GridRenderer {
    private app: Application | null = null
    private gridContainer: Container | null = null
    private cellRenderers: CellRenderer[][] = []
    private game: IGame
    private isInitialized = false

    private readonly CELL_SIZE = 24
    private readonly BORDER_WIDTH = 2

    // Colors matching classic minesweeper
    private readonly COLORS = {
        BACKGROUND: 0xC0C0C0,
        CLOSED_CELL: 0xC0C0C0,
        OPEN_CELL: 0xBDBDBD,
        BORDER_LIGHT: 0xFFFFFF,
        BORDER_DARK: 0x808080,
        NUMBERS: [
            0x0000FF, // 1 - blue
            0x008000, // 2 - green
            0xFF0000, // 3 - red
            0x800080, // 4 - dark purple
            0x800000, // 5 - maroon
            0x008080, // 6 - cyan
            0x800080, // 7 - purple
            0x808080, // 8 - gray
        ]
    }

    private constructor(game: IGame) {
        this.game = game
    }

    private async initialize() {
        try {
            this.app = new Application()

            await this.app.init({
                width: this.game.width * this.CELL_SIZE,
                height: this.game.height * this.CELL_SIZE,
                backgroundColor: this.COLORS.BACKGROUND,
                preference: 'webgl'
            })

            // Prevent browser context menu on canvas
            this.app.canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault()
            })

            this.gridContainer = new Container()
            this.app.stage.addChild(this.gridContainer)

            this.initGrid()
            this.setupGridEventListeners()
            this.isInitialized = true

        } catch (error) {
            console.error('Failed to initialize GridRenderer:', error)
            throw error
        }
    }

    static async create(game: IGame): Promise<GridRenderer> {
        const renderer = new GridRenderer(game)
        await renderer.initialize()
        return renderer
    }

    get canvas() {
        if (!this.isInitialized) {
            return null
        }
        return this.app?.canvas
    }

    public destroy() {
        if (!this.isInitialized) {
            return
        }
        console.log('Destroying GridRenderer...')
        console.trace()
        this.isInitialized = false

        this.game.offCellsChange(this.handleCellStateChange)

        if (this.app) {
            try {
                this.app.destroy(true, { children: true, texture: true })
            } catch (error) {
                console.warn('Error during GridRenderer cleanup:', error)
            }
            this.app = null
        }
        this.gridContainer = null
        this.cellRenderers = []
    }

    private initGrid() {
        if (!this.gridContainer) {
            return
        }
        for (let y = 0; y < this.game.height; y++) {
            this.cellRenderers[y] = []

            for (let x = 0; x < this.game.width; x++) {
                const cellRenderer = new CellRenderer(x, y, this.CELL_SIZE)

                this.setupInputEventListeners(cellRenderer)

                // add to main container
                this.gridContainer.addChild(cellRenderer.containter)

                // add to renderer array
                this.cellRenderers[y][x] = cellRenderer

                const cell = this.game.getCell({ x, y })
                this.renderCell(cell)
            }
        }
    }

    private renderCell(cell : ICell) {
        const { x, y } = cell.pos
        const { text, graphic } = this.cellRenderers[y][x]

        graphic.clear()

        if (cell.isOpened) {
            this.drawOpenCell(graphic, cell)
            this.updateCellText(text, cell)
        } else {
            this.drawClosedCell(graphic)
            text.text = cell.isFlagged ? '🚩' : ''
        }

        // Position text in center of cell
        text.x = x * this.CELL_SIZE + this.CELL_SIZE / 2 - text.width / 2
        text.y = y * this.CELL_SIZE + this.CELL_SIZE / 2 - text.height / 2
    }

    private drawClosedCell(graphic: Graphics) {
        // Main cell background
        graphic.rect(0, 0, this.CELL_SIZE, this.CELL_SIZE)
        graphic.fill(this.COLORS.CLOSED_CELL)

        // 3D raised border effect
        // Top and left light borders
        graphic.rect(0, 0, this.CELL_SIZE, this.BORDER_WIDTH)
        graphic.fill(this.COLORS.BORDER_LIGHT)
        graphic.rect(0, 0, this.BORDER_WIDTH, this.CELL_SIZE)
        graphic.fill(this.COLORS.BORDER_LIGHT)

        // Bottom and right dark borders
        graphic.rect(0, this.CELL_SIZE - this.BORDER_WIDTH, this.CELL_SIZE, this.BORDER_WIDTH)
        graphic.fill(this.COLORS.BORDER_DARK)
        graphic.rect(this.CELL_SIZE - this.BORDER_WIDTH, 0, this.BORDER_WIDTH, this.CELL_SIZE)
        graphic.fill(this.COLORS.BORDER_DARK)
    }

    private drawOpenCell(graphic: Graphics, cell: ICell) {
        // Main cell background (sunken appearance)
        graphic.rect(0, 0, this.CELL_SIZE, this.CELL_SIZE)
        graphic.fill(this.COLORS.OPEN_CELL)

        // Thin dark border for sunken effect
        graphic.rect(0, 0, this.CELL_SIZE, 1)
        graphic.fill(this.COLORS.BORDER_DARK)
        graphic.rect(0, 0, 1, this.CELL_SIZE)
        graphic.fill(this.COLORS.BORDER_DARK)

        // Mine background (red if mine hit)
        if (cell.hasMine) {
            graphic.rect(2, 2, this.CELL_SIZE - 4, this.CELL_SIZE - 4)
            graphic.fill(0xFF0000)
        }
    }

    private updateCellText(text: Text, cell: ICell) {
        if (cell.hasMine) {
            text.text = '💣'
            text.style.fill = 0x000000
        } else if (cell.adjacentMines > 0) {
            text.text = cell.adjacentMines.toString()
            text.style.fill = this.COLORS.NUMBERS[cell.adjacentMines - 1] || 0x000000
        } else {
            text.text = ''
        }
    }

    private handleCellStateChange = (updatedCells: Set<ICell>) => {
        console.log("grid cell state change listener: ", this)
        if (!this.isInitialized) return
        for (const cell of updatedCells) {
            this.renderCell(cell)
        }
    }

    private setupGridEventListeners() {
        this.game.onCellsChange(this.handleCellStateChange)
    }

    private setupInputEventListeners(cellRenderer: CellRenderer) {
        // TODO: move the logic of what events to call ideally to a separate
        // place outside of GridRenderer

        const { x, y } = cellRenderer
        cellRenderer.on(GameInputEvent.OPEN, () => {
            console.log("Open cell at: ", x, y)
            this.game.openCell({ x, y })
            console.log("Opened cell count: ", this.game.openedCellCount)
        })

        cellRenderer.on(GameInputEvent.REVEAL, () => {
            console.log("Reveal cells around: ", x, y)
            this.game.revealAdjacentCells({ x, y })
            console.log("Opened cell count: ", this.game.openedCellCount)
        })

        cellRenderer.on(GameInputEvent.FLAG, () => {
            console.log("Flag cell at: ", x, y)
            this.game.flagCell({ x, y })
            console.log("Flag count: ", this.game.flagCount)
        })
    }
}
