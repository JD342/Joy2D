JOY.runModule(function* ({ Internals, Namespaces }) {

    const { declare } = yield Namespaces;

    declare(Internals.Helpers.Iterables, { zip, first });

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
