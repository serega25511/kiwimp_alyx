const fs = require('fs');
const path = require("path");
const configloc = "./config.json";
var config = fs.existsSync(configloc) ? JSON.parse(fs.readFileSync(configloc)) : {};
const header = "alyx-gamemode-"+config.channel;

module.exports = {
    name: "Base",
    description: "The base gamemode.",
    fs: fs,
    path: path,
    config: config,
    header: header,
}
