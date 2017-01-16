const { app, BrowserWindow }     = require('electron');
const { resolve, join, dirname } = require('path');

const { readFile }   = require('mz/fs');
const { Base64 }     = require('js-base64');

app.on('ready', () => {

    const win = new BrowserWindow({ show: false });

    //const testFile = process.env.TEST_FILE;
    const testFile = '/mnt/sdc1/Works/Projects/Software/JOY2D/002/source/main/test.js';
    //const { requires = [] } = JSON.parse(process.env.TEST_CONFIG);
    const { requires = [] } = { 'requires': ['/mnt/sdc1/Works/Projects/Software/JOY2D/002/build/minified/joy2d.min.js'] };
    const files = [...requires, testFile];
    const reads = files.map((file) => readFile(file));

    let html = '<!DOCTYPE html>\n<html>\n\t<head></head>\n\t<body>';
    (function f(i) {
        if (i === reads.length) return;
        const file = files[i];
        const read = reads[i];
        read.then((js) => {
            html += `\t\t<script>\n${js}\n//# sourceURL=${file}\n\t\t</script>`;
            html += '\n';
            f(i + 1);
        });
    })(0);

    Promise.all(reads).then(() => new Promise(setTimeout)).then(() => {

        html += '\t</body>\n</html>';

        win.loadURL(`data:text/html;base64,${Base64.encode(html)}`);
        win.webContents.openDevTools();

    }).catch((err) => {

        process.stderr.write(err.stack);
        process.stderr.write('\n');
        process.exit(-1);

    });

});
