const [,,command, ...args] = process.argv;

require(`./${command}`)(...args).then((code) => {
    process.exit(code);
}).catch((err) => {
    console.log(`\n${command[0].toUpperCase()}${command.substr(1)} failed\n`);
    console.log(err);
    process.exit(-1);
});
