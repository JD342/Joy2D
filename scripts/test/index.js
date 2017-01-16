const { join, relative, sep, dirname } = require('path');
const { spawn }                        = require('child_process');
const EventEmitter                     = require('events');
const {
    clearLine,
    cursorTo,
    moveCursor,
    createInterface
} = require('readline');

const { readdir, readFile }     = require('mz/fs');
const { red, green, gray, dim } = require('chalk');
const cursor                    = require('cli-cursor');
const read                      = require('read-all-stream');
const spinner                   = require('cli-spinners').dots;
const AsyncIteration            = require('async-iteration');

const { MAIN_DIR, SRC_DIR, NPM_BIN } = require('../shared/constants');
const { TEST, PASS, FAIL, MESSAGE }  = require('./constants');

const SPINNER_MARGIN        = 1;
const INDENTATION           = spinner.frames[0].length + SPINNER_MARGIN * 2;
const CONFIGS_FILE          = join(MAIN_DIR, 'test-configs.json');
const X_CHAR                = '\u2718';
const CHECK_CHAR            = '\u2714';
const LEFT_ARROW_CHAR       = '\u203A';
const DISABLE_WRAP_TTY_CHAR = '\033[?7l';
const ENABLE_WRAP_TTY_CHAR  = '\033[?7h';

const { stdout } = process;

const fetchTestFiles = (dir = SRC_DIR) => AsyncIteration(async (include) => {
    const contents = readdir(dir);
    const fetches = [];
    for (const c of contents) {
        if (/\./.test(c)) { if (/^test\.js$/.test(c)) include(join(dir, c)); }
        else fetches.push(fetchTestFiles(join(dir, c)));
    }
    await Promise.all(fetches.map((f) => (async () => {
        f.iterate(include);
        await f.promise();
    })()));
});

const getSpinnerFrame = () => {
    const i = Math.round(Date.now() / spinner.interval) % spinner.frames.length;
    const frame = spinner.frames[i];
    return frame;
};

const runUnit = (() => {

    const electron = join(NPM_BIN, 'electron');
    const tester = join(__dirname, 'tester.js');
    const cmd = `${electron} --js-flags="--harmony" ${tester}`;

    return (file, cfgName, cfgJSON, statsEmitter) => new Promise((res, rej) => {

        const env = { TEST_FILE: file, TEST_CONFIG: cfgJSON };
        const unit = spawn(cmd, { env });
        const interface = createInterface({ input: unit.stdout });
        const tests = new Map();

        const error = (message) => { onError({ message }); };

        const unlink = () => {
            unit.removeListener('error', onError);
            unit.removeListener('exit', onExit);
            interface.removeListener('line', onLine);
        };

        unit.on('error', onError);
        unit.on('exit', onExit);
        interface.on('line', onLine);

        const stderrRead = read(unit.stderr).catch(onError);

        function onError({ message }) {

            const msg = `\
an internal problem has occurred when interfacing with proccess running unit \
tests for file at "${file}" with configuration named "${cfgName}": ${message}`;

            unlink();
            rej(Error(msg));

        }

        function onExit(code){

            unlink();

            if (code === 0) res();

            else {

                stderrRead.then((data) => {

                    const msg = `\
proccess exited with code ${code} and the following stderr output: \
${JSON.stringify(data)}`;

                    error(msg);

                });

            }

        }

        function onLine (line) {

            const type = line[0];

            const lineError = (message) => {

                const msg = `\
an invalid line has been received from the standard output: ${message} \
(line content: "${line}")`;

                error(msg);

            };

            var data;
            try { data = JSON.parse(`"${line.substr(1)}"`); }
            catch ({ message }) {
                lineError(`failed to parse line: ${message}`);
                return;
            }

            const header = (() => {
                const index = data.indexOf('\n');
                if (index !== -1) return data.substr(0, index);
                return data;
            })();

            const testError = (message) => {
                lineError(`${message} (test name: "${header}")`);
            };

            switch (type) {

                case MESSAGE: {

                    statsEmitter.emit('message', {
                        file:    file,
                        config:  cfgName,
                        content: header
                    });

                    break;

                }

                case TEST: {

                    if (tests.has(header)) {
                        testError('test is already defined');
                        break;
                    }

                    tests.set(header, {});

                    statsEmitter.emit('test');

                    break;

                }

                case PASS:
                case FAIL: {

                    const test = tests.get(header);

                    if (test === undefined) {
                        testError('test has not been defined');
                        break;
                    }
                    if (test.passed) {
                        testError('test has already passed');
                        break;
                    }
                    if (test.failed) {
                        testError('test has already failed');
                        break;
                    }

                    if (type === PASS) {

                        test.passed = true;

                        statsEmitter.emit('pass');

                    }

                    else {

                        test.failed = true;

                        statsEmitter.emit('fail', {
                            name:   header,
                            file:   file,
                            config: cfgName,
                            stack:  data.substr(header.length + 1)
                        });

                    }


                    break;

                }

                default: error(`unexpected line format: "${line}"`);

            }

        }

    });

})();

