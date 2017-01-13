const JOY = {};

JOY.runModule = (() => {

    const liteners = new Map();
    const contents = new Map();
    const namespaces = new Set();

    const isNamespace = (obj) => namespaces.has(obj);

    const createNamespace = (() => {

        const proxyHandler = {

            get(target, name) {
                if (name in target) return target[name];
                const ns = createNamespace();
                target[name] = ns;
                return ns;
            },

            isExtensible() { return false; }

        };

        return () => {
            const ns = new Proxy({}, proxyHandler);
            liteners.set(ns, []);
            namespaces.add(ns);
            return ns;
        };

    })();

    const declare = (ns, content) => {

        if (contents.has(ns)) {
            throw Error('namespace already declared');
        }

        contents.set(ns, content);

        for (const fn of liteners.get(ns)) fn(content);
        liteners.delete(ns);

    };

    const root = createNamespace();

    declare(root, { declare });

    return (generator) => {

        const iterator = generator(root);

        (function f(content) {

            const { value: ns, done } = iterator.next(content);
            if (done) return;

            if (!isNamespace(ns)) {
                throw Error('expected generator to yield a namespace');
            }

            if (contents.has(ns)) f(contents.get(ns));
            else liteners.push(f);

        })();

    };

});
