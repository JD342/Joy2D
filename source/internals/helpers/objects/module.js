JOY.runModule(function* ({ Internals, Namespaces }) {

    const { declare } = yield Namespaces;
    declare(Internals.Helpers.Objects, { getDescriptors, getMap });

    function getDescriptors (obj) {
        const descriptors = {};
        for (const key of Reflect.ownKeys(obj)) {
            const descriptor = Object.getOwnPropertyDescriptor(obj, key);
            descriptors[key] = descriptor;
        }
        return descriptors;
    }

    function getMap(obj) {

    }

});
