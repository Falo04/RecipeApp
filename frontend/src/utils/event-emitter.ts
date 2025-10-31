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
     * @param event The event type to emit.  Must be a key within the Events object.
     * @param eventData The data to be passed to the event listeners.
     * @return void
     */
    emitEvent<E extends keyof Events>(event: E, eventData: Events[E]): void {
        if (this.listeners[event]) {
            this.listeners[event].emit(eventData);
        }
    }

    /**
     * Adds an event listener to the element.
     *
     * @param event The event name to listen for.
     * @param listener A function to be called when the event is triggered.
     * @return An array containing the event name and the listener's ID.
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
     * @param event The event type to remove.
     * @param id The ID of the event listener to remove.
     * @return void
     */
    removeEventListener<E extends keyof Events>([event, id]: [E, number]): void {
        const group = this.listeners[event];
        if (group !== undefined) group.remove(id);
    }
}

/**
 * A container for managing a group of event listeners.
 */
class ListenerGroup<E> {
    /**
     * It serves as a simple counter to generate unique IDs.
     * @type {number}
     */
    nextId: number = 0;

    /**
     * A map to store listeners for various events.
     * The keys of the map are numerical identifiers for the events.
     * The values are callback functions (listeners) that are executed when the corresponding event occurs.
     *
     * @type {Map<number, (event: any) => void>}
     * @private
     */
    listeners: Map<number, (event: E) => void> = new Map();

    /**
     * Emits an event to all registered listeners.
     *
     * @param {E} event The event object to emit.
     */
    emit(event: E): void {
        for (const listener of this.listeners.values()) {
            try {
                listener(event);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error("Error while emitting event", e);
            }
        }
    }

    /**
     * Adds an event listener to the listener list.
     *
     * @param {function} eventListener The event listener function to add.  This function should accept an event object of type E as an argument and perform the desired action.
     * @return {number} The unique ID assigned to the newly added event listener.
     */
    add(eventListener: (event: E) => void): number {
        const id = this.nextId++;
        this.listeners.set(id, eventListener);
        return id;
    }

    /**
     * Removes a listener with the given ID.
     *
     * @param {number} id The ID of the listener to remove.
     * @return {void}
     */
    remove(id: number): void {
        this.listeners.delete(id);
    }
}
