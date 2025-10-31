import EventEmitter from "@/utils/event-emitter.ts";

/**
 * Represents the events emitted by a WebSocket server.
 */
export type WebSocketEvents = {
    [Event in WsServerMsg as `message.${Event}`]: Event;
} & {
    [State in WebSocketState as `state.${State}`]: void;
} & {
    /** A {@link WsServerMsg} has been received*/
    message: WsServerMsg;

    /** The websocket's connection state changed */
    state: WebSocketState;
};

/**
 * Represents a message type sent from a WebSocket server.
 */
enum WsServerMsg {
    RecipesChanged = "RecipesChanged",
    TagsChanged = "TagsChanged",
    IngredientsChanged = "IngredientsChanged",
}

/**
 * Represents the state of a WebSocket connection.
 */
export type WebSocketState = "disconnected" | "connecting" | "connected" | "waiting";

/**
 * Manages WebSocket connections.
 */
export class WebSocketManager extends EventEmitter<WebSocketEvents> {
    private ws: WebSocket | null = null;
    private timeout: number | null = null;
    private url: string = "";
    private state: WebSocketState = "disconnected";

    connect(url: string) {
        this.url = url;
        this.clearSocket();
        this.reconnect();
    }

    disconnect() {
        this.clearSocket();
        this.state = "disconnected";
    }

    private clearSocket() {
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        if (this.ws !== null) {
            if (this.state === "connected") {
                this.ws.close();
            } else {
                this.ws.onopen = function () {
                    this.close();
                };
            }
            this.ws.onmessage = null;
            this.ws.onclose = null;
            this.ws = null;
        }
    }

    private reconnect() {
        this.state = "connecting";
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            this.state = "connected";
        };

        this.ws.onmessage = (event) => {
            if (typeof event.data !== "string") {
                // eslint-disable-next-line no-console
                console.error("Received non-string data from websocket");
            } else {
                try {
                    const message: WsServerMsg = JSON.parse(event.data);
                    this.emitEvent("message", message);
                    this.emitEvent(`message.${message}`, message);
                } catch (e) {
                    if (e instanceof SyntaxError) {
                        // eslint-disable-next-line no-console
                        console.error("Received a non json websocket message: ", event.data);
                    } else {
                        // eslint-disable-next-line no-console
                        console.error("Received malformed json websocket message: ", JSON.parse(event.data));
                    }
                }
            }
        };

        this.ws.onclose = (event) => {
            switch (this.state) {
                case "disconnected":
                case "waiting":
                    // eslint-disable-next-line no-console
                    console.error("There shouldn't be any open websocket to close");
                    break;
                case "connecting":
                    // eslint-disable-next-line no-console
                    console.info("Failed to connect. Retry in 10s");
                    this.state = "waiting";
                    this.timeout = setTimeout(() => this.reconnect(), 10000);
                    break;
                case "connected":
                    if (event.wasClean) {
                        // eslint-disable-next-line no-console
                        console.info("Websocket closed cleanly", event.reason);
                    } else {
                        // eslint-disable-next-line no-console
                        console.info("Websocket lost connection", event.reason);
                    }
                    this.reconnect();
                    break;
            }
            this.ws = null;
        };
    }
}

/** The global websocket singleton */
const WS = new WebSocketManager();
export default WS;
