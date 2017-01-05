JOY.$(function* (ns) {

    const { declare }              = yield ns;
    const { $init, createFactory } = yield ns.factories;

    /// Declare Vector factory

    const [ Vector, { prototype, symbols } ] = createFactory();
    const { $relativeTo } = symbols;

    declare(ns.vectors, { Vector, $relativeTo });

    /// Populate prototype and define factory constants

    const { getDescriptors } = yield ns.helpers.objects;
    const { Complex }        = yield ns.complexNums;

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
            return Vector(this[$x] * num, this[$y] * num);
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
            return Vector(
                position[$x] + rRe * x - rIm * y,
                position[$y] + rIm * x + rRe * y
            );
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
