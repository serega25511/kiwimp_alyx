/*
    kiwimp_alyx
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
import chalk from 'chalk';
import * as net from 'net';
import pkg from 'cap';
const { Cap, decoders } = pkg;
import { Button, PhysicsObject, VConsole, Player, LocalPlayer } from './classes.js';

// Variables
const valid_packet_types = [
    "PLYR", // Player positioning
    "HEAD", // Head position
    "HAND", // Left and right hand positions
    "RHND", // Virtual right hand indexes
    "LHND", // Virtual left hand indexes
    "HSET", // Virtual headset indexes
    "TAGS", // Text indexes
    "NPCS", // Virtual collider indexes
    "PRFX", // Entity targetname prefix
    "ALIV", // Console is still receiving data
    "DMGE", // Collider (victim) index and damage
    "PROP", // Physics object index and start position
    "PHYS", // Physics object position
    "MAPN", // Map name
    "BUTN", // Button index and start position
    "BPRS", // Button index press
    "DOOR"  // Door index and start position
];
const localPlayer = new Player();
const players = [ // 16 players max
    new LocalPlayer(),
    new LocalPlayer(),
    new LocalPlayer(),
    new LocalPlayer(),
    new LocalPlayer(),
    new LocalPlayer(),
    new LocalPlayer(),
    new LocalPlayer(),
    new LocalPlayer(),
    new LocalPlayer(),
    new LocalPlayer(),
    new LocalPlayer(),
    new LocalPlayer(),
    new LocalPlayer(),
    new LocalPlayer(),
    new LocalPlayer()
];

// Exports

export function IsPacketTypeValid(packet_type) {
    return valid_packet_types.includes(packet_type);
}

/**
 * Initialize the Half-Life: Alyx VConsole client.
 * @param {WebSocket} ws The WebSocket connection.
 * @returns {VConsole} The VConsole connection.
 */
