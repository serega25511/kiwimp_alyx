var header = "alyx-server"; // NoobHub header for the server. This is used by clients to know that the server sent the message.
const users = require("./users");
const vscript = require("./vscript"); // This is how we can write to the script that will be ran by the game.
var damagetable = [];
var lastmoves = [];
var lastmoveintervals = [];
const fs = require("fs");

module.exports = (config, package, gamemode) => {
	header = header+"-"+config.channel;
	const noobhub = require('./noobhub/client');
	const hub = noobhub.new(config);
	var subconf = {
		callback: (data) => {
			if(data.from == header) return; // Ignore messages from the server.
			const username = data.username
			const authid = data.authid
			if(!username || !authid) return; // Why would you send a message without a username or authid?
			//if(data.username == "MrRagtime") console.log(data.action);
			//config.verbose ? console.log('['+header+'] Received data from '+data.from+'.', data) : console.log('['+header+'] Received data from '+data.from+'.');
			if(data.action == "ping") {
				// We don't ignore version information for pings.
				// But we'll send it over to the client so they are aware.
				//const index = users.getIndexByUsername(username);
				//if(index !== false) return; // This state should never be reached, but just in case
				hub.publish({
					version: package.version,
					username: username,
					authid: authid,
					from: header,
					map: config.map,
					maxplayers: config.maxplayers,
					players: users.getOnlineUsers(),
					dedicated: config.dedicated,
					port: config.port,
					ip: config.publicip,
					channel: config.channel,
					owner: config.username,
					verbose: config.verbose,
					freemode: config.freemode,
					hostname: config.hostname,
					gamemode: gamemode.gamemode || "",
					gamemodelua: fs.readFileSync("./gamemodes/lua/"+config.gamemode+".lua", "utf8"),
					gamemodeprint: gamemode.name || "",
					description: gamemode.description || "",
					vscripts: config.vscripts,
					action: "pong",
					timestamp: Date.now(),
				});
			} else if(data.action == "logout") {
				// We don't ignore version information for logging out.
				// But we'll send it over to the client so they are aware.
				const index = users.getIndexByUsername(username);
				if(index !== false) return; // By this point, the user should be logged in. If they aren't, we ignore the message.
				if(users.logOut(index)) {
					console.log('['+header+'] '+username+' has logged out.');
					hub.publish({
						version: package.version,
						username: username,
						authid: authid,
						from: header,
						action: "force-logout",
						timestamp: Date.now(),
					});
					const index = users.getIndexByUsername(username);
					clearInterval(lastmoveintervals[index]);
					lastmoveintervals.splice(index, 1);
				};
			} else if(data.action == "auth") {
				if(data.version != package.version) return; // If the version is not the same, ignore the message.
				const password = data.password
				if(!password && config.password != "") return; // Skip if the password is incorrect, but only if the password is set.
				const index = users.getIndexByUsername(username);
				if(index !== false) {
					console.log('['+header+'] '+username+' is already logged in.');
					hub.publish({
						index: index,
						version: package.version,
						username: username,
						authid: authid,
						from: header,
						action: "auth-fail",
						timestamp: Date.now()
					});
				}
				if(password == config.password) {
					console.log('['+header+'] '+username+' is authenticating...');
					if (users.newUser(username, authid)) {
						console.log('['+header+'] '+username+' has authenticated. '+users.getOnlineUsers()+'/'+config.maxplayers+' players online.');
						hub.publish({
							version: package.version,
							username: username,
							authid: authid,
							from: header,
							action: "auth-ok",
							timestamp: Date.now()
						});
						if(config.username == username)
							return; // If the username is the same as the owner, we don't need to do anything else.
						const index = users.getIndexByUsername(username);
						if(index === false) return; // If the index is false, the player is not in the list.
						lastmoveintervals[index] = setInterval(() => {
							// Check if the player is unresponsive...
							if(lastmoves[index] < Date.now()-config.servertimeout/2) {
								if(users.logOut(index)) {
									console.log('['+header+'] '+username+' has timed out.');
									hub.publish({
										version: package.version,
										username: username,
										authid: authid,
										from: header,
										action: "force-logout",
										timestamp: Date.now()
									});
									clearInterval(lastmoveintervals[index]);
									lastmoveintervals.splice(index, 1);
								};
							};
						}, config.servertimeout);
					} else {
						console.log('['+header+'] '+username+' failed to create a user.');
						//users.logOut(index);
						hub.publish({
							version: package.version,
							username: username,
							authid: authid,
							from: header,
							action: "auth-fail",
							timestamp: Date.now()
						});
					};
				// At this point, this user will not recieve any more messages after this as their slot does not exist.
				} else {
					console.log('['+header+'] '+username+' failed to authenticate.');
					hub.publish({
						version: package.version,
						username: username,
						authid: authid,
						from: header,
						action: "auth-fail",
						timestamp: Date.now()
					});
				}
			// Player movement.
			} else if(data.action == "move") {
				if(data.version != package.version) return; // If the version is not the same, ignore the message.
				const player = data.player;
				const index = users.getIndexByUsername(username);
				if(index === false) return; // If the index is false, the player is not in the list.
				if(users.move(index, player)) {
					lastmoves[index] = Date.now();
					setTimeout(() => {
						hub.publish({
							version: package.version,
							username: username,
							authid: authid,
							from: header,
							lua: vscript.updateServer(users, player, gamemode),
							// These coordinates are just for convenience.
							x: player.x,
							y: player.y,
							z: player.z,
							pitch: player.pitch,
							yaw: player.yaw,
							roll: player.roll,
							action: "move-success",
							timestamp: Date.now()
						});
					}, config.serverinterval); // This is so that servers don't get overloaded with move messages.
				};
			// We don't want to directly deal damage unless the majority of clients agree with the damage amont.
			} else if(data.action == "damage-vote") {
				if(data.version != package.version) return; // If the version is not the same, ignore the message.
				const index = users.getIndexByUsername(username);
				if(index === false) return; // If the index is false, the player is not in the list.
				const victim = users.getUsers()[data.player.victimIndex-1]; // Minus 1 because the index starts at 0.
				if(victim) {
					if(victim.username == username) return; // Don't allow the user to vote for themselves.
					var actualdamage = data.player.victimDamage;
					if(actualdamage <= 0) return; // If the damage is less than or equal to 0, this doesn't make sense.
					console.log('['+header+'] Starting damage vote from '+username+' to '+victim.username+' for '+actualdamage+' damage.');
					// Set damage to exactly enough to kill the user if the damage will make their health out of bounds.
					if(victim.health-actualdamage <= 0) actualdamage = victim.health;
					if(damagetable[victim] === undefined) {
						damagetable[victim] = {
							damage: actualdamage,
							votes: 1,
						};
					};
					if(actualdamage == damagetable[victim].damage) {
						console.log('['+header+'] '+username+' has successfully voted to deal '+actualdamage+' damage to '+victim.username+'.');
						damagetable[victim].votes++;
					} else {
						console.log('['+header+'] Discarding '+username+'\'s vote to deal '+actualdamage+' damage to '+victim.username+'.');
					};
					if(damagetable[victim].votes >= Math.floor(users.getOnlineUsers()/2)-1) {
						console.log('['+header+'] *** Damage vote has passed. '+victim.username+' will be set to '+(victim.health-actualdamage)+' health.');
						if(!users.damage(victim.username, actualdamage))
							console.log('['+header+'] !!! Something went SERIOUSLY wrong. The damage was not applied.');
						damagetable.splice(victim, 1);
					}
				};
			} else if(data.action == "gamemode-action") {
				if(data.version != package.version) return; // If the version is not the same, ignore the message.
				const index = users.getIndexByUsername(username);
				if(index === false) return; // If the index is false, the player is not in the list.
				gamemode.playerAction(data, hub, users, index, users.getUsers[index]);
			} else {
				//config.verbose ? console.log('['+header+'] Unknown action from '+username+': "'+data.action+'", possible client/server mismatch?', data) : console.log('['+header+'] Unknown action from '+username+': "'+data.action+'", possible client/server mismatch?');
			};
		},
		subscribedCallback: () => {
			console.log('['+header+'] Subscribed. Waiting for clients...');
			config = gamemode.initialize(hub, users);
		},
		errorCallback: (err) => {
			config.verbose ? console.log('['+header+'] An error has occured.', err) : console.log('['+header+'] An error has occured.');
			process.exit(1);
		}
	}
	vscript.updateConfig(config, false);
	subconf = Object.assign(subconf, config);
	hub.subscribe(subconf);
};