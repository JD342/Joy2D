JOY.runModule(function* (ns) {

    const { declare } = yield ns;

    const emptyFrozenArr = Object.freeze([]);

    declare(ns.helpers.arrays, { emptyFrozenArr });

});
