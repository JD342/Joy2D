JOY.Core.Helpers.Objects = {

    getDescriptors(obj) {
        const descriptors = {};
        for (const key of Reflect.ownKeys(obj)) {
            const descriptor = Object.getOwnPropertyDescriptor(obj, key);
            descriptors[key] = descriptor;
        }
        return descriptors;
    },

    getMap(obj) {

    }

};
