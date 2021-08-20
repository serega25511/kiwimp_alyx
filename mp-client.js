var header = "alyx-client"; // NoobHub header for the client. This means nothing (we identify clients) but it's a good way to identify client connections.
const authid = Date.now(); // This will get assigned to the username by the server and will be used to identify the user.
const vscript = require("./vscript"); // This is how we can write to the script that will be ran by the game.
const fs = require("fs"); // We need to use the fs module to read the script.
const path = require("path"); // This is how we can get the path of the current file.
var authorized = false;
var pinged = false;
var freemode = false; // Used to determine whether or not we should accept actions from other clients. (do *not* send authids to other clients)
var lastmove = {x: 0, y: 0, z: 0, pitch: 0, yaw: 0, roll: 0}; // Used to determine whether or not we should send movement to the server and if we should print it out.
var moveok = true;

module.exports = (config, package, gamemode) => {
	header = header+"-"+config.channel;
	const noobhub = require('./noobhub/client');
	const hub = noobhub.new(config);
	var subconf = {
		callback: (data) => {
			// You should not recieve any of these messages if:
			if(data.from == header) return; // This is a client.
			if(data.username != config.username) return; // This is not the intended user.
			if(data.authid != authid) return; // Authid mismatch despite the username match. (malicious use of the username)
			if(data.version != package.version) { // Version mismatch.
				return config.verbose ? console.log('['+header+'] Client version mismatch. Expected: ' + package.version + ' Got: ' + data.version) : console.log('['+header+'] Client version mismatch. Expected: ' + package.version + ' Got: ' + data.version);
			}
			//config.verbose ? console.log('['+header+'] Received data from '+data.from+'.', data) : console.log('['+header+'] Received data from '+data.from+'.');
            if(data.action == "pong") {
				if(authorized) return; // If the user is authorized already, we don't need to do anything. This could result in bad actors relogging clients.
                console.log('['+header+'] The server has responded, printing status and authenticating...');
				console.log('['+header+'] This server is named '+data.hostname+'.')
				console.log('['+header+'] This server is running on version '+data.version+'.')
				console.log('['+header+'] '+data.players+'/'+data.maxplayers+' players are connected.')
				console.log('['+header+'] This server is a '+(data.dedicated ? 'dedicated' : 'listen')+' server.')
				console.log('['+header+'] The server is running as IP address '+data.ip+":"+data.port+'.')
				console.log('['+header+'] The server is running on channel '+data.channel+'.')
				console.log('['+header+'] The server is owned by '+data.owner+'.')
				console.log('['+header+'] The server is running in '+(data.freemode ? 'free' : 'relay')+' mode.')
				console.log('['+header+'] The server is running with verbose mode '+(data.verbose ? 'enabled' : 'disabled')+'.')
				console.log('['+header+'] The server is on map '+data.map+'. (may not be accurate!)')
				console.log('['+header+'] This server is playing '+(data.gamemodeprint ? data.gamemodeprint : data.gamemode)+'.')
				console.log('['+header+'] '+(data.gamemodeprint ? data.gamemodeprint : data.gamemode)+': '+data.description)
				freemode = data.freemode; // Actions from other clients are trusted on this server.
				if(!config.clientdisallowgamemodes) { // Install gamemode.
					console.log('['+header+'] Installing gamemode... (Enabled by client.)')
					const newgamemodelua = data.gamemodelua;
					fs.writeFileSync(path.join(path.dirname(config.clientvscript), "gamemode.lua"), newgamemodelua, 'utf8');
				}
				if(!config.clientdisallowvscripts) { // Install custom vscripts.
					console.log('['+header+'] Installing custom vscripts... (Enabled by client.)')
					for (let i = 0; i < data.vscripts.length; i++) {
						const newvscript = fs.readFileSync(data.vscripts[i], 'utf8');
						fs.writeFileSync(path.join(path.dirname(config.clientvscript), "vscript"+i+".lua"), newvscript, 'utf8');
					}
				}
				pinged = true;
				hub.publish({
					version: package.version,
					from: header,
					username: config.username,
					password: config.password,
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
            } else if(data.action == "auth-ok") {
				console.log('['+header+'] Authorization OK. Starting client routine...');
				authorized = true;
				vscript.initVConsole(hub, {
					version: package.version,
					from: header,
					username: config.username,
					authid: authid,
				});
				setInterval(() => {
					//if(!moveok) return; // Only move if the server has confirmed our previous move.
					const player = vscript.updatePlayer(config.username, authid);
					//var thismove = {x: player.x, y: player.y, z: player.z, pitch: player.pitch, yaw: player.yaw, roll: player.roll};
					//if(thismove != lastmove) {
						//if(thismove.x == 0 && thismove.y == 0 && thismove.z == 0 && thismove.pitch == 0 && thismove.yaw == 0 && thismove.roll == 0)
							//return; // Don't print out empty moves.
						//lastmove = thismove;
						hub.publish({
							version: package.version,
							from: header,
							username: config.username,
							authid: authid,
							action: "move",
							player: player
						});
						//moveok = false;
					//}
				}, config.pinginterval);
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
			} else if(authorized && data.action == "force-logout") {
				console.log('['+header+'] The server has requested your client to log out. If you have sent a log out request, this means it is now safe to leave. Exiting...');
				process.exit(0);
			} else {
				config.verbose ? console.log('['+header+'] Unknown action "'+data.action+'", possible client/server mismatch?', data) : console.log('['+header+'] Unknown action, possible client/server mismatch?');
				process.exit(1);
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
			config.verbose ? console.log('['+header+'] An error has occured.', err) : console.log('['+header+'] An error has occured.');
			process.exit(1);
		}
	}
	vscript.updateConfig(config, true);
	subconf = Object.assign(subconf, config);
	hub.subscribe(subconf);
	return hub;
};