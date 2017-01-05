// Module declaration
//
const JOY = {
    core: {
        helpers: {},
        symbols: {},
        declarationsCompletion: new Promise((res) => {
            JOY.core.resolveDeclarationsCompletion = res;
        })
    },
    constants: {}
};
