const handler = {

    get(target, name) {
        if (name in target) {
            const val = target[name];
            if (typeof val === 'function') return val.bind(target);
            return val;
        }
    }

};

module.exports = (target) => new Proxy(target, handler);
