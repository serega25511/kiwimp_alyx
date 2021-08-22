var header = "alyx-server"; // NoobHub header for the server. This is used by clients to know that the server sent the message.
const users = require("./users");
const vscript = require("./vscript"); // This is how we can write to the script that will be ran by the game.
var lastmoves = [];
var lastmoveintervals = [];
const fs = require("fs");

function noop() {};

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
					gamemodeauthor: gamemode.author || "",
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
					gamemode.playerDisconnect(data, hub, users, index);
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
					return;
				}
				if(users.getOnlineUsers() > config.maxplayers) { // We don't want to add more users than we can handle.
					hub.publish({
						index: index,
						version: package.version,
						username: username,
						authid: authid,
						from: header,
						action: "auth-fail",
						timestamp: Date.now()
					});
					return;
				};
				if(password == config.password) {
					console.log('['+header+'] '+username+' is authenticating...');
					const player = users.newUser(username, authid);
					if(player !== false) {
						console.log('['+header+'] '+username+' has authenticated. '+users.getOnlineUsers()+'/'+config.maxplayers+' players online.');
						hub.publish({
							version: package.version,
							username: username,
							authid: authid,
							from: header,
							action: "auth-ok",
							timestamp: Date.now()
						});
						// Player doesn't exist yet, so we need to time out before we can initialize the gamemode.
						setTimeout(() => {
							gamemode.playerAuthorized(data, hub, users, player);
						}, 1000);
						if(config.username == username && !config.dedicated)
							return; // If the username is the same as the owner on a listen server, we don't want to time them out.
						lastmoveintervals[index] = setInterval(() => {
							// Check if the player is unresponsive and then force them to log out.
							if(lastmoves[index] < Date.now()-config.servertimeout/2) {
								if(users.logOut(index)) {
									gamemode.playerDisconnect(data, hub, users, index);
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
				if(users.move(index, player, config)) {
					lastmoves[index] = Date.now();
					setTimeout(() => {
						hub.publish({
							version: package.version,
							username: username,
							authid: authid,
							from: header,
							lua: vscript.updateServer(users, player, gamemode),
							action: "move-success",
							timestamp: Date.now()
						});
					}, config.serverinterval); // This is so that servers don't get overloaded with move messages.
				};
			// We don't want to directly deal damage unless the majority of clients agree with the damage amont.
			// *** This actually worked with only two players but I realized that with more than two players, the client will never be able to tell the server who got damaged other than the user the player is damaging directly.
			// Therefore, now we are just firing damage callbacks directly.
			} else if(data.action == "damage") {
				if(data.version != package.version) return; // If the version is not the same, ignore the message.
				const index = users.getIndexByUsername(username);
				if(index === false) return; // If the index is false, the player is not in the list.
				if(data.player.victimIndex-1 == index) return; // Don't allow the user to vote for themselves.
				const player = users.getUsers()[index];
				if(player.teleportX != 0 && player.teleportY != 0 && player.teleportZ != 0) return; // If the player is teleporting, ignore the damage.
				const victim = users.getUsers()[data.player.victimIndex-1]; // Minus 1 because the index starts at 0.
				if(victim) {
					var actualdamage = data.player.victimDamage;
					var dead = false;
					// Set damage to exactly enough to kill the user if the damage will make their health out of bounds.
					if(victim.health-actualdamage <= 0) {
						actualdamage = victim.health;
						dead = true;
					};
					if(actualdamage <= 0) return; // If the damage is less than or equal to 0, this is worthless and we can assume the player is already dead.
					config.verbose ? console.log('['+header+'] Player '+username+' is damaging '+victim.username+' for '+actualdamage+' damage.') : noop();
					if(!users.damage(victim.username, actualdamage)) {
						config.verbose ? console.log('['+header+'] !!! Something went SERIOUSLY wrong. The damage was not applied.') : noop();
					} else {
						gamemode.playerDamage(data, hub, users, data.player.victimIndex-1, actualdamage, index);
						if(dead)
							gamemode.playerKilled(data, hub, users, data.player.victimIndex-1, actualdamage, index);
					};
				};
			} else if(data.action == "gamemode-action") {
				if(data.version != package.version) return; // If the version is not the same, ignore the message.
				const index = users.getIndexByUsername(username);
				if(index === false) return; // If the index is false, the player is not in the list.
				gamemode.playerAction(data, hub, users, index);
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