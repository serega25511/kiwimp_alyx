/*
    Kiwi's Co-Op Mod for Half-Life: Alyx
    Copyright (c) 2022 KiwifruitDev
    All rights reserved.
    This software is licensed under the MIT License.
    -----------------------------------------------------------------------------
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
    -----------------------------------------------------------------------------
*/

// Modules
import { WebSocketServer } from 'ws';
import { createServer, IncomingMessage } from 'http';
import chalk from 'chalk';
import { Client, Player } from './classes.js';

// Variables
let connections = [];
let slots = {};
let map;

// Exports

/**
 * Creates a player slot.
 * @param {Client} me A client object. 
 * @param {WebSocket} ws A WebSocket object.
 * @returns 
 */
function CreateSlot(me, ws, config) {
    if(!me.player) {
        // Find an empty slot.
        for(let i = 0; i < config.server_max_players; i++) {
            if(slots[i] == false) {
                // Create a new player.
                slots[i] = true;
                me.player = new Player(i);
                return i;
            }
        }
        // No slots left? This should never happen.
        ws.send(JSON.stringify({
            type: 'status',
            message: 'You have been kicked as the server ran out of player slots. Please try again later.'
        }));
        ws.close();
    }
    return 0;
}

/**
 * Start the server.
 * @param {Object} config The configuration object. 
 */
