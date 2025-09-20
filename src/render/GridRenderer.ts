import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { IGame, IGrid, ICell } from '../model'
import { GridEvent } from '../model'


export class GridRenderer {
    private app: Application | null = null
    private gridContainer: Container | null = null
    private cellGraphics: Graphics[][] = []
    private cellTexts: Text[][] = []
    private game: IGame
    private grid: IGrid
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
        this.grid = game.grid
    }

    private async initialize() {
        try {
            this.app = new Application()
            
            await this.app.init({
                width: this.grid.width * this.CELL_SIZE,
                height: this.grid.height * this.CELL_SIZE,
                backgroundColor: this.COLORS.BACKGROUND,
                preference: 'webgl'
            })
            
            this.gridContainer = new Container()
            this.app.stage.addChild(this.gridContainer)
            
            this.initGrid()
            this.setupEventListeners()
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
        this.isInitialized = false
        if (this.app) {
            try {
                this.app.destroy(true, { children: true, texture: true })
            } catch (error) {
                console.warn('Error during GridRenderer cleanup:', error)
            }
            this.app = null
        }
        this.gridContainer = null
        this.cellGraphics = []
        this.cellTexts = []
    }

    private initGrid() {
        if (!this.gridContainer) {
            return
        }
        for (let y = 0; y < this.grid.height; y++) {
            this.cellGraphics[y] = []
            this.cellTexts[y] = []
            
            for (let x = 0; x < this.grid.width; x++) {
                const cellGraphic = new Graphics()
                const cellText = new Text({
                    text: '',
                    style: new TextStyle({
                        fontSize: 14,
                        fontWeight: 'bold',
                        fontFamily: 'monospace'
                    })
                })
                
                cellGraphic.x = x * this.CELL_SIZE
                cellGraphic.y = y * this.CELL_SIZE
                
                this.gridContainer.addChild(cellGraphic)
                this.gridContainer.addChild(cellText)
                
                this.cellGraphics[y][x] = cellGraphic
                this.cellTexts[y][x] = cellText
                
                this.renderCell(x, y)
            }
        }
    }

    private renderCell(x: number, y: number) {
        const cell = this.grid.getCell({ x, y })
        const graphic = this.cellGraphics[y][x]
        const text = this.cellTexts[y][x]
        
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

    private setupEventListeners() {
        this.grid.on(GridEvent.CELL_STATE_CHANGE, (updatedCells: Set<ICell>) => {
            for (const cell of updatedCells) {
                this.renderCell(cell.pos.x, cell.pos.y)
            }
        })
    }
}