export function InitVConsole(ws) {
    let vconsole_server = new VConsole(net.Socket());
    // Capturing network packets from VConsole.
    const c = new Cap();
    const device = "\\Device\\NPF_Loopback"; // Packets are captured from the local machine.
    const filter = `tcp and src port ${vconsole_server.port}`;
    const bufSize = 64 * 1024 * 1024; // 64MB
    const buffer = Buffer.alloc(bufSize);
    const linkType = c.open(device, filter, bufSize, buffer);
    c.setMinBytes(0); // Don't wait, read as fast as possible.
    c.on('packet', (nbytes, trunc) => {
        // Parse packet type while trimming prefixing TCP and loopback data.
        const packet = buffer.slice(43, nbytes).toString('ascii').replace('\0', '').replace('\n', '');
        const packet_type = packet.slice(0, 4);
        const packet_data = packet.slice(4);
        // Print packet.
        if(packet_type.includes("PRNT")) {
            const message = packet_data.slice(36);
            let trimmed_message = message.toString();
            // Check if the message is a command.
            if(trimmed_message.split(packet_type)[1] !== undefined) {
                // Packet data is loosely formatted, so we need to parse it.
                trimmed_message = message.toString().split(packet_type)[1].slice(1, -1);
            }
            // Remove everything after "EKED"
            let command = trimmed_message.split(" ")[0].split("EKED")[0];
            if(IsPacketTypeValid(command.replace(/.*!k!/, ""))) {
                command = command.replace(/.*!k!/, "");
                const args = trimmed_message.split(" ").splice(1);
                if(args.length > 0) {
                    // Remove last argument (EKED)
                    args.pop();
                    switch(command) {
                        // Positional data
                        case "HAND":
                            localPlayer.leftHand.position.x = parseFloat(args[0]);
                            localPlayer.leftHand.position.y = parseFloat(args[1]);
                            localPlayer.leftHand.position.z = parseFloat(args[2]);
                            localPlayer.leftHand.angles.x = parseFloat(args[3]);
                            localPlayer.leftHand.angles.y = parseFloat(args[4]);
                            localPlayer.leftHand.angles.z = parseFloat(args[5]);
                            localPlayer.rightHand.position.x = parseFloat(args[6]);
                            localPlayer.rightHand.position.y = parseFloat(args[7]);
                            localPlayer.rightHand.position.z = parseFloat(args[8]);
                            localPlayer.rightHand.angles.x = parseFloat(args[9]);
                            localPlayer.rightHand.angles.y = parseFloat(args[10]);
                            localPlayer.rightHand.angles.z = parseFloat(args[11]);
                            ws.send(JSON.stringify({
                                type: "movement",
                                localPlayer: localPlayer
                            }));
                            break;
                        case "PLYR":
                            localPlayer.position.x = parseFloat(args[0]);
                            localPlayer.position.y = parseFloat(args[1]);
                            localPlayer.position.z = parseFloat(args[2]);
                            localPlayer.angles.x = parseFloat(args[3]);
                            localPlayer.angles.y = parseFloat(args[4]);
                            localPlayer.angles.z = parseFloat(args[5]);
                            localPlayer.health = parseFloat(args[6]);
                            ws.send(JSON.stringify({
                                type: "movement",
                                localPlayer: localPlayer
                            }));
                            break;
                        case "HEAD":
                            localPlayer.head.position.x = parseFloat(args[0]);
                            localPlayer.head.position.y = parseFloat(args[1]);
                            localPlayer.head.position.z = parseFloat(args[2]);
                            localPlayer.head.angles.x = parseFloat(args[3]);
                            localPlayer.head.angles.y = parseFloat(args[4]);
                            localPlayer.head.angles.z = parseFloat(args[5]);
                            // Get directional vectors based on the player's angles.
                            const directionX = Math.cos(localPlayer.y * (Math.PI / 180));
                            const directionY = Math.sin(localPlayer.y * (Math.PI / 180));
                            const directionZ = Math.cos((localPlayer.x + 90) * (Math.PI / 180));
                            // Place the HUD in front of the head with offsets that orbit around the player.
                            localPlayer.hudText.position.x = localPlayer.head.position.x + directionX * 48;
                            localPlayer.hudText.position.y = localPlayer.head.position.y + directionY * 48;
                            localPlayer.hudText.position.z = localPlayer.head.position.z + directionZ * 48;
                            localPlayer.hudText.angles.x = 0;
                            localPlayer.hudText.angles.y = localPlayer.angles.y;
                            localPlayer.hudText.angles.z = 90;
                            ws.send(JSON.stringify({
                                type: "movement",
                                localPlayer: localPlayer
                            }));
                            break;
                        // Entity indexes
                        case "LHND":
                            for(let i = 0; i < args.length; i++) {
                                players[i].leftHandIndex = parseInt(args[i]);
                            }
                            break;
                        case "RHND":
                            for(let i = 0; i < args.length; i++) {
                                players[i].rightHandIndex = parseInt(args[i]);
                            }
                            break;
                        case "HSET":
                            for(let i = 0; i < args.length; i++) {
                                players[i].headsetIndex = parseInt(args[i]);
                            }
                            break;
                        case "NPCS":
                            for(let i = 0; i < args.length; i++) {
                                players[i].npcIndex = parseInt(args[i]);
                            }
                            break;
                        case "TAGS":
                            for(let i = 0; i < args.length; i++) {
                                players[i].nameTagIndex = parseInt(args[i]);
                            }
                            break;
                        // Set targetname prefix
                        case "PRFX":
                            vconsole_server.prefix = args[0];
                            console.log(chalk.yellow(`[VC] Prefix set to ${args[0]}, sv_cheats has been enabled.`));
                            vconsole_server.WriteCommand(`sv_cheats 1`, true);
                            break;
                        // Alive
                        case "ALIV":
                            vconsole_server.alive = Date.now();
                            break;
                        // Damage
                        case "DMGE":
                            ws.send(JSON.stringify({
                                type: "damage",
                                damage: parseInt(args[0]),
                                victimIndex: parseInt(args[1]-1),
                            }));
                        // Physics objects
                        case "PROP": // Indexing is done using the start origin as names and indexes are not unique.
                            const physProp = new PhysicsObject(parseInt(args[0]), args[1]);
                            physProp.startLocation.x = Math.floor(parseFloat(args[2]));
                            physProp.startLocation.y = Math.floor(parseFloat(args[3]));
                            physProp.startLocation.z = Math.floor(parseFloat(args[4]));
                            vconsole_server.physicsObjects.push(physProp);
                            break;
                        case "PHYS":
                            const physPropByIndex = vconsole_server.physicsObjects[parseInt(args[0])];
                            if(physPropByIndex) {
                                physPropByIndex.position.x = parseFloat(args[1]);
                                physPropByIndex.position.y = parseFloat(args[2]);
                                physPropByIndex.position.z = parseFloat(args[3]);
                                physPropByIndex.angles.x = parseFloat(args[4]);
                                physPropByIndex.angles.y = parseFloat(args[5]);
                                physPropByIndex.angles.z = parseFloat(args[6]);
                                ws.send(JSON.stringify({
                                    type: "movephysics",
                                    position: physPropByIndex.position,
                                    angles: physPropByIndex.angles,
                                    startLocation: physPropByIndex.startLocation
                                }));
                            }
                            break;
                        case "MAPN":
                            console.log(chalk.yellow(`[VC] ${vconsole_server.physicsObjects.length} physics objects loaded.`));
                            console.log(chalk.yellow(`[VC] ${vconsole_server.buttons.length} buttons loaded.`));
                            // We're not dead!
                            ws.send(JSON.stringify({
                                type: "alive",
                            }));
                            break;
                        // Buttons
                        case "BUTN":
                            const button = new Button(parseInt(args[0]), args[1]);
                            button.startLocation.x = Math.floor(parseFloat(args[2]));
                            button.startLocation.y = Math.floor(parseFloat(args[3]));
                            button.startLocation.z = Math.floor(parseFloat(args[4]));
                            vconsole_server.buttons.push(button);
                            break;
                        case "BPRS":
                            const buttonByIndex = vconsole_server.buttons[parseInt(args[0])];
                            if(buttonByIndex) {
                                ws.send(JSON.stringify({
                                    type: "buttonpress",
                                    startLocation: physPropByIndex.startLocation
                                }));
                            }
                            break;
                        // Doors
                        case "DOOR":
                            const door = new PhysicsObject(parseInt(args[0]), args[1]);
                            door.door = true;
                            door.startLocation.x = Math.floor(parseFloat(args[2]));
                            door.startLocation.y = Math.floor(parseFloat(args[3]));
                            door.startLocation.z = Math.floor(parseFloat(args[4]));
                            vconsole_server.physicsObjects.push(door);
                            // A side effect of setting the angles of a door is that it can never latch, otherwise you can't move it.
                            vconsole_server.WriteCommand(`ent_fire ${door.name} disablelatch`, true);
                            break;
                    }
                }
                vconsole_server.alive = Date.now();
            } else if(message.includes("keepalive")) {
                // Even though it's an unknown command, it still received a keepalive.
                vconsole_server.alive = Date.now();
            } else if(message.includes("Command buffer full")) {
                // This seems to be a non-issue now as the class continuously clears the buffer.
            } else if(!message.includes("Script not found") && !message.includes("EKED") && !message.includes("===============") && !message.includes("Connected.") && !message.includes("npc_metropolice")) {
                console.log(chalk.yellow(`[VC] [PRNT] ${message}`));
            }
        }
    });
    vconsole_server.ConnectToVConsole(vconsole_server);
    // Close the connection when the process exits.
    process.on('exit', () => {
        vconsole_server.killed = true;
        vconsole_server.socket.end();
    });
    process.on('SIGINT', () => {
        vconsole_server.killed = true;
        vconsole_server.socket.end();
        process.exit();
    });
    return vconsole_server;
}

