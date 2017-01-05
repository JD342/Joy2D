JOY.core.helpers.iterables = (() => {

    const zip = function* (...iterables) {
        const iterators = iterables.map(i => i[Symbol.iterator]());
        while (true) {
            const results = iterators.map(i => i.next());
            if (results.every(r => r.done)) break;
            yield results.map(r => r.done ? undefined : r.value);
        }
    };

    const first = function (iterable) {
        for (const val of iterable) return val;
    };

    return { zip, first };

})();
