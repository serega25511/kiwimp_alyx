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
	//path.join(serverpathdir, "gamemodeprops.lua"),
];

/*
if(!fs.existsSync(serverpathdir)) {
	console.log("["+header+"] One or more vscript files are missing! Double check config.json.");
	process.exit(1);
};
*/

module.exports = {
	updateConfig: (getconfig, client) => {
		if(client) {
			// Updatable lua files.
			const newclientlua = fs.readFileSync("./lua/client.lua", 'utf8');
			fs.writeFileSync(path.join(path.normalize(config.servervscriptdir), "client.lua"), newclientlua, 'utf8');
			const newdamagelua = fs.readFileSync("./lua/damage.lua", 'utf8');
			fs.writeFileSync(path.join(path.normalize(config.servervscriptdir), "damage.lua"), newdamagelua, 'utf8');
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
	initVConsole: (hub, version,headerClient,username,authid) => {
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
					//if(args[0] != "POS" && args[0] != "ANG" && args[0] != "HEADPOS") console.log("["+header+"] VConsole: "+args);
					if(args[0] == ("POS")) { // The position at the player's feet (origin).
						localPlayer.action = "move";
						localPlayer.x = parseFloat(args[1]);
						localPlayer.y = parseFloat(args[2]);
						localPlayer.z = parseFloat(args[3]);
					} else if(args[0] == ("ANG")) { // The player's rotation.
						localPlayer.action = "move";
						localPlayer.pitch= parseFloat(args[1]);
						localPlayer.yaw= parseFloat(args[2]);
						localPlayer.roll= parseFloat(args[3]);
					} else if(args[0] == ("HEADPOS")) { // The center of the player's head.
						localPlayer.action = "move";
						localPlayer.headX = parseFloat(args[1]);
						localPlayer.headY = parseFloat(args[2]);
						localPlayer.headZ = parseFloat(args[3]);
					} else if(args[0] == ("LHANDPOS")) { // The center of the player's left hand.
						localPlayer.action = "move";
						localPlayer.leftHandX= parseFloat(args[1]);
						localPlayer.leftHandY= parseFloat(args[2]);
						localPlayer.leftHandZ= parseFloat(args[3]);
					} else if(args[0] == ("LHANDANG")) { // The player's left hand rotation.
						localPlayer.action = "move";
						localPlayer.leftHandPitch= parseFloat(args[1]);
						localPlayer.leftHandYaw= parseFloat(args[2]);
						localPlayer.leftHandRoll= parseFloat(args[3]);
					} else if(args[0] == ("RHANDPOS")) { // The center of the player's right hand.
						localPlayer.action = "move";
						localPlayer.rightHandX= parseFloat(args[1]);
						localPlayer.rightHandY= parseFloat(args[2]);
						localPlayer.rightHandZ= parseFloat(args[3]);
					} else if(args[0] == ("RHANDANG")) { // The player's right hand rotation.
						localPlayer.action = "move";
						localPlayer.rightHandPitch= parseFloat(args[1]);
						localPlayer.rightHandYaw= parseFloat(args[2]);
						localPlayer.rightHandRoll= parseFloat(args[3]);
					} else if(args[0] == ("DMG")) { // Who the player is dealing damage to.
						var damage = parseInt(args[1]);
						if(damage > 0 && damage < 100) {
							localPlayer.action = "damage";
							localPlayer.victimDamage = damage;
							localPlayer.victimIndex = parseInt(args[2]);
						}
					} else if(args[0] == ("GMA")) { // If the player is calling the gamemode action.
						args.shift();
						localPlayer.action = "gamemode-action";
						localPlayer.gamemodeArgs = args;
					}
				}
			} catch (e) {
				// It's shaky working with VConsole, so let's just ignore it.
			}
		});
		client.on('close', function() {
			console.log('['+header+'] VConsole connection closed. Did Half-Life: Alyx close? Process can not continue, exiting...');
			process.exit(1);
		});
		client.on('error', function(err) {
			console.log('['+header+'] VConsole connection error: '+err+'. Is Half-Life: Alyx running? Process can not continue, exiting...');
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
			//`Msg("");\n`, // Gamemode properties.
		];
		for(i = 0; i < userSlots.length; i++) {
			const user = userSlots[i];
			if(!user) continue; // ???
			// Clientside stuff
			if(user.username == player.username) {
				// Local player gamemode properties
				luaStrings[0] += gamemode.getLocalGamemodeProperties(users, i);
				if(config.showhud) { // Server has HUD enabled.
					// Get directional vectors based on the player's angles.
					const directionX = Math.cos(player.yaw * (Math.PI / 180));
					const directionY = Math.sin(player.yaw * (Math.PI / 180));
					const directionZ = Math.cos((player.pitch + 90) * (Math.PI / 180));
					// Place the HUD in front of the head with offsets that orbit around the player.
					var hudX = user.headX + directionX * config.globalhudscale;
					var hudY = user.headY + directionY * config.globalhudscale;
					var hudZ = user.headZ + directionZ * config.globalhudscale;
					luaStrings[2] += `EntityGroup[${i+1}]:SetOrigin(Vector(${hudX},${hudY},${hudZ}));
EntityGroup[${i+1}]:SetAngles(0,${user.yaw-90},90);
DoEntFire(EntityGroup[${i+1}]:GetName(), "SetMessage", "${user.hud}", 0.0, self, self);\n`
				};
				// Show health on the actual hud.
				if(user.health > 0) {
					luaStrings[0] += `Entities:GetLocalPlayer():SetHealth(${user.health});\n`;
				};
				// Player is teleporting, so we need to update the position.
				if(user.teleportX != 0 || user.teleportY != 0 || user.teleportZ != 0) {
					luaStrings[0] += `Entities:GetLocalPlayer():SetOrigin(Vector(${user.teleportX},${user.teleportY},${user.teleportZ}));\n`;
				};
				// Player heads
				if(config.showheadsets && user.showHeadsetLocally) { // Don't show the player's headset if it's disabled either by the server or the player.
					luaStrings[0] += `EntityGroup[${i+1}]:SetOrigin(Vector(${user.headX},${user.headY},${user.headZ}));
EntityGroup[${i+1}]:SetAngles(${user.pitch},${user.yaw},${user.roll});\n`;
				};
			}
			if(user.username == player.username) continue; // Don't update the player for the client anymore.
			luaStrings[0] += `EntityGroup[${i+1}]:SetOrigin(Vector(${user.headX},${user.headY},${user.headZ}));
EntityGroup[${i+1}]:SetAngles(${user.pitch},${user.yaw},${user.roll});\n`;
			// NPCs
			if(config.npccollision == true) luaStrings[1] += `EntityGroup[${i+1}]:SetOrigin(Vector(${user.x},${user.y},${user.z}));\n`;
			// Name tags
			luaStrings[2] += `EntityGroup[${i+1}]:SetOrigin(Vector(${user.headX},${user.headY},${user.headZ+10}));
EntityGroup[${i+1}]:SetAngles(0,${user.yaw+90},90);
DoEntFire(EntityGroup[${i+1}]:GetName(), "SetMessage", "${user.username} : ${user.health}/100${user.score > 0 ? ` : ${user.score}` : ``}", 0.0, self, self);\n`
			// Player left hands
			luaStrings[3] += `EntityGroup[${i+1}]:SetOrigin(Vector(${user.leftHandX},${user.leftHandY},${user.leftHandZ}));
EntityGroup[${i+1}]:SetAngles(${user.leftHandPitch},${user.leftHandYaw},${user.leftHandRoll});\n`
			// Player right hands
			luaStrings[4] += `EntityGroup[${i+1}]:SetOrigin(Vector(${user.rightHandX},${user.rightHandY},${user.rightHandZ}));
EntityGroup[${i+1}]:SetAngles(${user.leftHandPitch},${user.leftHandYaw},${user.leftHandRoll});\n`
			// Gamemode properties
			luaStrings[1] += gamemode.getGamemodeProperties(users, i);
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