export async function UpdateVScript(vconsole_server, connectioninfo, config) {
    for(let i = 0; i < connectioninfo.connections.length; i++) {
        const user = connectioninfo.connections[i];
        const player = players[user.player.id];
        //if(JSON.stringify(user.player) != JSON.stringify(player.player) || user.username == config.client_username) {
            // Clientside stuff
            if(user.username == config.client_username) {
                // Place the HUD down.
                if(user.player.hudText != player.player.hudText) {
                    vconsole_server.WriteCommand(`ent_setpos ${player.nameTagIndex} ${user.player.hudText.position.x} ${user.player.hudText.position.y} ${user.player.hudText.position.z}`
                        +`;ent_setang ${player.nameTagIndex} ${user.player.hudText.angles.x} ${user.player.hudText.angles.y} ${user.player.hudText.angles.z}`);
                }
                // Show the hud.
                if(!user.player.dead && user.player.hud != player.player.hud) {
                    vconsole_server.WriteCommand(`ent_fire ${vconsole_server.prefix}_kiwi_player_name_${user.player.id} setmessage \"${user.player.hud}\"`);
                };
                // Player is teleporting, so we need to update the position.
                if((user.player.teleport.position.x != 0 || user.player.teleport.position.y != 0 || user.player.teleport.position.z != 0) && user.player.teleport != player.player.teleport) {
                    vconsole_server.WriteCommand(`ent_setpos 1 ${user.player.teleport.position.x} ${user.player.teleport.position.y} ${user.player.teleport.position.z}`
                        +`;ent_setang 1 ${user.player.teleport.angles.x} ${user.player.teleport.angles.y} ${user.player.teleport.angles.z}`, true);
                };
                // If the player is being damaged, don't update the health if it's greater than the previous value.
                // Otherwise, just set it as-is.
                if(user.player.health != player.player.health) {
                    if(!user.player.dead && user.player.health >= 0) {
                        vconsole_server.WriteCommand(`ent_fire player sethealth ${user.player.health}`);
                    } else {
                        vconsole_server.WriteCommand(`kill`);
                    }
                };
            } else { // Don't update the player for the client
                // NPCs
                if(user.player.position != player.player.position) {
                    vconsole_server.WriteCommand(`ent_setpos ${player.npcIndex} ${user.player.position.x} ${user.player.position.y} ${user.player.position.z}`);
                }
                // Name tags
                if(user.player.nameTag != player.player.nameTag) {
                    vconsole_server.WriteCommand(`ent_setpos ${player.nameTagIndex} ${user.player.head.position.x} ${user.player.head.position.y} ${user.player.head.position.z+10}`
                        +`;ent_setang ${player.nameTagIndex} 0 ${user.player.angles.y+90} 90`
                        +`;ent_fire ${vconsole_server.prefix}_kiwi_player_name_${user.player.id} setmessage\"${user.username} : ${user.player.health}/100\"`);
                }
                // Player left hands
                if(user.player.leftHand != player.player.leftHand) {
                    vconsole_server.WriteCommand(`ent_setpos ${player.leftHandIndex} ${user.player.leftHand.position.x} ${user.player.leftHand.position.y} ${user.player.leftHand.position.z}`
                        +`;ent_setang ${player.leftHandIndex} ${user.player.leftHand.angles.x} ${user.player.leftHand.angles.y} ${user.player.leftHand.angles.z}`);
                }
                // Player right hands
                if(user.player.rightHand != player.player.rightHand) {
                    vconsole_server.WriteCommand(`ent_setpos ${player.rightHandIndex} ${user.player.rightHand.position.x} ${user.player.rightHand.position.y} ${user.player.rightHand.position.z}`
                        +`;ent_setang ${player.rightHandIndex} ${user.player.rightHand.angles.x} ${user.player.rightHand.angles.y} ${user.player.rightHand.angles.z}`);
                }
                // Heads
                if(user.player.head != player.player.head) {
                    vconsole_server.WriteCommand(`ent_setpos ${player.headsetIndex} ${user.player.head.position.x} ${user.player.head.position.y} ${user.player.head.position.z}`
                        +`;ent_setang ${player.headsetIndex} ${user.player.head.angles.x} ${user.player.head.angles.y} ${user.player.head.angles.z}`);
                }
            }
            player.player = user.player;
        //}
    }
}