JOY.runModule(function* ({ Internals, Namespaces }) {

    const { declare } = yield Namespaces;

    const emptyFrozenArr = Object.freeze([]);

    declare(Internals.Helpers.Objects, { emptyFrozenArr });

});