export function StartServer(config) {
    // Populate the slots table.
    for(let i = 0; i < config.server_max_players; i++) {
        slots[i] = false;
    }
    // Create the server.
    const server = createServer();
    const wss = new WebSocketServer({
        noServer: true
    });
    // Handle connections.
    wss.on('connection', (ws, request, me) => {
        // Client connected.
        console.log(chalk.cyan(`[SV] Client connected: ${me.username}`));
        wss.clients.forEach(function each(client) {
            client.send(JSON.stringify({
                type: 'status',
                message: `${me.username} connected.`
            }));
        });
        CreateSlot(me, ws, config);
        // Send memo to the client.
        ws.send(JSON.stringify({
            type: 'status',
            message: config.server_memo
        }));
        // Tell the client to change map.
        ws.send(JSON.stringify({
            type: 'map',
            map: map,
            changelevel: false
        }));
        ws.isAlive = true;
        let index = connections.push(me);
        // Keep the connection alive.
        ws.on('pong', function() {
            this.isAlive = true;
        });
        // Handle messages.
        ws.on('message', function message(data) {
            const message = JSON.parse(data);
            switch(message.type) {
                case 'chat':
                    // Broadcast chat message.
                    wss.clients.forEach(function each(client) {
                        client.send(JSON.stringify({
                            type: 'chat',
                            username: me.username,
                            message: message.message
                        }));
                    });
                    console.log(`[CHAT] ${me.username}: ${message.message}`);
                    break;
                case 'command':
                    // Execute command.
                    switch(message.command) {
                        case 'vc': // Send a command to VConsole.
                            if(message.args.length > 0) {
                                ws.send(JSON.stringify({
                                    type: 'command',
                                    command: message.args.join(' '),
                                }));
                            }
                            break;
                        default:
                            ws.send(JSON.stringify({
                                type: 'status',
                                message: `Unknown command: ${message.command}`
                            }));
                    }
                    break;
                // Movement.
                case "movement":
                    if(me.player && !me.player.dead) {
                        me.player.position.x = message.localPlayer.position.x;
                        me.player.position.y = message.localPlayer.position.y;
                        me.player.position.z = message.localPlayer.position.z;
                        me.player.angles.x = message.localPlayer.angles.x;
                        me.player.angles.y = message.localPlayer.angles.y;
                        me.player.angles.z = message.localPlayer.angles.z;
                        me.player.head.position.x = message.localPlayer.head.position.x;
                        me.player.head.position.y = message.localPlayer.head.position.y;
                        me.player.head.position.z = message.localPlayer.head.position.z;
                        me.player.head.angles.x = message.localPlayer.head.angles.x;
                        me.player.head.angles.y = message.localPlayer.head.angles.y;
                        me.player.head.angles.z = message.localPlayer.head.angles.z;
                        me.player.leftHand.position.x = message.localPlayer.leftHand.position.x;
                        me.player.leftHand.position.y = message.localPlayer.leftHand.position.y;
                        me.player.leftHand.position.z = message.localPlayer.leftHand.position.z;
                        me.player.leftHand.angles.x = message.localPlayer.leftHand.angles.x;
                        me.player.leftHand.angles.y = message.localPlayer.leftHand.angles.y;
                        me.player.leftHand.angles.z = message.localPlayer.leftHand.angles.z;
                        me.player.rightHand.position.x = message.localPlayer.rightHand.position.x;
                        me.player.rightHand.position.y = message.localPlayer.rightHand.position.y;
                        me.player.rightHand.position.z = message.localPlayer.rightHand.position.z;
                        me.player.rightHand.angles.x = message.localPlayer.rightHand.angles.x;
                        me.player.rightHand.angles.y = message.localPlayer.rightHand.angles.y;
                        me.player.rightHand.angles.z = message.localPlayer.rightHand.angles.z;
                        me.player.nameTag.position.x = message.localPlayer.nameTag.position.x;
                        me.player.nameTag.position.y = message.localPlayer.nameTag.position.y;
                        me.player.nameTag.position.z = message.localPlayer.nameTag.position.z;
                        me.player.nameTag.angles.x = message.localPlayer.nameTag.angles.x;
                        me.player.nameTag.angles.y = message.localPlayer.nameTag.angles.y;
                        me.player.nameTag.angles.z = message.localPlayer.nameTag.angles.z;
                        me.player.hudText.position.x = message.localPlayer.hudText.position.x;
                        me.player.hudText.position.y = message.localPlayer.hudText.position.y;
                        me.player.hudText.position.z = message.localPlayer.hudText.position.z;
                        me.player.hudText.angles.x = message.localPlayer.hudText.angles.x;
                        me.player.hudText.angles.y = message.localPlayer.hudText.angles.y;
                        me.player.hudText.angles.z = message.localPlayer.hudText.angles.z;
                        // If the last damage time was more than 2 seconds ago, we're allowed to heal.
                        // This is to prevent the client from healing too fast in case they haven't updated health on their end.
                        if(me.player.lastDamage + 2000 < Date.now() && me.player.health < message.localPlayer.health || me.player.health >= message.localPlayer.health) {
                            me.player.health = message.localPlayer.health;
                        }
                    }
                    break;
                case "damage":
                    if(me.player && !me.player.dead) {
                        const victim = connections[message.victimIndex];
                        if(victim && !victim.player.dead) {
                            victim.player.health -= message.damage; // We trust the client to not send us bad data.
                            victim.player.lastDamage = Date.now();
                            if(victim.player.health <= 0) {
                                victim.player.dead = true;
                                victim.player.health = 0;
                            }
                        }
                    }
                    break;
                case "alive":
                    if(me.player) {
                        me.player.dead = false;
                    }
                    break;
                case 'movephysics':
                    if(me.player && !me.player.dead) {
                        wss.clients.forEach(function each(client) {
                            // We don't want to send this to the client that sent the message.
                            // Otherwise it will stop moving.
                            client.send(JSON.stringify({
                                type: 'physicsobject',
                                position: message.position,
                                angles: message.angles,
                                startLocation: message.startLocation
                            }));
                        });
                    }
                    break;
                case 'buttonpress':
                    if(me.player && !me.player.dead) {
                        wss.clients.forEach(function each(client) {
                            // We don't want to send this to the client that sent the message.
                            // Otherwise it will press twice.
                            client.send(JSON.stringify({
                                type: 'button',
                                startLocation: message.startLocation
                            }));
                        });
                    }
                    break;
                case 'changelevel': // We trust in the client way too much, but we will oblige.
                    if(me.player && !me.player.dead) {
                        map = message.map; // Change the map for future clients.
                        wss.clients.forEach(function each(client) {
                            // Tell the client to change map.
                            ws.send(JSON.stringify({
                                type: 'map',
                                map: message.map,
                                changelevel: true
                            }));
                        });
                    }
                    break;
                case 'break':
                    if(me.player && !me.player.dead) {
                        wss.clients.forEach(function each(client) {
                            client.send(JSON.stringify({
                                type: 'breakphys',
                                startLocation: message.startLocation
                            }));
                        });
                    }
                    break;
                case 'trigger':
                    if(me.player && !me.player.dead) {
                        wss.clients.forEach(function each(client) {
                            client.send(JSON.stringify({
                                type: 'triggerbrush',
                                startLocation: message.startLocation,
                                output: message.output,
                                once: message.once
                            }));
                        });
                    }
                    break;
            }
        });
        // Client disconnected.
        ws.on('close', function close() {
            // Remove the client from the connections array.
            connections.splice(index, 1);
            // Remove the player from the slots array.
            if(me.player) {
                slots[me.player.id] = false;
                if(!me.player.interval) {
                    clearInterval(me.player.interval);
                }
            }
            console.log(chalk.cyan(`[SV] Client disconnected: ${me.username}`));
            wss.clients.forEach(function each(client) {
                client.send(JSON.stringify({
                    type: 'status',
                    message: `${me.username} has disconnected.`
                }));
            });
        });
        me.interval = setInterval(function() {
            let connectioninfo_json = [];
            for(let i = 0; i < connections.length; i++) {
                const c = connections[i];
                connectioninfo_json.push({
                    username: c.username,
                    player: {
                        id: c.player.id || 0,
                        health: c.player.health || 0,
                        hud: c.player.hud || '',
                        dead: c.player.dead || false,
                        lastDamage: c.player.lastDamage || 0,
                        position: {
                            x: (!c.player.dead ? c.player.position.x : 0) || 0,
                            y: (!c.player.dead ? c.player.position.y : 0) || 0,
                            z: (!c.player.dead ? c.player.position.z : 0) || 0
                        },
                        angles: {
                            x: (!c.player.dead ? c.player.angles.x : 0) || 0,
                            y: (!c.player.dead ? c.player.angles.y : 0) || 0,
                            z: (!c.player.dead ? c.player.angles.z : 0) || 0
                        },
                        head: {
                            position: {
                                x: (!c.player.dead ? c.player.head.position.x : 0) || 0,
                                y: (!c.player.dead ? c.player.head.position.y : 0) || 0,
                                z: (!c.player.dead ? c.player.head.position.z : 0) || 0
                            },
                            angles: {
                                x: (!c.player.dead ? c.player.head.angles.x : 0) || 0,
                                y: (!c.player.dead ? c.player.head.angles.y : 0) || 0,
                                z: (!c.player.dead ? c.player.head.angles.z : 0) || 0
                            }
                        },
                        leftHand: {
                            position: {
                                x: (!c.player.dead ? c.player.leftHand.position.x : 0) || 0,
                                y: (!c.player.dead ? c.player.leftHand.position.y : 0) || 0,
                                z: (!c.player.dead ? c.player.leftHand.position.z : 0) || 0
                            },
                            angles: {
                                x: (!c.player.dead ? c.player.leftHand.angles.x : 0) || 0,
                                y: (!c.player.dead ? c.player.leftHand.angles.y : 0) || 0,
                                z: (!c.player.dead ? c.player.leftHand.angles.z : 0) || 0
                            }
                        },
                        rightHand: {
                            position: {
                                x: (!c.player.dead ? c.player.rightHand.position.x : 0) || 0,
                                y: (!c.player.dead ? c.player.rightHand.position.y : 0) || 0,
                                z: (!c.player.dead ? c.player.rightHand.position.z : 0) || 0
                            },
                            angles: {
                                x: (!c.player.dead ? c.player.rightHand.angles.x : 0) || 0,
                                y: (!c.player.dead ? c.player.rightHand.angles.y : 0) || 0,
                                z: (!c.player.dead ? c.player.rightHand.angles.z : 0) || 0
                            }
                        },
                        nameTag: {
                            position: {
                                x: (!c.player.dead ? c.player.nameTag.position.x : 0) || 0,
                                y: (!c.player.dead ? c.player.nameTag.position.y : 0) || 0,
                                z: (!c.player.dead ? c.player.nameTag.position.z : 0) || 0
                            },
                            angles: {
                                x: (!c.player.dead ? c.player.nameTag.angles.x : 0) || 0,
                                y: (!c.player.dead ? c.player.nameTag.angles.y : 0) || 0,
                                z: (!c.player.dead ? c.player.nameTag.angles.z : 0) || 0
                            }
                        },
                        hudText: {
                            position: {
                                x: (!c.player.dead ? c.player.hudText.position.x : 0) || 0,
                                y: (!c.player.dead ? c.player.hudText.position.y : 0) || 0,
                                z: (!c.player.dead ? c.player.hudText.position.z : 0) || 0
                            },
                            angles: {
                                x: (!c.player.dead ? c.player.hudText.angles.x : 0) || 0,
                                y: (!c.player.dead ? c.player.hudText.angles.y : 0) || 0,
                                z: (!c.player.dead ? c.player.hudText.angles.z : 0) || 0
                            }
                        },
                        teleport: {
                            position: {
                                x: (!c.player.dead ? c.player.teleport.position.x : 0) || 0,
                                y: (!c.player.dead ? c.player.teleport.position.y : 0) || 0,
                                z: (!c.player.dead ? c.player.teleport.position.z : 0) || 0
                            },
                            angles: {
                                x: (!c.player.dead ? c.player.teleport.angles.x : 0) || 0,
                                y: (!c.player.dead ? c.player.teleport.angles.y : 0) || 0,
                                z: (!c.player.dead ? c.player.teleport.angles.z : 0) || 0
                            }
                        }
                    }
                });
            };
            ws.send(JSON.stringify({
                type: 'update',
                connectioninfo: {
                    connections: connectioninfo_json
                }
            }));
        }, 0);
    });
    // Handle server closure.
    wss.on('close', function close() {
        console.log(chalk.cyan(`[SV] Server closed, process exiting.`));
        process.exit(0);
    });
    // Handle errors.
    wss.on('error', function error(error) {
        console.log(chalk.red(`[ERROR] [SV] ${error.stack}`));
    });
    // Authenticate clients.
    server.on('upgrade', (request, socket, head) => {
        AuthenticateClient(config, request, (err, client) => {
            if (err) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request, client);
            });
        });
    });
    // Ping intervals.
    const interval = setInterval(function ping() {
        wss.clients.forEach(function each(ws) {
            if (ws.isAlive === false) {
                ws.send(JSON.stringify({
                    type: 'status',
                    message: 'Your connection has timed out.'
                }));
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);
    // Close the server when the process closes.
    process.on('exit', () => {
        wss.clients.forEach(function each(ws) {
            ws.terminate();
        });
        server.close();
    });
    // Close the server when CTRL+C is pressed.
    process.on('SIGINT', () => {
        wss.clients.forEach(function each(ws) {
            ws.terminate();
        });
        server.close();
        process.exit();
    });
    // Listen on the specified port.
    server.listen(config.server_port, () => {
        console.log(chalk.cyan(`[SV] Server listening on port ${config.server_port}.`));
    });
    // Set default map.
    map = config.server_map;
}

/**
 * 
 * @param {IncomingMessage} client
 * @param {Function} callback
 */
function AuthenticateClient(config, request, callback) {
    // Check password.
    if(config.server_password !== undefined && config.server_password !== "") {
        const password = request.headers.password;
        if (password !== config.server_password) {
            return callback(new Error('Invalid password.'));
        }
    }
    // Authenticate the client.
    const auth = request.headers.authorization;
    if (!auth) {
        return callback(new Error('No Authorization header.'));
    }
    const parts = auth.split(' ');
    if (parts.length !== 3) {
        return callback(new Error('Authorization header is not valid.'));
    }
    const scheme = parts[0];
    const username = parts[1];
    const authid = parts[2];
    if (scheme !== 'AuthID') {
        return callback(new Error('Authorization header is not of AuthID scheme.'));
    }
    if(username === undefined || authid === undefined || username === '' || authid === '') {
        return callback(new Error('Authorization header contains an invalid username or AuthID.'));
    }
    // Check if a client with the same username already exists.
    for (let i = 0; i < connections.length; i++) {
        if (connections[i].username === username && connections[i].authid === authid) {
            // Client reconnected.
            return callback(null, connections[i]);
        }
        if (connections[i].username === username) {
            return callback(new Error('A client with the same username already exists.'));
        }
    }
    return callback(null, new Client(username, authid));
}
