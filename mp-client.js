var header = "alyx-client"; // NoobHub header for the client. This means nothing (we identify clients) but it's a good way to identify client connections.
const authid = Date.now(); // This will get assigned to the username by the server and will be used to identify the user.
const vscript = require("./vscript"); // This is how we can write to the script that will be ran by the game.
const fs = require("fs"); // We need to use the fs module to read the script.
const path = require("path"); // This is how we can get the path of the current file.
var authorized = false;
var pinged = false;
var freemode = false; // Used to determine whether or not we should accept actions from other clients. (do *not* send authids to other clients)
//var lastmove = {x: 0, y: 0, z: 0, pitch: 0, yaw: 0, roll: 0}; // Used to determine whether or not we should send movement to the server and if we should print it out.
//var moveok = true;
var index = 0;
var lastoutput = 0;

module.exports = (config, package, gamemode) => {
	header = header+"-"+config.channel;
	const noobhub = require('./noobhub/client');
	const hub = noobhub.new(config);
	var subconf = {
		callback: (data) => {
			if(!data.version && !data.action && !data.from && !data.username && !data.authid && !data.timestamp) return; // Why would you send a message without these?
			if(data.from == header) return; // This is a client.
			// auth-ok is here because we want to show join messages.
			if(data.action == "auth-ok") {
				if(data.username == config.username && data.authid != authid) {
					console.log("["+header+"] Client "+data.username+" has joined your game, but you are already connected? This should not happen! The process can not continue, exiting...");
					process.exit(1);
				} else if(data.username != config.username && data.authid != authid) {
					console.log("["+header+"] Client "+data.username+" has joined your game.");
				} else {
					console.log('['+header+'] Authorization OK. Starting client routine...');
					authorized = true;
					index = data.index;
					vscript.initVConsole(hub,package.version,header,config.username,authid);
					if(config.dedicated) return; // Dedicated servers shouldn't time out.
					setInterval(() => {
						// Check if the server is unresponsive.
						if(lastoutput < Date.now()-config.pingtimeout-10000) { // If the server has not sent any data in 10 seconds, we assume it is unresponsive.
							console.log('['+header+'] Server is unresponsive. Exiting...');
							process.exit(1);
						};
						const player = vscript.updatePlayer(config.username, authid, index);
						hub.publish({ // Handles movement, gamemode actions, and damage votes.
							version: package.version,
							from: header,
							username: config.username,
							authid: authid,
							action: player.action,
							player: player,
							timestamp: Date.now()
						});
					}, config.pinginterval);
				}
			// force-logout is here because we want to show leave messages.
			} else if(data.action == "force-logout") {
				if(data.username == config.username && data.authid != authid) {
					console.log("["+header+"] Client "+data.username+" has left your game, but you are still connected? This should not happen! The process can not continue, exiting...");
					process.exit(1);
				} else if(data.username != config.username && data.authid != authid) {
					console.log("["+header+"] Client "+data.username+" has left your game.");
				} else {
					console.log('['+header+'] The server has requested your client to log out. This most likely means that you timed out, but you might have logged out yourself. Exiting...');
					process.exit(0);
				};
			};
			if(data.username != config.username) return; // This is not the intended user.
			if(data.authid != authid) return; // Authid mismatch despite the username match. (malicious use of the username)
			if(data.version != package.version) { // Version mismatch.
				return config.verbose ? console.log('['+header+'] Client version mismatch. Expected: ' + package.version + ' Got: ' + data.version) : console.log('['+header+'] Client version mismatch. Expected: ' + package.version + ' Got: ' + data.version);
			}
			lastoutput = Date.now();
			//config.verbose ? console.log('['+header+'] Received data from '+data.from+'.', data) : console.log('['+header+'] Received data from '+data.from+'.');
            if(data.action == "pong") {
				if(authorized) return; // If the user is authorized already, we don't need to do anything. This could result in bad actors relogging clients.
                console.log('['+header+'] The server has responded, printing status and authenticating...');
				console.log('['+header+'] This server is named '+data.hostname+'.')
				console.log('['+header+'] This server is running on version '+data.version+'.')
				console.log('['+header+'] '+data.players+'/'+data.maxplayers+' players are connected.')
				console.log('['+header+'] This server is a '+(data.dedicated ? 'dedicated' : 'listen')+' server.')
				console.log('['+header+'] The server is running as IP address '+data.ip+":"+data.port+'.  (may not be accurate!)')
				console.log('['+header+'] The server is running on channel '+data.channel+'.')
				console.log('['+header+'] The server is owned by '+data.owner+'.')
				console.log('['+header+'] The server is running in '+(data.freemode ? 'free' : 'relay')+' mode.')
				console.log('['+header+'] The server is running with verbose mode '+(data.verbose ? 'enabled' : 'disabled')+'.')
				console.log('['+header+'] The server is on map '+data.map+'. (may not be accurate!)')
				console.log('['+header+'] This server is playing '+(data.gamemodeprint ? data.gamemodeprint : data.gamemode)+'.')
				console.log('['+header+'] '+(data.gamemodeprint ? data.gamemodeprint : data.gamemode)+(data.gamemodeauthor ? ' by '+data.gamemodeauthor : '')+': '+data.description)
				freemode = data.freemode; // Actions from other clients are trusted on this server.
				if(!config.clientdisallowgamemodes) { // Install gamemode.
					console.log('['+header+'] Installing gamemode... (Enabled by client.)')
					const newgamemodelua = data.gamemodelua;
					fs.writeFileSync(path.join(path.normalize(config.servervscriptdir), "gamemode.lua"), newgamemodelua, 'utf8');
				}
				if(!config.clientdisallowvscripts) { // Install custom vscripts.
					console.log('['+header+'] Installing custom vscripts... (Enabled by client.)')
					for (let i = 0; i < data.vscripts.length; i++) {
						const newvscript = fs.readFileSync(data.vscripts[i], 'utf8');
						fs.writeFileSync(path.join(path.normalize(config.servervscriptdir), "vscript"+i+".lua"), newvscript, 'utf8');
					}
				}
				pinged = true;
				hub.publish({
					version: package.version,
					from: header,
					username: config.username,
					password: config.password,
					showmyheadset: config.clientshowmyheadset,
					authid: authid,
					action: "auth",
					timestamp: Date.now()
				});
				setTimeout(() => {
					if(!authorized) {
						console.log('['+header+'] Could not authenticate. Exiting...');
						process.exit(1);
					}
				}, config.pingtimeout*2);
			} else if(data.action == "auth-fail") {
				console.log('['+header+'] Authorization failed. The username may be taken, or the password is wrong.');
				process.exit(1);
			} else if(data.action == "move-success") {
				//var thismove = {x: data.x, y: data.y, z: data.z, pitch: data.pitch, yaw: data.yaw, roll: data.roll};
				//if(thismove != lastmove) {
					//if(thismove.x == 0 && thismove.y == 0 && thismove.z == 0 && thismove.pitch == 0 && thismove.yaw == 0 && thismove.roll == 0)
						//return; // Don't print out empty moves.
					if(config.printmovesuccess) console.log('['+header+'] Move success. X='+data.x+' Y='+data.y+' Z='+data.z+' Pitch='+data.pitch+' Yaw='+data.yaw+' Roll='+data.roll+'.');
					//lastmove = thismove;
				//}
				vscript.updateClient(data.lua);
				//moveok = true;
			} else {
				//config.verbose ? console.log('['+header+'] Unknown action "'+data.action+'", possible client/server mismatch?', data) : console.log('['+header+'] Unknown action, possible client/server mismatch?');
			}
		},
		// Let's let the server know we're here.
		subscribedCallback: () => {
            console.log('['+header+'] Subscribed. Pinging server...');
			hub.publish({
				version: package.version,
                from: header,
				username: config.username,
				authid: authid,
                action: "ping",
                timestamp: Date.now()
            });
			setTimeout(() => {
				if(!pinged) {
					console.log('['+header+'] Could not ping server. Trying again...');
					hub.publish({
						version: package.version,
						from: header,
						username: config.username,
						authid: authid,
						action: "ping",
						timestamp: Date.now()
					});
					setTimeout(() => {
						if(!pinged) {
							console.log('['+header+'] Could not ping server. Exiting...');
							process.exit(1);
						}
					}, config.pingtimeout);
				}
			}, config.pingtimeout);
        },
		errorCallback: (err) => {
			config.verbose ? console.log('['+header+'] An error has occured. The process can not continue, exiting...', err) : console.log('['+header+'] An error has occured. The process can not continue, exiting...');
			process.exit(1);
		}
	}
	vscript.updateConfig(config, true);
	subconf = Object.assign(subconf, config);

	// Some node.js magic to make sure we can exit cleanly.

	process.stdin.resume();

	var logout = 0;

	function exitHandler(options, exitCode) {
		if (options.exit || logout >= 3) process.exit();
		if (options.cleanup && logout < 3) {
			console.log("["+header+"] Sending a logout request before closing... (Attempt "+(logout+1)+" of 3)");
			for(i = 0; i <= 5; i++) { // Make sure we send the logout request.
				hub.publish({
					version: package.version,
					action: "logout",
					from: header,
					username: config.username,
					authid: authid,
					timestamp: Date.now()
				});
			};
			logout++;
		}
	}

	process.on('exit', exitHandler.bind(null,{exit:true}));
	process.on('SIGINT', exitHandler.bind(null, {cleanup:true}));
	process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
	process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
	process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

	hub.subscribe(subconf);
	return hub;
};