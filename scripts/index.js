const [,,command, ...args] = process.argv;

require(`./${command}`)(...args).catch((err) => {
    console.log(`\n${command[0].toUpperCase()}${command.substr(1)} failed\n`);
    console.log(err);
});
