import EventEmitter from "@/utils/event-emitter";

/** The endpoint the webserver upgrades to a websocket */
const WEBSOCKET_PATH = "/api/frontend/v1/websocket/";

/** How long to wait before dialing again after a failed attempt */
const RETRY_DELAY = 10_000;

/**
 * Everything the server pushes.
 *
 * Each one says that a kind of data changed, without saying which record, so a
 * listener reacts by reloading what it shows.
 */
export const WS_SERVER_MESSAGES = ["RecipesChanged", "TagsChanged", "IngredientsChanged"] as const;

/** A message sent by the websocket server */
export type WsServerMsg = (typeof WS_SERVER_MESSAGES)[number];

/** The state of a websocket connection */
export type WebSocketState = "disconnected" | "connecting" | "connected" | "waiting";

/**
 * The events a {@link WebSocketManager} emits.
 *
 * Every message and every state change is emitted twice, once under its own
 * name to listen for one of them and once under the generic name to listen for
 * all of them.
 */
export type WebSocketEvents = {
    [Event in WsServerMsg as `message.${Event}`]: Event;
} & {
    [State in WebSocketState as `state.${State}`]: void;
} & {
    /** A {@link WsServerMsg} has been received */
    message: WsServerMsg;

    /** The websocket's connection state changed */
    state: WebSocketState;
};

/**
 * Holds the connection to the websocket server and keeps it open.
 *
 * A connection that fails to open is retried after {@link RETRY_DELAY}, one
 * that drops is dialed again right away.
 */
export class WebSocketManager extends EventEmitter<WebSocketEvents> {
    private socket: WebSocket | null = null;
    private retry: ReturnType<typeof setTimeout> | null = null;
    private state: WebSocketState = "disconnected";

    /** The connection's current state */
    getState(): WebSocketState {
        return this.state;
    }

    /** Opens the connection, replacing an open one */
    connect() {
        this.disconnect();
        this.dial();
    }

    /** Closes the connection and stops retrying */
    disconnect() {
        if (this.retry !== null) {
            clearTimeout(this.retry);
            this.retry = null;
        }

        this.closeSocket();
        this.setState("disconnected");
    }

    /** Opens a socket and hands its events to this manager */
    private dial() {
        this.setState("connecting");

        const socket = new WebSocket(websocketUrl());
        this.socket = socket;

        socket.onopen = () => this.setState("connected");
        socket.onmessage = (event) => this.receive(event);
        socket.onclose = (event) => {
            this.socket = null;
            this.handleClose(event);
        };
    }

    /**
     * Detaches the current socket and closes it.
     *
     * The handlers go first so that the close this triggers is not mistaken for
     * a lost connection and dialed again.
     */
    private closeSocket() {
        const socket = this.socket;
        if (socket === null) return;

        this.socket = null;
        socket.onopen = null;
        socket.onmessage = null;
        socket.onclose = null;
        socket.close();
    }

    /** Decides whether a closed socket should be dialed again */
    private handleClose(event: CloseEvent) {
        switch (this.state) {
            case "connecting":
                console.info(`Failed to connect. Retry in ${RETRY_DELAY / 1000}s`);
                this.setState("waiting");
                this.retry = setTimeout(() => {
                    this.retry = null;
                    this.dial();
                }, RETRY_DELAY);
                break;

            case "connected":
                console.info(event.wasClean ? "Websocket closed cleanly" : "Websocket lost connection", event.reason);
                this.dial();
                break;

            case "disconnected":
            case "waiting":
                console.error("There shouldn't be any open websocket to close");
                break;
        }
    }

    /** Emits a received message, dropping anything the server should not send */
    private receive(event: MessageEvent<unknown>) {
        if (typeof event.data !== "string") {
            console.error("Received non-string data from websocket");
            return;
        }

        let message: unknown;
        try {
            message = JSON.parse(event.data);
        } catch {
            console.error("Received a non json websocket message: ", event.data);
            return;
        }

        if (!isServerMsg(message)) {
            console.error("Received an unknown websocket message: ", message);
            return;
        }

        this.emitEvent("message", message);
        this.emitEvent(`message.${message}`, message);
    }

    /** Stores the new state and tells the listeners about it */
    private setState(state: WebSocketState) {
        if (this.state === state) return;

        this.state = state;
        this.emitEvent("state", state);
        this.emitEvent(`state.${state}`, undefined);
    }
}

/** The url of the websocket endpoint, which shares the app's origin */
function websocketUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${window.location.host}${WEBSOCKET_PATH}`;
}

/** Narrows a parsed message to one this app knows */
function isServerMsg(message: unknown): message is WsServerMsg {
    return typeof message === "string" && (WS_SERVER_MESSAGES as ReadonlyArray<string>).includes(message);
}

/** The global websocket singleton */
const WS = new WebSocketManager();
export default WS;
