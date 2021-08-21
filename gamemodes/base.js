const fs = require('fs');
const path = require("path");
const configloc = "./config.json";
var config = fs.existsSync(configloc) ? JSON.parse(fs.readFileSync(configloc)) : {};
const header = "alyx-gamemode-"+config.channel;

module.exports = {
    name: "Base",
    description: "The base gamemode.",
    author: "KiwifruitDev",
    fs: fs,
    path: path,
    config: config,
    header: header,

    // Called when a client sends the gamemode action.
    // Can be called in-game using vscript with optional arguments using the following synxtax:
    // MSG("")
    // Msg("KIWI GMA ARG1 ARG2 ARG3 ...")
    // There may or may not be an argument limit, but it is recommended to keep it low.
    // This is the only way to recieve data from the client and it requires a VScript file to be loaded in a map or map extension.
    playerAction: (data, hub, users, index) => {
        // Use player.gamemodeArgs to get the arguments.
        users.calledGamemodeAction(index); // Reset the gamemode action parameters for the player.
    },
    // Called when the gamemode is ready to accept clients.
    initialize: (hub, users) => {
        return config; // The config may be overwritten here. (e.g. config.npccollision = false)
    },
    
    // Send lua to the client for the gamemode properties.
    // This is a great way to make dynamically updating properties.
    getGamemodeProperties: (user) => {
        return ``;
    },

    // Called when a client is initialized into the server.
    playerAuthorized: (data, hub, users, index) => {},

    // Called when a client disconnects from the server.
    playerDisconnect: (data, hub, users, index) => {},

    // Called when a player is damaged.
    playerDamage: (data, hub, users, index, damage, attacker) => {},

    // Called when a player is killed.
    playerKilled: (data, hub, users, index, damage, attacker) => {},
}
