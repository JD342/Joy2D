JOY.runModule(function* ({ Internals, Externals, Namespaces }) {

    /// Declare InjectiveWeakMap factory

    const { declare }              = yield Namespaces;
    const { $init, createFactory } = yield Externals.Namespaces;

    const [ InjectiveWeakMap, { prototype, symbols } ] = createFactory();

    declare(Internals.InjectiveWMaps, { InjectiveWeakMap });

    /// Populate prototype

    const { $keys, $vals } = symbols;

    Object.assign(prototype, {

        [$init](iterable = []) {
            this[$keys] = new WeakMap();
            this[$vals] = new WeakMap();
            for (const [key, val] of iterable) this.set(key, val);
        },

        set(key, value) {

            if (key === null || typeof key !== 'object') {
                throw TypeError('invalid key');
            }
            if (value === null || typeof value !== 'object') {
                throw TypeError('invalid value');
            }

            const keys = this[$keys], vals = this[$vals];
            this.delete(key);
            this.deleteVal(value);
            vals.set(key, value);
            keys.set(value, key);

            return this;

        },

        delete(key) {
            const vals = this[$vals];
            if (vals.has(key)) {
                const val = vals.get(key);
                vals.delete(key);
                this[$keys].delete(val);
                return true;
            }
            return false;
        },

        deleteVal(val) {
            const keys = this[$keys];
            if (keys.has(val)) {
                const key = keys.get(val);
                this[$vals].delete(key);
                this[$keys].delete(val);
                return true;
            }
            return false;
        },

        get(key) {
            return this[$vals].get(key);
        },

        getKey(val) {
            return this[$keys].get(val);
        },

        has(key) {
            return this[$vals].has(key);
        },

        hasVal(val) {
            return this[$keys].has(val);
        },

        [Symbol.iterator]: function* () { yield* this[$vals]; }

    });

});
