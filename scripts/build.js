const { resolve, join, sep } = require('path');
const { readFile, writeFile, mkdir, readdir, stat } = require('mz/fs');
const { transform } = require('babel-core');
const rmfr = require('rmfr');
const Concat = require('concat-with-sourcemaps');
const AsyncIteration = require('async-iteration');

const mainDir =              resolve(__dirname, '..');
const srcDir =               join(mainDir, 'src');
const buildDir =             join(mainDir,'build');
const licenseFile =          join(mainDir, 'LICENSE');
const packageFile =          join(mainDir, 'package.json');
const orderFile =            join(srcDir, 'order.json');
const uncompressedBuildDir = join(buildDir, 'uncompressed');
const uncompressedBuild =    join(uncompressedBuildDir, 'joy2d.js');
const uncompressedBuildMap = join(uncompressedBuildDir, 'joy2d.js.map');
const minifiedBuildDir     = join(buildDir, 'minified');
const minifiedBuild =        join(minifiedBuildDir, 'joy2d.min.js');
const minifiedBuildMap =     join(minifiedBuildDir, 'joy2d.min.js.map');

const fetchSources = () => AsyncIteration(async (include) => {

    const json = await readFile(orderFile, 'utf8');
    const order = JSON.parse(json);
    const ordered = new Set();
    const fetches = new Map();
    const reads = new Map();

    // Define function used to retrieve and read contents of all unordered
    // source files in a specific folder.
    const fetchDir = (dir) => AsyncIteration(async (include) => {
        const content = await readdir(join(srcDir, dir));
        const fetches = [];
        for (const c of content) {
            const path = join(dir, c);
            if (!ordered.has(path)) {
                if (/\./.test(c)) {
                    if (/\.js$/.test(c)) {
                        reads.set(path, readFile(join(srcDir, path), 'utf8'));
                        include(path);
                    }
                }
                else fetches.push(fetchDir(path));
            }
        }
        for (const fetch of fetches) {
            for (const itr = fetch.iterate(); await itr();) {
                include(itr.result);
            }
        }
    });

    // Parse order.json, read all sources to include
    order.forEach((item) => {
        const path = item.replace('/', sep);
        if (/\.js$/.test(path)) {
            ordered.add(path);
            reads.set(path, readFile(join(srcDir, path), 'utf8'));
        }
        else if (/(?:^|\/)\.\.\.$/.test(item)) {
            const dir = item.substr(0, item.length - 4);
            ordered.add(dir);
            fetches.set(
                dir,
                new Promise(setTimeout).then(fetchDir.bind(null, dir))
            );
        }
        else throw Error(`${item} doesn't end with .js or ... in ${orderFile}`);
    });

    // Iterate through sources and output them
    const concat = new Concat(true, 'joy2d.js', '\n');
    for (const item of ordered) {
        if (fetches.has(item)) {
            const fetch = await fetches.get(item);
            for (const itr = fetch.iterate(); await itr();) {
                const path = itr.result;
                const read = reads.get(path);
                const code = await read;
                include({ file: path, code });
            }
        }
        else {
            const read = reads.get(item);
            const code = await read;
            include({ file: item, code });
        }
    }

});

const buildUncompressed = async (sourcesFetch, license, dirCreation) => {
    const concat = new Concat(true, 'joy2d.js', '\n');
    concat.add(null, `${license}\n`);
    for (const itr = sourcesFetch.iterate(); await itr();) {
        const { file, code } = itr.result;
        concat.add(file, code);
    }
    await dirCreation;
    await Promise.all([
        writeFile(uncompressedBuild, concat.content),
        writeFile(uncompressedBuildMap, concat.sourceMap)
    ]);
};

const buildMinified = async (sourcesFetch, license, dirCreation) => {
    const concat = new Concat(true, 'joy2d.min.js');
    concat.add(null, `${license}\n`);
    for (const itr = sourcesFetch.iterate(); await itr();) {
        const { file, code } = itr.result;
        const result = transform(code, {
            filenameRelative: file,
            presets: ['babili'],
            sourceMaps: true,
            comments: false
        });
        concat.add(file, result.code, result.map);
    }
    await dirCreation;
    await Promise.all([
        writeFile(minifiedBuild, concat.content),
        writeFile(minifiedBuildMap, concat.sourceMap)
    ]);
};

const build = async () => {
    console.log('Building');
    const dirRemoval = rmfr(buildDir);
    const dirCreation = dirRemoval.then(mkdir.bind(null, buildDir));
    const sourcesFetch = fetchSources();
    const licenseRead = readFile(licenseFile, 'utf8');
    const packageRead = readFile(packageFile, 'utf8');
    const { version } = JSON.parse(await packageRead);
    const header = `\nJOY2D ${version}\n\n`;
    const licenseBody = header + await licenseRead;
    const license = licenseBody.split('\n').map(s => `// ${s}`).join('\n');
    await Promise.all([
        buildUncompressed(
            sourcesFetch,
            license,
            dirCreation.then(mkdir.bind(null, uncompressedBuildDir))
        ),
        buildMinified(
            sourcesFetch,
            license,
            dirCreation.then(mkdir.bind(null, minifiedBuildDir))
        )
    ]);
    console.log('Build completed');
};

module.exports = build;
