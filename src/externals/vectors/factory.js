JOY.$(function* (ns) {

    const { declare }              = yield ns;
    const { $init, createFactory } = yield ns.factories;

    /// Declare Vector factory

    const [ Vector, { prototype, symbols } ] = createFactory();
    const { $vecRelativeTo } = symbols;

    declare(ns.vectors, { Vector, $vecRelativeTo });

    /// Populate prototype and define factory constants

    const { getDescriptors }                    = yield ns.helpers.objects;
    const { Transformation, $vector, $complex } = yield ns.transformations;
    const { $im, $re }                          = yield ns.complexNums;

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

        scaled(num) {
            return Vector(this[$x] * num, this[$y] * num);
        },

        relativeTo(tr) {

            if (!Transformation.proto.isPrototypeOf(tr)) {
                throw TypeError('Transformation expected');
            }

            return this[$vecRelativeTo](tr);

        },

        [$vecRelativeTo](tr) {
            const x = this[$x];
            const y = this[$y];
            const tV = tr[$vector];
            const tX = tV[$x];
            const tY = tV[$y];
            const tC = tr[$complex];
            const tIm = tC[$im];
            const tRe = tC[$re];
            return Vector(tX + tRe * x - tIm * y, tY + tIm * x + tRe * y);
        }

    }));

    Object.assign(Vector, {
        front: Vector(0, 1),
        back: Vector(0, -1),
        right: Vector(1, 0),
        left: Vector(-1, 0),
        zero: Vector(0, 0)
    });

    Object.freeze(prototype);
    Object.freeze(Vector);
    JOY.Vector = Vector;

});
