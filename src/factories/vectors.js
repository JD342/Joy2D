(async () => {

    const { declarationsCompletion } = JOY.core;
    const { $init, createFactory } = JOY.factories;

    /// Declare Vector factory

    const { factory, prototype, symbols } = createFactory();

    JOY.Vector = factory;

    /// Populate prototype

    await declarationsCompletion;

    const { getDescriptors } = JOY.core.helpers.objects;
    const { $x, $y } = symbols;

    Object.defineProperties(prototype, getDescriptors({

        [$init](x = 0, y = 0) {
            this[$x] = Number(x);
            this[$y] = Number(y);
        },

        get x() {
            return this[$x];
        },

        get y() {
            return this[$y];
        }

    }));

})();
