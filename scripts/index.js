const [,,command, ...args] = process.argv;

require(`./${command}`)(...args).then((code) => {
    process.exit(code);
}).catch((err) => {

    const msg = `
${command[0].toUpperCase()}${command.substr(1)} failed abruptly
`;

    console.log(msg);
    console.log(err);

    process.exit(-1);

});
