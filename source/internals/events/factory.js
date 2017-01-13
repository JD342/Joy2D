JOY.runModule(function* (ns) {

    /// Declare Event factory

    const { declare }              = yield ns;
    const { $init, createFactory } = yield ns.factories;

    const [ Event, { prototype, symbols } ] = createFactory();
    const { $fire, $isObserved } = symbols;

    declare(ns.events, { Event, $fire, $isObserved });

    /// Populate prototype

    const {
        $resolvers,
        $link,       $unlink,     $linked, $toLink,
        $process,    $processing,
        $onObserved, $onEmptied
    } = symbols;

    Object.assign(prototype, {

        [$isObserved]: false,

        [$init](onObserved, onEmptied) {
            this[$onObserved] = onObserved;
            this[$onEmptied] = onEmptied;
            this[$linked] = new Set();
            this[$resolvers] = new Map();
        },

        promise() {

            const promise = new Promise((res) => {

                const resolvers = this[$resolvers];

                const resolver = () => {
                    resolvers.delete(promise);
                    this[$unlink](resolver);
                    res();
                };

                resolvers.set(promise, resolver);
                this[$link](resolver);

            });

            return promise;

        },

        listen(fn) {
            if (typeof fn !== 'function') throw TypeError('expected function');
            if (!this[$linked].has(fn)) this[$link](fn);
        },

        unlink(obj) {

            if (typeof obj === 'function') {
                if (this[$linked].has(obj)) this[$unlink](obj);
            }

            else if (obj instanceof Promise) {
                const resolvers = this[$resolvers];
                const resolver = resolvers.get(obj);
                if (resolver === undefined) return;
                resolvers.delete(obj);
                this[$unlink](resolver);
            }

            else throw TypeError('expected function or promise');

        },

        [$link](fn) {

            var triggerOnObserved = false;

            if (!this[$processing]) {
                const linked = this[$linked];
                linked.add(fn);
                if (linked.length === 1) triggerOnObserved = true;
            }

            else {
                const toLink = this[$toLink];
                if (toLink === undefined) {
                    this[$toLink] = new Set([fn]);
                    if (this[$linked].length === 0) triggerOnObserved = true;
                }
                else toLink.add(fn);
            }

            if (triggerOnObserved) {
                this[$isObserved] = true;
                const onObserved = this[$onObserved];
                if (onObserved !== undefined) this[$onObserved]();
            }

        },

        [$unlink](fn) {

            const linked = this[$linked];

            if (linked.length === 0) {
                this[$isObserved] = false;
                const onEmptied = this[$onEmptied];
                if (onEmptied !== undefined) this[$onEmptied]();
            }

        },

        [$fire](...args) {

            if (this[$processing]) this[$process](...args);

            else {

                this[$processing] = true;
                this[$process](...args);
                this[$processing] = false;

                const toLink = this[$toLink];
                if (toLink !== undefined) {
                    for (const fn of toLink) this[$linked].add(fn);
                    this[$toLink] = undefined;
                }

            }

        },

        [$process](...args) {
            for (const fn of this[$linked]) fn(...args);
        }

    });

    Object.freeze(prototype);

});
