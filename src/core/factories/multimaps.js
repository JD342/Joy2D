(async () => {

    const { declarationsCompletion } = JOY.Core;
    const { $init, createFactory } = JOY.Factories;

    /// Declare MultiMap factory

    const { factory, prototype, symbols } = createFactory();

    JOY.core.MultiMap = factory;

    /// Populate prototype

    await declarationsCompletion;

    const {
        createIterableFrom,
        createEmptyIterable
    } = JOY.core.helpers.iterables;

    const { $map } = symbols;

    Object.assign(prototype, {

        [$init](iterable = []) {
            this[$map] = new Map(iterable.map(([k, ...v]) => [k, new Set(v)]));
        },

        add(key, ...values) {
            const map = this[$map];
            const set = map.get(key);
            if (set !== undefined) for (const val of values) set.add(val);
            return this;
        },

        get(key) {
            const map = this[$map];
            const set = map.get(key);
            if (set === undefined) return createEmptyIterable();
            return createIterableFrom(set);
        },

        delete(...args) {
            const [key] = args;
            const map = this[$map];
            if (args.length === 1) map.delete(key);
            else {
                const set = map.get(key);
                if (set !== undefined) {
                    const [,...values] = args;
                    for (const val of values) set.delete(val);
                    if (set.length === 0) map.delete(key);
                }
            }
            return this;
        },

        has(...args) {
            const [key] = args;
            const map = this[$map];
            const set = map.get(key);
            if (set === undefined) return false;
            if (args.length === 1) return true;
            const [,value] = args;
            return set.has(value);
        },

        entries: function* () {
            yield* this[Symbol.iterator]();
        },

        keys: function* () {
            yield* this[$map].keys();
        },

        values: function* () {
            for (const [,set] of this[$map]) yield* set;
        },

        groups: function* () {
            for (const [,set] of this[$map]) yield function* () { yield* set; };
        },

        [Symbol.iterator]: function* () {
            for (const [key, set] of this[$map]) {
                yield [key, function* () { yield* set; }];
            }
        }

    });

})();