const runUnits = async (statsEmitter) => {

    const fetch = fetchTestFiles();
    const json = await readFile(CONFIGS_FILE);

    const configJSONs = Object.entries(JSON.parse(json)).map(([ k, v ]) => {
        const json = JSON.stringify(Object.assign({}, v, { name: k }));
        return [k, json];
    });

    var execution;

    for (const itr = fetch.iterate(); true;) {

        const p = itr();
        await Promise.race([execution, p]); // Don't silence test rejections
        if (!await p) break; // Wait for next file retrieval, break on finish

        const file = itr.result;

        statsEmitter.emit('file');

        for (const [name, json] of configJSONs) {
            const unitTest = runUnit(file, name, json, statsEmitter);
            execution = Promise.all([execution, unitTest]);
        }

    }

};

const outputResults = async (statsEmitter) => {

    const linesToWrite = [];
    const linesToEdit = [];
    var totalLines = 0;
    var fails = new Map();
    var files = 0;
    var tests = 0;
    var passed = 0;
    var failed = 0;
    var completed = false;
    var separate = true;

    statsEmitter.on('completed', () => { completed = true; });
    statsEmitter.on('file', () => { files++; });
    statsEmitter.on('test', () => { tests++; });
    statsEmitter.on('pass', () => { passed++; });

    statsEmitter.on('fail', ({ name, file, config, stack }) => {

        failed++;

        const map = (() => {
            if (fails.has(file)) return fails.get(file);
            const map = new Map();
            fails.set(file, map);
            return map;
        })();

        for (const s of map.values()) if (s === stack) return;

        map.set(config, stack);

        {
            const dir = dirname(relative(SRC_DIR, file));
            const path = dir.split(sep).join(dim(` ${LEFT_ARROW_CHAR} `));
            linesToWrite.push('');
            linesToWrite.push(` ${red(X_CHAR)} ${path}`);
        }

        const index = totalLines + linesToWrite.length;
        linesToWrite.push(dim('   failure on ') + config);

        linesToWrite.push('');
        linesToWrite.push(...stack.split('\n').map(s => `   ${s}`));

        separate = true;

        const configs = [config];

        statsEmitter.on('fail', (info) => {
            if (file === info.file && stack === info.stack) {
                const line = dim('   same failure on ') +
                             configs.join(dim(', ')) +
                             dim(' and ') + info.config;
                configs.push(info.config);
                linesToEdit.push({ index, line });
            }
        });

    });

    statsEmitter.on('message', ({ file, config, content }) => {
        if (separate) linesToWrite.push(''), separate = false;
        const dir = dirname(relative(SRC_DIR, file));
        const line = ' ' +
                     gray('(') + dim(config) + gray(')') +
                     dir.split(sep)
                        .map(s => dim(s))
                        .join(gray(LEFT_ARROW_CHAR)) + ' ' +
                     content;
        linesToWrite.push(line);
    });

    cursor.hide();
    stdout.cork();
    stdout.write('\n\n');
    moveCursor(stdout, 0, -2);
    stdout.write(DISABLE_WRAP_TTY_CHAR);

    while (true) {

        let lines = 1;

        // Edit previous lines
        if (linesToEdit.length) {
            for (const { index, line } of linesToEdit) {
                const delta = totalLines - index;
                moveCursor(stdout, 0, -delta);
                cursorTo(stdout, 0);
                clearLine(stdout, 0);
                stdout.write(`${line}\n`);
                moveCursor(stdout, 0, delta - 1);
            }
            linesToEdit.length = 0;
        }

        // Write new lines
        if (linesToWrite.length) {
            totalLines += linesToWrite.length;
            linesToWrite.push('');
            for (const line of linesToWrite) {
                clearLine(stdout, 0);
                stdout.write(`${line}\n`);
            }
            linesToWrite.length = 0;
        }
        else moveCursor(stdout, 0, 1);

        // Write spinner
        {
            const frame = getSpinnerFrame();
            cursorTo(stdout, SPINNER_MARGIN);
            if (failed) stdout.write(red(frame));
            else if (passed) stdout.write(green(frame));
            else stdout.write(dim(frame));
        }

        // Write counters
        {
            const labels = [
                failed && red(`${failed} failed`),
                passed && (failed ? dim : green)(`${passed} passed`),
                `${files} test file${files === 1 ? '' : 's'}`,
                tests && `${tests} test${tests === 1 ? '' : 's'}`
            ];
            for (const label of labels) {
                if (label) {
                    lines++;
                    cursorTo(stdout, INDENTATION);
                    stdout.write(label);
                    clearLine(stdout, 1);
                    stdout.write('\n');
                }
            }
        }

        if (completed) {

            // Move to first line
            moveCursor(stdout, 0, -lines + 1);

            // Write v or x
            cursorTo(stdout, SPINNER_MARGIN);
            stdout.write(' '.repeat(spinner.frames[0].length - 1));
            if (failed) stdout.write(red(X_CHAR));
            else if (passed) stdout.write(green(CHECK_CHAR));
            else stdout.write(' ');

            // Move to last line
            moveCursor(stdout, 0, lines - 1);

            stdout.write(ENABLE_WRAP_TTY_CHAR);
            stdout.uncork();

            break;

        }


        stdout.write(ENABLE_WRAP_TTY_CHAR);
        stdout.uncork();

        await new Promise((res) => { setTimeout(res, 16); });

        stdout.cork();
        stdout.write(DISABLE_WRAP_TTY_CHAR);

        // Move to first line

        moveCursor(stdout, 0, -lines);

    }

    cursor.show();

};

