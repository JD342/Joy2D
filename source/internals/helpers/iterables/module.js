JOY.runModule(function* (ns) {

    const { declare } = yield ns;
    declare(ns.helpers.iterables, { zip, first });

    function* zip(...iterables) {
        const iterators = iterables.map(i => i[Symbol.iterator]());
        while (true) {
            const results = iterators.map(i => i.next());
            if (results.every(r => r.done)) break;
            yield results.map(r => r.done ? undefined : r.value);
        }
    }

    function first(iterable) {
        for (const val of iterable) return val;
    }

});
