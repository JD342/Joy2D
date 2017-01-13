JOY.runModule(function* (ns) {

    const { declare } = yield ns;
    declare(ns.helpers.objects, { getDescriptors, getMap });

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
