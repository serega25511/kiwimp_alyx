const fs = require('fs');
const configloc = "./config.json";
const packageloc = "./package.json";
const package = fs.existsSync(packageloc) ? JSON.parse(fs.readFileSync(packageloc)) : {};
var config = fs.existsSync(configloc) ? JSON.parse(fs.readFileSync(configloc)) : {};
const gamemode = require("./gamemodes/"+(config.gamemode || "base"));

const header = "alyx-handler-"+config.channel;

// Start the server only if we're not connecting to a remote server
if(config.server == "localhost" || config.dedicated) {
	require('./noobhub/server');
	require("./mp-server")(config, package, gamemode);
}

// Set up client networking only if we aren't a dedicated server
if(!config.dedicated) {
	client = require("./mp-client")(config, package, gamemode);
}
