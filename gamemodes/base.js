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
    // Called when a client is initialized into the server.
    playerAuthorized: (data, hub, users, index) => {},
    // Called when a client sends the gamemode action. Can be called in-game using vscript, such as Msg("KIWI GMA 1") with an optional parameter (1).
    playerAction: (data, hub, users, index) => {
        hub.publish({
            version: data.version,
            username: data.username,
            authid: data.authid,
            from: header,
            action: "gamemode-action-success",
            timestamp: Date.now()
        });
    },
    // Called when the gamemode is ready to accept clients.
    initialize: (hub, users) => {
        return config; // The config may be overwritten here. (e.g. config.npccollision = false)
    },
}