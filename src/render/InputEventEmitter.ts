import { EventEmitter, FederatedEvent } from 'pixi.js'
import { debounce } from '../utils'

export enum GameInputEvent {
    PRESS = 'press',
    OPEN = 'open',
    FLAG = 'flag',
    CHORDING = 'chording',
}

export class GameInputEventEmitter {
    protected baseEmitter: EventEmitter
    private eventEmitter = new EventEmitter<GameInputEvent>()

    private pressTimer: number | null = null
    private isPressed: boolean = false
    private longPressFired: boolean = false
    private numPresses = 0

    private readonly LONG_PRESS_DURATION = 500 // ms
    private readonly DOUBLE_PRESS_THRESHOLD = 150 // ms

    private debouncedPressUpHandler = debounce((event) => {
        const numPresses = this.numPresses
        this.numPresses = 0
        if (numPresses > 1) {
            this.eventEmitter.emit(GameInputEvent.CHORDING, event)
        } else {
            this.eventEmitter.emit(GameInputEvent.OPEN, event)
        }
    }, this.DOUBLE_PRESS_THRESHOLD)

    constructor(baseEmitter: EventEmitter) {
        this.baseEmitter = baseEmitter

        this.setupListeners()
    }

    private setupListeners() {
        this.baseEmitter.on('touchstart', this.handlePointerDown.bind(this))
        this.baseEmitter.on('touchend', this.handlePointerUp.bind(this))
        this.baseEmitter.on('touchendoutside', this.handlePointerUp.bind(this))
        this.baseEmitter.on('touchcancel', this.handlePointerCancel.bind(this))

        this.baseEmitter.on('mousedown', this.handleMouseDown.bind(this))
        this.baseEmitter.on('mouseup', this.handlePointerUp.bind(this))
        this.baseEmitter.on('mouseupoutside', this.handlePointerUp.bind(this))
        this.baseEmitter.on('mouseleave', this.handlePointerCancel.bind(this))
        this.baseEmitter.on('rightclick', this.handleRightClick.bind(this))
    }

    private handleMouseDown(event: FederatedEvent) {
        this.isPressed = true
        console.log("MOUSE DOWN")
        this.eventEmitter.emit(GameInputEvent.PRESS, event)
    }

    private handlePointerDown(event: FederatedEvent) {
        this.isPressed = true

        // Start long press timer but only for the touch event;
        // otherwise right click is used for FLAG
        this.pressTimer = window.setTimeout(() => {
            if (this.isPressed) {
                this.eventEmitter.emit(GameInputEvent.FLAG, event)
                this.longPressFired = true
            }
        }, this.LONG_PRESS_DURATION)

        this.eventEmitter.emit(GameInputEvent.PRESS, event)
    }

    private handleRightClick(event: FederatedEvent) {
        event.preventDefault()
        this.eventEmitter.emit(GameInputEvent.FLAG, event)
    }

    private handlePointerUp(event: FederatedEvent) {
        if (!this.isPressed) return

        this.numPresses++
        this.isPressed = false

        // Clear long press timer
        if (this.pressTimer) {
            clearTimeout(this.pressTimer)
            this.pressTimer = null
            if (this.longPressFired) {
                // this press was already consumed by the long press event
                return
            }
        }

        this.debouncedPressUpHandler(event)
    }

    private handlePointerCancel() {
        this.isPressed = false
        if (this.pressTimer) {
            clearTimeout(this.pressTimer)
            this.pressTimer = null
        }
    }

    on(event: GameInputEvent, cb: (event: FederatedEvent) => void) {
        switch (event) {
            case GameInputEvent.OPEN:
                this.eventEmitter.on(GameInputEvent.OPEN, cb)
                break
            case GameInputEvent.FLAG:
                this.eventEmitter.on(GameInputEvent.FLAG, cb)
                break
            case GameInputEvent.CHORDING:
                this.eventEmitter.on(GameInputEvent.CHORDING, cb)
                break
            case GameInputEvent.PRESS:
                this.eventEmitter.on(GameInputEvent.PRESS, cb)
                break
        }
    }

    off(event: GameInputEvent, cb: (event: FederatedEvent) => void) {
        switch (event) {
            case GameInputEvent.OPEN:
                this.eventEmitter.off(GameInputEvent.OPEN, cb)
                break
            case GameInputEvent.FLAG:
                this.eventEmitter.off(GameInputEvent.FLAG, cb)
                break
            case GameInputEvent.CHORDING:
                this.eventEmitter.off(GameInputEvent.CHORDING, cb)
                break
            case GameInputEvent.PRESS:
                this.eventEmitter.off(GameInputEvent.PRESS, cb)
                break
        }
    }

    destroy() {
        if (this.pressTimer) {
            clearTimeout(this.pressTimer)
        }
        this.baseEmitter.removeAllListeners()
        this.eventEmitter.removeAllListeners()
    }

}
