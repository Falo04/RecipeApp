/**
 * Represents a basic EventEmitter class.
 * This class provides a way to emit and listen for events.
 */
export default class EventEmitter<Events extends object> {
    /** Map from event type to a group of listeners */
    listeners: { [key in keyof Events]?: ListenerGroup<Events[key]> } = {};

    /**
     * Emits an event to the listeners.
     *
     * @param event The event type to emit
     * @param eventData The data to be passed to the event listeners
     */
    emitEvent<E extends keyof Events>(event: E, eventData: Events[E]): void {
        if (this.listeners[event]) {
            this.listeners[event].emit(eventData);
        }
    }

    /**
     * Adds an event listener to the element.
     *
     * @param event The event name to listen for
     * @param listener A function to be called when the event is triggered
     * @returns The event name and the listener's id, to remove it again
     */
    addEventListener<E extends keyof Events>(event: E, listener: (event: Events[E]) => void): [E, number] {
        if (!this.listeners[event]) {
            this.listeners[event] = new ListenerGroup<Events[E]>();
        }
        return [event, this.listeners[event].add(listener)];
    }

    /**
     * Removes an event listener.
     *
     * @param listener The event name and listener id {@link addEventListener} returned
     */
    removeEventListener<E extends keyof Events>(listener: [E, number]): void {
        const [event, id] = listener;
        const group = this.listeners[event];
        if (group !== undefined) group.remove(id);
    }
}

/**
 * A container for managing a group of event listeners.
 */
class ListenerGroup<E> {
    /** A counter to generate unique ids */
    nextId: number = 0;

    /** The listeners, by their id */
    listeners: Map<number, (event: E) => void> = new Map();

    /**
     * Emits an event to all registered listeners.
     *
     * @param event The event object to emit
     */
    emit(event: E): void {
        for (const listener of this.listeners.values()) {
            try {
                listener(event);
            } catch (e) {
                console.error("Error while emitting event", e);
            }
        }
    }

    /**
     * Adds an event listener to the listener list.
     *
     * @param eventListener The function to call with each emitted event
     * @returns The unique id assigned to the listener
     */
    add(eventListener: (event: E) => void): number {
        const id = this.nextId++;
        this.listeners.set(id, eventListener);
        return id;
    }

    /**
     * Removes a listener with the given ID.
     *
     * @param id The id of the listener to remove
     */
    remove(id: number): void {
        this.listeners.delete(id);
    }
}