const test = async () => {

    stdout.write('Testing\n');

    const statsEmitter = new EventEmitter();

    var failed = false;
    statsEmitter.once('fail', () => { failed = true; });

    const resultsOutput = outputResults(statsEmitter);

    //const unitsExecution = runUnits(statsEmitter);
    const emitCompletion = () => { statsEmitter.emit('completed'); };
    //unitsExecution.then(emitCompletion).catch(emitCompletion);

    await new Promise((res) => { setTimeout(res, 700); });
    statsEmitter.emit('file');

    await new Promise((res) => { setTimeout(res, 700); });
    statsEmitter.emit('test');
    statsEmitter.emit('test');

    await new Promise((res) => { setTimeout(res, 700); });
    statsEmitter.emit('pass');

    await new Promise((res) => { setTimeout(res, 700); });
    statsEmitter.emit('message', {
        file: `${SRC_DIR}/path/to/dir/test.js`,
        config:'excfg',
        content: 'example message'
    });

    await new Promise((res) => { setTimeout(res, 700); });
    statsEmitter.emit('message', {
        file: `${SRC_DIR}/path/to/dir/test.js`,
        config:'excfg2',
        content: 'example message'
    });
    statsEmitter.emit('test');
    statsEmitter.emit('test');
    statsEmitter.emit('test');

    await new Promise((res) => { setTimeout(res, 700); });
    const stack = Error('example stack').stack;
    statsEmitter.emit('fail', {
        name: 'exampleFail',
        file: `${SRC_DIR}/path/to/dir/test.js`,
        config: 'excfg',
        stack: stack
    });

    await new Promise((res) => { setTimeout(res, 700); });
    statsEmitter.emit('fail', {
        name: 'exampleFail',
        file: `${SRC_DIR}/path/to/dir/test.js`,
        config: 'excfg2',
        stack: stack
    });
    statsEmitter.emit('message', {
        file: `${SRC_DIR}/path/to/dir/test.js`,
        config:'excfg3',
        content: 'example message'
    });

    await new Promise((res) => { setTimeout(res, 700); });
    statsEmitter.emit('fail', {
        name: 'exampleFail',
        file: `${SRC_DIR}/path/to/dir/test.js`,
        config: 'excfg3',
        stack: stack
    });

    await new Promise((res) => { setTimeout(res, 700); });
    statsEmitter.emit('completed');

    await resultsOutput; //await Promise.all([unitsExecution, resultsOutput]);



    stdout.write('\nTest completed\n\n');

    return failed ? -1 : 0;

};

module.exports = test;
