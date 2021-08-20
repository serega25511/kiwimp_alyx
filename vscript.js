const Player = require('./classes/player');
const fs = require("fs");
const path = require("path");
const configloc = "./config.json";
const lookout = "KIWI"

var localPlayer;
var config = fs.existsSync(configloc) ? JSON.parse(fs.readFileSync(configloc)) : {};
const header = "alyx-vscript-"+config.channel; // NoobHub header for vscript functions.

// Let's get the vscript paths.
const serverpathdir = path.normalize(config.servervscriptdir);
const serverpaths = [
	path.join(serverpathdir, "server.lua"),
	path.join(serverpathdir, "npcs.lua"),
	path.join(serverpathdir, "nametags.lua"),
	path.join(serverpathdir, "lefthands.lua"),
	path.join(serverpathdir, "righthands.lua"),
	path.join(serverpathdir, "gamemodeprops.lua"),
];
const clientpath = path.normalize(config.clientvscript)
/*
if(!fs.existsSync(serverpathdir)) {
	console.log("["+header+"] One or more vscript files are missing! Double check config.json.");
	process.exit(1);
};
*/

var dmg = {};
var dmgkey = false; // we'll check this with === or !==

module.exports = {
	updateConfig: (getconfig, client) => {
		if(client) {
			// Updatable lua files.
			const newclientlua = fs.readFileSync("./lua/client.lua", 'utf8');
			fs.writeFileSync(clientpath, newclientlua, 'utf8');
			const newdamagelua = fs.readFileSync("./lua/damage.lua", 'utf8');
			fs.writeFileSync(path.join(path.dirname(clientpath), "damage.lua"), newdamagelua, 'utf8');
			const blanklua = fs.readFileSync("./lua/blank.lua", 'utf8');
			for(i = 0; i < serverpaths.length; i++) {
				fs.writeFileSync(serverpaths[i], blanklua, 'utf8');
			}
		};
		config = getconfig;
	},
	// Create the local player object.
	updatePlayer: (username, authid) => {
		if (!localPlayer)
			localPlayer = new Player();
		localPlayer.username = username;
		localPlayer.authid = authid;
		return localPlayer;
	},
	initVConsole: (hub, constructor, index) => {
		// VConsole interface, used to pull data without needing to memory spy.
		const net = require('net');
		const client = new net.Socket();
		client.connect(config.vconsoleport, config.vconsoleip, function() {
			console.log('['+header+'] Connected to VConsole.');
		});
		client.on('data', function(data) {
			//console.log('['+header+'] VConsole: '+data);
			data = data.toString();
			// If the data contains the string "KIWI", let's parse it.
			try {
				if(data.indexOf(lookout) != -1) {
					const command = data.slice(data.indexOf(lookout) + lookout.length+1); // Remove the KIWI and the space.
					// If PRNT is found at the end of the string, split until then. This marks the end of the command.
					const args = command.substr(0, command.indexOf("PRNT") != -1 ? command.indexOf("PRNT") : command.length).split(" ");
					if(args[0] == ("POS")) {
						localPlayer.x = parseFloat(args[1]);
						localPlayer.y = parseFloat(args[2]);
						localPlayer.z = parseFloat(args[3]);
					} else if(args[0] == ("ANG")) {
						localPlayer.pitch= parseFloat(args[1]);
						localPlayer.yaw= parseFloat(args[2]);
						localPlayer.roll= parseFloat(args[3]);
					} else if(args[0] == ("HEADPOS")) {
						localPlayer.headX = parseFloat(args[1]);
						localPlayer.headY = parseFloat(args[2]);
						localPlayer.headZ = parseFloat(args[3]);
					} else if(args[0] == ("LHANDPOS")) {
						localPlayer.leftHandX= parseFloat(args[1]);
						localPlayer.leftHandY= parseFloat(args[2]);
						localPlayer.leftHandZ= parseFloat(args[3]);
					} else if(args[0] == ("LHANDANG")) {
						localPlayer.leftHandPitch= parseFloat(args[1]);
						localPlayer.leftHandYaw= parseFloat(args[2]);
						localPlayer.leftHandRoll= parseFloat(args[3]);
					} else if(args[0] == ("RHANDPOS")) {
						localPlayer.rightHandX= parseFloat(args[1]);
						localPlayer.rightHandY= parseFloat(args[2]);
						localPlayer.rightHandZ= parseFloat(args[3]);
					} else if(args[0] == ("RHANDANG")) {
						localPlayer.rightHandPitch= parseFloat(args[1]);
						localPlayer.rightHandYaw= parseFloat(args[2]);
						localPlayer.rightHandRoll= parseFloat(args[3]);
					} else if(args[0].includes("DMGSTART")) {
						dmg = {};
					} else if(args[0].includes("DMGKEY")) {
						const tempdmg = parseInt(args[1])-1; // -1 because we're using 1-based indexing from Lua.
						dmgkey = tempdmg;
						// If the dmgkey is the same as the index, this is the local player so we should not send it.
					} else if(args[0].includes("DMG")) {
						dmg[dmgkey] = parseFloat(args[1]);
					} else if(args[0].includes("DMGEND")) {
						hub.publish(Object.apply(constructor, {
							action: "damage-vote",
							damage: dmg,
							victim: dmgkey,
						}));
					} else if(args[0].includes("GMA")) {
						args.shift();
						hub.publish(Object.apply(constructor, {
							action: "gamemode-action",
							args: args,
						}));
					}
				}
			} catch (e) {
				// It's shaky working with VConsole, so let's just ignore it.
			}
		});
		client.on('close', function() {
			console.log('['+header+'] VConsole connection closed. Process can not continue, exiting...');
			process.exit(1);
		});
		client.on('error', function(err) {
			console.log('['+header+'] VConsole connection error: '+err);
			process.exit(1);
		});
	},
	updateServer: (users, player, gamemode) => {
		const userSlots = users.getUsers();
		var luaStrings = [
			`Msg("");\n`, // Player heads.
			`Msg("");\n`, // Player NPCS.
			`Msg("");\n`, // Player names.
			`Msg("");\n`, // Player left hands.
			`Msg("");\n`, // Player right hands.
			`Msg("");\n`, // Gamemode properties.
		];
		var user;
		for(i = 0; i < userSlots.length; i++) {
			user = userSlots[i];
			if(!user) continue; // ???
			// Player heads
			luaStrings[0] += `EntityGroup[${i+1}]:SetOrigin(Vector(${user.headX},${user.headY},${user.headZ}));
EntityGroup[${i+1}]:SetAngles(${user.pitch},${user.yaw},${user.roll});\n`
			if(user.username == player.username) continue; // Don't update the player for the client anymore.
			// NPCs
			if(config.npccollision == true) {
				luaStrings[1] += `EntityGroup[${i+1}]:SetOrigin(Vector(${user.x},${user.y},${user.z}));\n`
			}
			// Name tags
			luaStrings[2] += `EntityGroup[${i+1}]:SetOrigin(Vector(${user.headX},${user.headY},${user.headZ+10}));
EntityGroup[${i+1}]:SetAngles(0,${user.yaw+90},90);
DoEntFire(EntityGroup[${i+1}]:GetName(), "SetMessage", "${user.username} : ${user.health}/100", 0.0, self, self);\n`
			// Player left hands
			luaStrings[3] += `EntityGroup[${i+1}]:SetOrigin(Vector(${user.leftHandX},${user.leftHandY},${user.leftHandZ}));
EntityGroup[${i+1}]:SetAngles(${user.leftHandPitch},${user.leftHandYaw},${user.leftHandRoll});\n`
			// Player right hands
			luaStrings[4] += `EntityGroup[${i+1}]:SetOrigin(Vector(${user.rightHandX},${user.rightHandY},${user.rightHandZ}));
EntityGroup[${i+1}]:SetAngles(${user.leftHandPitch},${user.leftHandYaw},${user.leftHandRoll});\n`
			// Gamemode properties
			luaStrings[5] += gamemode.getGamemodeProperties(user);
		}
		if(config.writeserver) {
			try {
				// files may not be in use, let's write to them
				for(i = 0; i < serverpaths.length; i++) {
					fs.writeFileSync(serverpaths[i], luaStrings[i]);
				}
			} catch (err) {
				// let's just rest here because the files are in use.
			}
		}
		return luaStrings;
	},
	updateClient: (lua) => {
		try {
			// files may not be in use, let's write to them
			for(i = 0; i < serverpaths.length; i++) {
				fs.writeFileSync(serverpaths[i], lua[i]);
			}
		} catch (err) {
			// let's just rest here because the files are in use.
		}
		return lua;
	},
}