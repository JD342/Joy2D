(async () => {

    const { declarationsCompletion } = JOY.core;
    const { $init, createFactory } = JOY.factories;

    /// Declare Entity factory

    const { factory, prototype, symbols } = createFactory();

    const { $broundingRadius } = symbols;
    const E_INS = Symbol('Entity Insertion');
    const E_REM = Symbol('Entity Removal');
    const C_INS = Symbol('Component Insertion');
    const C_REM = Symbol('Component Removal');

    Object.assign(factory, { E_INS, E_REM, C_INS, C_REM });

    JOY.core.symbols.entities = { $broundingRadius };
    JOY.Entity = factory;

    /// Populate prototype

    await declarationsCompletion;

    const { EventHandler, Component, Vector } = JOY;
    const { MultiMap } = JOY.core;
    const { getDescriptors } = JOY.core.helpers.objects;
    const { emptyFrozenArr } = JOY.core.helpers.arrays;

    const {
        $name,       $nameChange,
        $parent,     $parentChange,
        $parents,    $parentsChange,
        $root,       $rootChange,
        $visible,    $visibilityChange,
        $entities,   $entChange,        $entInsertion,  $entRemoval,
        $components, $compChange,       $compInsertion, $compRemoval,
    } = symbols;

    Object.defineProperties(prototype, getDescriptors({

        [$name]: 'unnamed',
        [$parent]: null,
        [$visible]: true,

        [$init](name) {
            if (name !== undefined) this[$name] = String(name);
        },

        get name() {
            return this[$name];
        },

        set name(val) {

            if (typeof val !== 'string') {
                throw TypeError('expected string on assignment');
            }

            if ($nameChange in this) {
                const handler = this[$nameChange];
                if (handler.isEventObserved) {
                    const old = this[$name];
                    if (old !== val) {
                        this[$name] = val;
                        handler.fire(val, old);
                    }
                    return;
                }
            }

            this[$name] = val;

        },

        get nameChangeEvent() {
            if ($nameChange in this) return this[$nameChange].event;
            const handler = EventHandler();
            this[$nameChange] = handler;
            return handler.event;
        },

        get parent() {
            return this[$parent];
        },

        set parent(val) {

            if (!prototype.isPrototypeOf(val) && val !== null) {
                throw TypeError('expected entity or null on assignment');
            }

            const old = this[$parent];

            if (val === old) return;

            const oldDef = old !== null;
            const valDef = val !== null;
            const name = this[$name];

            if (oldDef) old[$entities].delete(name, this);
            if (valDef) {
                if ($entities in val) val[$entities].add(name, this);
                else val[$entities] = MultiMap([[name, this]]);
            }
            this[$parent] = val;

            if (valDef) {
                const valRoot = val[$root];
                const newRoot = valRoot === null ? val : valRoot;
                const oldRoot = this[$root];
                if (oldRoot !== newRoot) {
                    this[$root] = newRoot;
                    if ($rootChange in this) {
                        this[$rootChange].fire(newRoot, oldRoot);
                    }
                }
            }

            if (oldDef && $entRemoval in old) old[$entRemoval].fire(this);
            if (valDef && $entInsertion in val) val[$entInsertion].fire(this);
            if (oldDef && $entChange in old) old[$entChange].fire(this, E_REM);
            if (valDef && $entChange in val) val[$entChange].fire(this, E_INS);
            if ($parentChange in this) this[$parentChange].fire(val, old);

        },

        get parentChangeEvent() {
            if ($parentChange in this) return this[$parentChange].event;
            const handler = EventHandler();
            this[$parentChange] = handler;
            return handler.event;
        },

        get parents() {

            var parents = this[$parents];
            if (parents !== undefined) return parents;

            parents = [];
            for (let ent = this[$parent]; ent !== null; ent = ent[$parent]) {
                parents.push(ent);
            }
            Object.freeze(parents);
            this[$parents] = parents;

            this.parentsChangeEvent.promise().then(() => {
                this[$parents] = undefined;
            });

            return parents;

        },

        get parentsChangeEvent() {

            if ($parentsChange in this) return this[$parentsChange].event;

            var promise;

            const listener = (ent, ind, old) => {
                handler.fire(ent, ind + 1, old);
            };

            const observeParents = async () => {
                const parent = this[$parent];
                if (parent === null) {
                    promise = this.parentChange.promise();
                    const [ent, old] = await promise;
                    handler.fire(ent, 0, old);
                    observeParents();
                }
                else {
                    parent.parentsChange.listen(listener);
                    promise = this.parentChange.promise();
                    const [ent, old] = await promise;
                    parent.parentsChange.unlink(listener);
                    handler.fire(ent, 0, old);
                    observeParents();
                }
            };

            const unobserveParents = () => {
                const parent = this[$parent];
                if (parent !== null) parent.parentsChange.unlink(listener);
                this.parentChange.unlink(promise);
                promise = null;
            };

            const handler = EventHandler({
                onObserved: observeParents,
                onEmptied: unobserveParents
            });

            this[$parentsChange] = handler;

            return handler.event;

        },

        get root() {
            return this[$root];
        },

        get rootChangeEvent() {
            if ($rootChange in this) return this[$rootChange].event;
            const handler = EventHandler();
            this[$rootChange] = handler;
            return handler.event;
        },

        get visible() {
            return this[$visible];
        },

        set visible(val) {

            if (typeof val !== 'boolean') {
                throw TypeError('expected boolean on assignment');
            }

            const old = this[$visible];
            if (val === old) return;
            this[$visible] = val;

            if ($visibilityChange in this) this[$visibilityChange].fire(val);

        },

        get visibilityChangeEvent() {
            if ($visibilityChange in this) return this[$visibilityChange].event;
            const handler = EventHandler();
            this[$visibilityChange] = handler;
            return handler.event;
        },

        get x() {

        },

        set x(val) {

        },

        get xChangeEvent() {

        },

        get y() {

        },

        set y(val) {

        },

        get yChangeEvent() {

        },

        get z() {

        },

        set z(val) {

        },

        get zChangeEvent() {

        },

        get position() {

        },

        set position(val) {

        },

        get positionChangeEvent() {

        },

        get rotation() {

        },

        set rotation(val) {

        },

        get rotationChangeEvent() {

        },

        get transformation() {

        },

        set transformation(val) {

        },

        get transformationChangeEvent() {

        },

        get absX() {

        },

        set absX(val) {

        },

        get absXChangeEvent() {

        },

        get absY() {

        },

        set absY(val) {

        },

        get absYChangeEvent() {

        },

        get absZ() {

        },

        set absZ(val) {

        },

        get absPosition() {

        },

        set absPosition(val) {

        },

        get absPositionChangeEvent() {

        },

        get absRotation() {

        },

        set absRotation(val) {

        },

        get absRotationChangeEvent() {

        },

        get absTransformation() {

        },

        set absTransformation(val) {

        },

        get absTransformationChangeEvent() {

        },

        get insertionEvent() {

        },

        get removalEvent() {

        },

        get entityInsertionEvent() {

        },

        get entityRemovalEvent() {

        },

        get componentInsertionEvent() {

        },

        get componentRemovalEvent() {

        },

        remove(obj) {
            if (prototype.isPrototypeOf(obj)) {
                //
            }
            if (Component.proto.isPrototypeOf(obj)) {
                //
            }
        },

        find() {

        },

        findAll() {

        },

        insert() {

        },

        aim() {

        },

        [Symbol.iterator]: function* () {

        },

        get [$broundingRadius]() {

        }

    }));

    Object.freeze(prototype);
    Object.freeze(factory);

})();
