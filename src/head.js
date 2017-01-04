// Module declaration
//
const JOY = {
    Core: {
        Helpers: {},
        Symbols: {},
        declarationsCompletion: new Promise((res) => {
            JOY.Core.resolveDeclarationsCompletion = res;
        })
    },
    Constants: {}
};
