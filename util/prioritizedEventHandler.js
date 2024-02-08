// The main driver behind the entire rewrite

"use strict";

class PrioritizedEventHandler {
    constructor(finalListener) {
        this.finalListener = finalListener;

        this.eventListeners = {};
    }

    /*
        eventListeners structure
        {
            1: [function, function, function],
            2: [function, function],
            4: [function, function, function, function]
        }

    */

    async addEventEmitter(emitter, events) {
        const priorityHandler = this;

        for (const i in events) {
            emitter.on(events[i], async function handleEvent () { // If it stops working remove this async
                priorityHandler.emit(events[i], ...arguments);
            });
        }
    }

    async emit() {
        let eventData = Array.from(arguments); // Clones array

        //let keys = Object.keys(this.eventListeners).sort(function(a, b) { return a - b }) // Sorts keys in ascending order
        for (var key in this.eventListeners) {
            //let key = keys[i];
            for (var j in this.eventListeners[key]) {
                const eventListener = this.eventListeners[key][j];

                try {
                    eventData = await eventListener(eventData);
                } catch (err) {
                    console.warn(`Error running eventListener`);
                    console.debug(err);
                }

                if (eventData === null) { // EventListener wants event deleted
                    return;
                } else if (eventData === false) { // EventListener wants event and itself deleted
                    this.eventListeners[key].splice(j, 1);
                    return;
                }
            }
        }

        try {
            await this.finalListener(eventData); // Pass event to final listener
        } catch (err) {
            console.warn(`Error running finalListener`);
            console.debug(err);
        }

    }

    /** addListener(priority, async function listener(eventdata))
     * priority - Priority that decides when this listener recieves the event (Lower priority executed first)
     * listener - Function that processes event
     * returns null - Deletes event
     * returns false - Deletes event and listener
     * returns anything else - Passed on as new event data
     */
    async addListener(priority, listener) {
        this.eventListeners[priority] = this.eventListeners[priority] || [];
        this.eventListeners[priority].push(listener);
        return listener;
    }

    async removeListener(priority, listener) {
        this.eventListeners[priority] = this.eventListeners[priority] || [];
        return this.eventListeners[priority].splice(this.eventListeners[priority].indexOf(listener), 1);
    }

    async removeAllListeners() {
        this.eventListeners = {};
    }
}

module.exports = PrioritizedEventHandler;
