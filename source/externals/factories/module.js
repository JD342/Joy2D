// Logic for creating factories
//
JOY.runModule(function* ({ Externals, Namespaces }) {

    /// Initialize module

    const prototypes = new WeakMap();
    const internalSymbols = new WeakSet();

    const hideInternalSymbols = (() => {

        const proxyHandler = {

            ownKeys(target) {
                return Reflect.ownKeys(target).filter((key) => {
                    return !internalSymbols.has(key);
                });
            }

        };

        return (obj) => new Proxy(obj, proxyHandler);

    })();

    const createInternalSymbol = (name) => {
        const symbol = Symbol(name);
        internalSymbols.add(symbol);
        return symbol;
    };

    const createInternalSymbols = (() => {

        const proxyHandler = {

            get(target, key) {
                if (key in target) return target[key];
                if (typeof key !== 'string') return undefined;
                if (!/^\$[a-zA-Z_]+$/.test(key)) return undefined;
                return target[key] = createInternalSymbol(key);
            },

            set() { return false; }

        };

        return () => new Proxy({}, proxyHandler);

    })();

    const createSuper =  (obj) => {

        const boundProps = new WeakMap();

        return Object.freeze(new Proxy(obj.__proto__.__proto__, {

            get(target, key) {
                if(!(key in target)) return undefined;
                const prop = target[key];
                if (boundProps.has(prop)) return boundProps.get(prop);
                const propIsFn = typeof prop === 'function';
                const boundProp = propIsFn ? prop.bind(obj) : prop;
                boundProps.set(prop, boundProp);
                return boundProp;
            }

        }));

    };

    const rootPrototype = (() => {

        const $super = createInternalSymbol('$super');

        return hideInternalSymbols({

            [$init]() { },

            get super() {
                if (this.hasOwnProperty($super)) return this[$super];
                return this[$super] = createSuper(this);
            }

        });

    });

    /// Declare Factories module

    const { declare } = yield Namespaces;

    const $init = createInternalSymbol('$init');

    declare(Externals.Factories, { $init, createFactory });
    JOY.Factories = Object.freeze({ $init, createFactory });

    /// Implement module functions

    function createFactory ({ extends: superFactory }) {

        const symbols = createInternalSymbols();

        const prototype = hideInternalSymbols(Object.create(
            superFactory ? prototypes.get(superFactory) : rootPrototype
        ));

        const factory = (...args) => {
            const instance = hideInternalSymbols(Object.create(prototype));
            instance[$init](...args);
            return instance;
        };
        factory.proto = prototype;

        return [ factory, { prototype, symbols } ];

    }

});
