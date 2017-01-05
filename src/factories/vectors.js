(async () => {

    const { declarationsCompletion } = JOY.core;
    const { $init, createFactory } = JOY.factories;

    /// Declare Vector factory

    const { factory, prototype, symbols } = createFactory();
    const { $relativeTo } = symbols;

    JOY.core.symbols.vectors = { $relativeTo };
    JOY.Vector = factory;

    /// Populate prototype and define factory constants

    await declarationsCompletion;

    const { getDescriptors } = JOY.core.helpers.objects;
    const { Complex } = JOY;
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
        },

        scale(num) {
            return factory(this[$x] * num, this[$y] * num);
        },

        relativeTo(position, rotation) {

            if (!Complex.proto.isPrototypeOf(rotation)) {
                throw TypeError('complex number expected as rotation');
            }

            if (!prototype.isPrototypeOf(position)) {
                throw TypeError('vector expected as position');
            }

            return this[$relativeTo](position, rotation);

        },

        [$relativeTo](position, rotation) {
            const x = this[$x];
            const y = this[$y];
            const rRe = rotation.re;
            const rIm = rotation.im;
            return factory(
                position[$x] + rRe * x - rIm * y,
                position[$y] + rIm * x + rRe * y
            );
        }

    }));

    Object.assign(factory, {
        front: factory(0, 1),
        back: factory(0, -1),
        right: factory(1, 0),
        left: factory(-1, 0),
        zero: factory(0, 0)
    });

    Object.freeze(prototype);
    Object.freeze(factory);

})();
