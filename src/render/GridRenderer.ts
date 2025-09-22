import {
    Application,
    Container,
    Graphics,
    Text,
    TextStyle,
    FederatedEvent
} from 'pixi.js'
import type { IGame, ICell, FailState, Vector2 } from '../model'
import { GameState } from '../model'
import { GameInputEvent, GameInputEventEmitter } from './InputEventEmitter'


class CellRenderer {
    pos: Vector2
    containter: Container
    graphic: Graphics
    text: Text
    eventEmitter: GameInputEventEmitter

    constructor(pos: Vector2, size: number) {
        this.pos = pos

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

        this.graphic.x = pos.x * size
        this.graphic.y = pos.y * size

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

type CellRenderOptions = {
    isPressed?: boolean
    isRed?: boolean
    forceOpen?: boolean
}

type GridRendererOptions = {
    forceOpenAllCells?: boolean
    nonInteractive?: boolean
}

export class GridRenderer {
    private app: Application | null = null
    private gridContainer: Container | null = null
    private cellRenderers: CellRenderer[][] = []
    private game: IGame
    private options: GridRendererOptions
    private isInitialized = false

    private unpressFn: (() => void) | null = null

    private readonly CELL_SIZE = 24
    private readonly BORDER_WIDTH = 2

    // Colors matching classic minesweeper
    private readonly COLORS = {
        BACKGROUND: 0xC0C0C0,
        CLOSED_CELL: 0xC0C0C0,
        CLOSED_CELL_RED: 0x883333,
        OPEN_CELL: 0xBDBDBD,
        OPEN_CELL_RED: 0xED6767,
        BORDER_LIGHT: 0xFFFFFF,
        BORDER_LIGHT_RED: 0xBB6666,
        BORDER_DARK: 0x808080,
        BORDER_DARK_RED: 0x671010,
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

    private constructor(game: IGame, options: GridRendererOptions = {}) {
        this.game = game
        this.options = options
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

    static async create(game: IGame, options: GridRendererOptions = {}): Promise<GridRenderer> {
        const renderer = new GridRenderer(game, options)
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
        this.isInitialized = false

        this.removeGridEventListeners()

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
                const cell = this.game.getCell({ x, y })
                const cellRenderer = new CellRenderer(cell.pos, this.CELL_SIZE)

                if (!this.options.nonInteractive) {
                    this.setupInputEventListeners(cellRenderer)
                }

                // add to main container
                this.gridContainer.addChild(cellRenderer.containter)

                // add to renderer array
                this.cellRenderers[y][x] = cellRenderer

                this.renderCell(cellRenderer)
            }
        }
    }

    private renderCell(
        cellRenderer: CellRenderer,
        { isPressed = false, isRed = false, forceOpen = false }: CellRenderOptions
            = { isPressed: false, isRed: false, forceOpen: false }
    ) {
        const { forceOpenAllCells = false } = this.options
        const { text, graphic, pos } = cellRenderer
        const { x, y } = pos
        const cell = this.game.getCell(pos)

        graphic.clear()

        if (isPressed) {
            this.drawOpenCell(graphic)
            text.text = ''
            return
        }

        if (forceOpenAllCells || forceOpen || cell.isOpened) {
            this.drawOpenCell(graphic, isRed && cell.hasMine)
            this.updateCellText(text, cell)
        } else {
            this.drawClosedCell(graphic, isRed && cell.isFlagged)
            text.text = cell.isFlagged ? '🚩' : ''
        }

        // Position text in center of cell
        text.x = x * this.CELL_SIZE + this.CELL_SIZE / 2 - text.width / 2
        text.y = y * this.CELL_SIZE + this.CELL_SIZE / 2 - text.height / 2
    }

    private drawClosedCell(graphic: Graphics, isRed = false) {
        const bgColor = isRed ? this.COLORS.CLOSED_CELL_RED : this.COLORS.CLOSED_CELL
        const lightBorderColor = isRed
            ? this.COLORS.BORDER_LIGHT_RED
            : this.COLORS.BORDER_LIGHT
        const darkBorderColor = isRed
            ? this.COLORS.BORDER_DARK_RED
            : this.COLORS.BORDER_DARK

        // Main cell background
        graphic.rect(0, 0, this.CELL_SIZE, this.CELL_SIZE)
        graphic.fill(bgColor)

        // 3D raised border effect
        // Top and left light borders
        graphic.rect(0, 0, this.CELL_SIZE, this.BORDER_WIDTH)
        graphic.fill(lightBorderColor)
        graphic.rect(0, 0, this.BORDER_WIDTH, this.CELL_SIZE)
        graphic.fill(lightBorderColor)

        // Bottom and right dark borders
        graphic.rect(0, this.CELL_SIZE - this.BORDER_WIDTH, this.CELL_SIZE, this.BORDER_WIDTH)
        graphic.fill(darkBorderColor)
        graphic.rect(this.CELL_SIZE - this.BORDER_WIDTH, 0, this.BORDER_WIDTH, this.CELL_SIZE)
        graphic.fill(darkBorderColor)
    }

    private drawOpenCell(graphic: Graphics, isRed = false) {
        // Main cell background (sunken appearance)
        graphic.rect(0, 0, this.CELL_SIZE, this.CELL_SIZE)
        graphic.fill(this.COLORS.OPEN_CELL)

        // Thin dark border for sunken effect
        graphic.rect(0, 0, this.CELL_SIZE, 1)
        graphic.fill(this.COLORS.BORDER_DARK)
        graphic.rect(0, 0, 1, this.CELL_SIZE)
        graphic.fill(this.COLORS.BORDER_DARK)

        // Mine background (red if mine hit)
        if (isRed) {
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
        if (!this.isInitialized) return
        for (const cell of updatedCells) {
            const cellRenderer = this.cellRenderers[cell.pos.y][cell.pos.x]
            this.renderCell(cellRenderer)
        }
    }

    private handleFailedState = (failState: FailState) => {
        if (!this.isInitialized) return

        const { triggeredMine, mineCells, wrongFlagCells } = failState

        // reveal all mines + mark the triggered one as red
        mineCells.forEach((cell) => {
            const cellRenderer = this.cellRenderers[cell.pos.y][cell.pos.x]
            this.renderCell(cellRenderer, {
                isRed: cell.is(triggeredMine),
                forceOpen: true
            })
        })

        // reveal all wrong flags
        wrongFlagCells.forEach((cell) => {
            const cellRenderer = this.cellRenderers[cell.pos.y][cell.pos.x]
            this.renderCell(cellRenderer, { isRed: true })
        })
    }

    private handleGameStateChange = (state: GameState) => {
        if (!this.isInitialized) return

        const { forceOpenAllCells = false } = this.options

        // re-render whole grid when game resets or starts
        if (state === GameState.NOT_STARTED || state === GameState.IN_PROGRESS) {
            for (let y = 0; y < this.game.height; y++) {
                for (let x = 0; x < this.game.width; x++) {
                    const cellRenderer = this.cellRenderers[y][x]
                    this.renderCell(cellRenderer, { forceOpen: forceOpenAllCells })
                }
            }
        }
    }

    private setupGridEventListeners() {
        this.game.onStateChange(this.handleGameStateChange)
        this.game.onCellsChange(this.handleCellStateChange)
        this.game.onFailedState(this.handleFailedState)
    }

    private removeGridEventListeners() {
        this.game.offStateChange(this.handleGameStateChange)
        this.game.offCellsChange(this.handleCellStateChange)
        this.game.offFailedState(this.handleFailedState)
    }

    private setupInputEventListeners(cellRenderer: CellRenderer) {
        // TODO: move the logic of what events to call ideally to a separate
        // place outside of GridRenderer

        const { x, y } = cellRenderer.pos

        // press preview
        cellRenderer.on(GameInputEvent.PRESS, () => {
            if (this.game.isGameEnd) {
                return
            }

            const cellList = this.game.pressPreview({ x, y })

            // prep unpress function
            this.unpressFn = () => {
                cellList.forEach((pos) => {
                    this.renderCell(this.cellRenderers[pos.y][pos.x])
                })
            }
            // do the press
            this.game.pressPreview({ x, y }).forEach((pos) => {
                this.renderCell(this.cellRenderers[pos.y][pos.x], { isPressed: true })
            })
        })

        cellRenderer.on(GameInputEvent.OPEN, () => {
            if (this.game.isGameEnd){
                return
            }
            const success = this.game.openCell({ x, y })

            // resolve press preview
            if (success) {
                this.unpressFn = null
            } else {
                this.unpressFn?.()
            }
        })

        cellRenderer.on(GameInputEvent.CHORDING, () => {
            if (this.game.isGameEnd){
                return
            }
            const success = this.game.revealAdjacentCells({ x, y })

            // resolve press preview
            if (success) {
                this.unpressFn = null
            } else {
                this.unpressFn?.()
            }
        })

        cellRenderer.on(GameInputEvent.FLAG, () => {
            if (this.game.isGameEnd){
                return
            }
            this.game.flagCell({ x, y })
        })
    }
}
