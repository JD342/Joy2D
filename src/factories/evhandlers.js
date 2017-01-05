(async () => {

    const { declarationsCompletion } = JOY.Core;
    const { $init, createFactory } = JOY.Factories;

    /// Declare EventHandler factory

    const { factory, prototype, symbols } = createFactory();

    Object.assign(factory, { race, listen, unlink });

    JOY.EventHandler = factory;

    /// Implement factory functions and populate prototype

    await declarationsCompletion;

    const { Event } = JOY.core;
    const { $fire, $isObserved } = JOY.core.symbols.events;
    const { getDescriptors } = JOY.Helpers.Objects;
    const { zip } = JOY.Helpers.Iterables;
    const { $event } = symbols;

    async function race(events) {
        const promises = [...events].map(e => e.promise());
        const result = await Promise.race(promises);
        for (const [evt, promise] of zip(events, promises)) evt.unlink(promise);
        return result;
    }

    function listen(events, fn) {
        for (const evt of events) evt.listen(fn);
    }

    function unlink(events, obj) {
        for (const evt of events) evt.unlink(obj);
    }

    Object.defineProperties(prototype, getDescriptors({

        [$init]({ onObserved, onEmptied } = {}) {

            if (onObserved !== undefined && typeof onObserved !== 'function') {
                throw TypeError('expected onObserved as function or undefined');
            }

            if (onEmptied !== undefined && typeof onEmptied !== 'function') {
                throw TypeError('expected onEmptied as function or undefined');
            }

            this[$event] = Event(onObserved, onEmptied);

        },

        get event() { return this[$event]; },

        get isEventObserved() { return this[$event][$isObserved]; },

        fire(...args) { this[$event][$fire](...args); }

    }));

    Object.freeze(prototype);
    Object.freeze(factory);

})();
