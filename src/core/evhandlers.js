JOY.$(function* (ns) {

    const { declare }              = yield ns;
    const { $init, createFactory } = yield ns.factories;

    /// Declare EventHandler factory

    const [ EventHandler, { prototype, symbols } ] = createFactory();

    Object.assign(EventHandler, {
        race,
        listen,
        unlink,
        defineGetter,
        defineGetters
    });

    declare(ns.evHandlers, { EventHandler });

    /// Implement factory functions and populate prototype

    const { getDescriptors } = yield ns.helpers.objects;
    const { zip } = yield ns.helpers.iterables;
    const { Event, $fire, $isObserved } = yield ns.events;

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

    function defineGetter(
        obj,
        key,
        symbol,
        { callback = () => {}, enumerable = true, configurable = true } = {}
    ) {
        Object.defineProperty(obj, key, {
            get() {
                if (symbol in this) return this[symbol].events;
                const opts = callback() || {};
                const handler = EventHandler(opts);
                this[symbol] = handler;
                return handler.event;
            },
            enumerable,
            configurable
        });
    }

    function defineGetters(obj, getters) {

        for (const k in getters) {

            const [key, symbol] = k;

            const {
                callback = () => {},
                enumerable = true,
                configurable = true
            } = getters[k];

            defineGetter(obj, key, symbol, {
                callback,
                enumerable,
                configurable
            });

        }

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
    Object.freeze(EventHandler);
    JOY.EventHandler = EventHandler;

});
