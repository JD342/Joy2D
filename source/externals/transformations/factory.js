JOY.runModule(function* ({ Internals, Externals, Namespaces }) {

    // Declare module

    const { declare }              = yield Namespaces;
    const { $init, createFactory } = yield Externals.Factories;

    const [ Transformation, { prototype, symbols } ] = createFactory();
    const {
        $position,     $rotation,
        $assignTr,     $transform,
        $relativeToTr, $appliedToTr
    } = symbols;

    declare(Externals.Trasnformations, {
        Transformation,
        $position,     $rotation,
        $assignTr,     $transform,
        $relativeToTr, $appliedToTr
    });

    /// Populate prototype

    const { getDescriptors, defineProps } = yield Internals.Helpers.Objects;
    const { defineEvents, fire }          = yield Externals.EvHandlers;
    const { $im, $re }                    = yield Externals.ComplexNums;
    const {
        Rotation, verifyRotationArgs,
        $rotate,  $complex
    } = yield Externals.Rotations;
    const {
        Vector, verifyVectorArgs,
        $x,     $y,               $sum
    } = yield Externals.Vectors;

    defineProps(prototype, {

        [$init](...trArgs) {
            verifyTransformationArgs(trArgs);
            this[$assignTr](...trArgs);
        },

        get x() { return this[$position][$x]; },
        set x(val) { this[$position].x = val; },
        get xChange() { return this[$position].xChange; },

        get y() { return this[$position][$y]; },
        set y(val) { this[$position].y = val; },
        get yChange() { return this[$position].yChange; },

        get position() { return this[$position]; },
        get positionChange() { return this[$position].coordsChange; },

        get sin() { return this[$rotation][$complex][$im]; },
        get sinChange() { return this[$rotation].sinChange; },

        get cos() { return this[$rotation][$complex][$re]; },
        get cosChange() { return this[$rotation].reChange; },

        get rotation() { return this[$rotation]; },
        get rotationChange() { return this[$rotation].complexChange; },

        transform(...trArgs) {
            verifyTransformationArgs(trArgs);
            this[$transform](...trArgs);
        },

        relativeTo(...trArgs) {
            verifyTransformationArgs(trArgs);
            return this[$relativeToTr](...trArgs);
        },

        appliedTo(...trArgs) {
            verifyTransformationArgs(trArgs);
            return this[$appliedToTr](...trArgs);
        },

        assign(...trArgs) {
            verifyTransformationArgs(trArgs);
            return this[$assignTr](...trArgs);
        },

        [$transform](...trArgs) {
            const { x, y, sin, cos } = parseTransformationArgs(trArgs);
            this[$position][$sum](x, y);

        },

        [$relativeToTr](...trArgs) {
            const { x, y, sin, cos } = parseTransformationArgs(trArgs);
        },

        [$assignTr](...trArgs) {

        },

        [$appliedToTr](...trArgs) {

        }

    });

    /// Implement module functions

    function verifyTransformationArgs(trArgs) {

        // Verify ()
        if (trArgs.length === 0) return;

        // Verify (tr)
        if (prototype.isPrototypeOf(trArgs[0])) return;

        // Verify (pos[, rot])
        if (Vector.proto.isPrototypeOf(trArgs[0])) {
            if (trArgs.length === 1) return;
            if (Rotation.proto.isPrototypeOf(trArgs[1])) return;
        }

        // Verify (rot[, pos])
        if (Rotation.proto.isPrototypeOf(trArgs[0])) {
            if (trArgs.length === 1) return;
            if (Vector.proto.isPrototypeOf(trArgs[1])) return;
        }

        // Verify (x[, y[, theta]])
        if (typeof trArgs[0] === 'number') {
            if (trArgs.length === 1) return;
            if (typeof trArgs[1] === 'number') {
                if (trArgs.length === 2) return;
                if (typeof trArgs[2] === 'number') return;
            }
        }

        // All verifications failed, throw error
        throw Error('invalid transformation arguments');

    }

    // Note: this function assumes that `trArgs` is valid, meaning that
    // `verifyTransformationArgs` has been called before calling this function
    // if `trArgs` was external
    function parseTransformationArgs(trArgs) {

        // Parse ()
        if (trArgs.length === 0) {
            const x = 0, y = 0, sin = 0, cos = 1;
            return { x, y, sin, cos };
        }

        // Parse (x[, y[, theta]])
        {
            const x = trArgs[0];
            if (typeof x === 'number') {
                if (trArgs.length === 1) {
                    const y = 0, sin = 0, cos = 1;
                    return { x, y, sin, cos };
                }
                const y = trArgs[1];
                if (trArgs.length === 2) {
                    const sin = 0, cos = 1;
                    return { x, y, sin, cos };
                }
                const theta = trArgs[2];
                const sin = Math.sin(theta), cos = Math.cos(theta);
                return { x, y, sin, cos };
            }
        }

        // Parse (tr)
        {
            const tr = trArgs[0];
            if (prototype.isPrototypeOf(tr)) {
                const vec = tr[$position], cmp = tr[$rotation][$complex];
                const x = vec[$x], y = vec[$y], sin = cmp[$im], cos = cmp[$re];
                return { x, y, sin, cos };
            }
        }

        // Parse (pos[, rot])
        {
            const vec = trArgs[0];
            const x = vec[$x], y = vec[$y];
            if (Vector.proto.isPrototypeOf(vec)) {
                if (trArgs > 1) {
                    const cmp = trArgs[1][$complex];
                    const sin = cmp[$im], cos = cmp[$re];
                    return { x, y, sin, cos };
                }
                else {
                    const sin = 0, cos = 1;
                    return { x, y, sin, cos };
                }
            }
        }

        // Parse (rot[, pos])
        {
            const cmp = trArgs[0][$complex];
            const sin = cmp[$im], cos = cmp[$re];
            if (trArgs.length === 1) {
                const x = 0, y = 0;
                return { x, y, sin, cos };
            }
            const vec = trArgs[1];
            const x = vec[$x], y = vec[$y];
            return { x, y, sin, cos };
        }

    }

})();
