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
import chalk from 'chalk';
import * as net from 'net';
import pkg from 'cap';
const { Cap } = pkg;
import { Button, PhysicsObject, VConsole, Player, LocalPlayer, Trigger } from './classes.js';

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
    "DOOR", // Door index and start position
    "BRAK", // Broken prop index
    "TRIG", // Trigger index and start position
    "TRGD"  // Triggered entity index
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
export function InitVConsole(ws, config) {
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
        const packet = buffer.slice(43, nbytes).toString('ascii').replace('\0', '');
        const packet_split = packet.split('\n'); // Used for truncated data.
        packet_split.forEach(line => {
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
                // Remove everything after "KCOM"
                let command = trimmed_message.split(" ")[0].split("KCOM")[0];
                if(IsPacketTypeValid(command.replace(/.*!k!/, ""))) {
                    command = command.replace(/.*!k!/, "");
                    const args = trimmed_message.split(" ").splice(1);
                    if(args.length > 0) {
                        // Remove last argument (KCOM)
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
                                if(config.client_print_vconsole.toLowerCase() == "true")
                                    console.log(chalk.yellow(`[VC] Left hand indexes updated.`));
                                break;
                            case "RHND":
                                for(let i = 0; i < args.length; i++) {
                                    players[i].rightHandIndex = parseInt(args[i]);
                                }
                                if(config.client_print_vconsole.toLowerCase() == "true")
                                    console.log(chalk.yellow(`[VC] Right hand indexes updated.`));
                                break;
                            case "HSET":
                                for(let i = 0; i < args.length; i++) {
                                    players[i].headsetIndex = parseInt(args[i]);
                                }
                                if(config.client_print_vconsole.toLowerCase() == "true")
                                    console.log(chalk.yellow(`[VC] Headset indexes updated.`));
                                break;
                            case "NPCS":
                                for(let i = 0; i < args.length; i++) {
                                    players[i].npcIndex = parseInt(args[i]);
                                }
                                if(config.client_print_vconsole.toLowerCase() == "true")
                                    console.log(chalk.yellow(`[VC] NPC indexes updated.`));
                                break;
                            case "TAGS":
                                for(let i = 0; i < args.length; i++) {
                                    players[i].nameTagIndex = parseInt(args[i]);
                                }
                                if(config.client_print_vconsole.toLowerCase() == "true")
                                    console.log(chalk.yellow(`[VC] Name tag indexes updated.`));
                                break;
                            // Set targetname prefix
                            case "PRFX":
                                vconsole_server.prefix = args[0];
                                if(config.client_print_vconsole.toLowerCase() == "true")
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
                                for(let i = 0; i < vconsole_server.physicsObjects.length; i++) {
                                    if(vconsole_server.physicsObjects[i].index == parseInt(args[0])) {
                                        if(!vconsole_server.physicsObjects[i].motionDisabled) {
                                            vconsole_server.physicsObjects[i].position.x = parseFloat(args[1]);
                                            vconsole_server.physicsObjects[i].position.y = parseFloat(args[2]);
                                            vconsole_server.physicsObjects[i].position.z = parseFloat(args[3]);
                                            vconsole_server.physicsObjects[i].angles.x = parseFloat(args[4]);
                                            vconsole_server.physicsObjects[i].angles.y = parseFloat(args[5]);
                                            vconsole_server.physicsObjects[i].angles.z = parseFloat(args[6]);
                                            ws.send(JSON.stringify({
                                                type: "movephysics",
                                                position: vconsole_server.physicsObjects[i].position,
                                                angles: vconsole_server.physicsObjects[i].angles,
                                                startLocation: vconsole_server.physicsObjects[i].startLocation
                                            }));
                                            vconsole_server.physicsObjects[i].updateTime = Date.now();
                                            vconsole_server.physicsObjects[i].movingLocally = true;
                                            if(vconsole_server.physicsObjects[i].localInterval === null) {
                                                vconsole_server.physicsObjects[i].localInterval = setInterval(() => {
                                                    if(vconsole_server.physicsObjects[i] !== undefined) {
                                                        if(Date.now() - vconsole_server.physicsObjects[i].updateTime > config.client_grace_period) {
                                                            vconsole_server.physicsObjects[i].movingLocally = false;
                                                            clearInterval(vconsole_server.physicsObjects[i].localInterval);
                                                            vconsole_server.physicsObjects[i].localInterval = null;
                                                        }
                                                    }
                                                }, 1000);
                                            }
                                        }
                                        break;
                                    }
                                }
                                break;
                            case "MAPN":
                                if(config.client_print_vconsole.toLowerCase() == "true")
                                    console.log(chalk.yellow(`[VC] Map name set to ${args[0]}.`));
                                vconsole_server.mapName = args[0];
                                // Also, we're not dead!
                                ws.send(JSON.stringify({
                                    type: "alive",
                                }));
                                vconsole_server.WriteCommand(`ent_fire ${vconsole_server.prefix}_script_server runscriptfile physics.lua`, true);
                                vconsole_server.WriteCommand(`ent_fire ${vconsole_server.prefix}_script_server runscriptfile triggers.lua`, true);
                                break;
                            // Buttons (untested)
                            case "BUTN":
                                const button = new Button(parseInt(args[0]), args[1]);
                                button.startLocation.x = Math.floor(parseFloat(args[2]));
                                button.startLocation.y = Math.floor(parseFloat(args[3]));
                                button.startLocation.z = Math.floor(parseFloat(args[4]));
                                vconsole_server.buttons.push(button);
                                break;
                            case "BPRS":
                                for(let i = 0; i < vconsole_server.buttons.length; i++) {
                                    if(vconsole_server.buttons[i].index == parseInt(args[0])) {
                                        if(!vconsole_server.buttons[i].pressing) {
                                            ws.send(JSON.stringify({
                                                type: "buttonpress",
                                                startLocation: vconsole_server.buttons[i].startLocation
                                            }));
                                            vconsole_server.buttons[i].updateTime = Date.now();
                                            vconsole_server.buttons[i].pressingLocally = true;
                                            if(vconsole_server.buttons[i].localInterval === null) {
                                                vconsole_server.buttons[i].localInterval = setInterval(() => {
                                                    if(vconsole_server.buttons[i] !== undefined) {
                                                        if(Date.now() - vconsole_server.buttons[i].updateTime > config.client_grace_period) {
                                                            vconsole_server.buttons[i].pressingLocally = false;
                                                            clearInterval(vconsole_server.buttons[i].localInterval);
                                                            vconsole_server.buttons[i].localInterval = null;
                                                        }
                                                    }
                                                }, 1000);
                                            }
                                        }
                                        break;
                                    }
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
                            // Broken props
                            case "BRAK":
                                for(let i = 0; i < vconsole_server.physicsObjects.length; i++) {
                                    if(vconsole_server.physicsObjects[i].index == parseInt(args[0])) {
                                        ws.send(JSON.stringify({
                                            type: "break",
                                            startLocation: vconsole_server.physicsObjects[i].startLocation
                                        }));
                                        break;
                                    }
                                }
                                break;
                            // Triggers
                            case "TRIG":
                                const trigger = new Trigger(parseInt(args[0]), args[1]);
                                trigger.startLocation.x = Math.floor(parseFloat(args[2]));
                                trigger.startLocation.y = Math.floor(parseFloat(args[3]));
                                trigger.startLocation.z = Math.floor(parseFloat(args[4]));
                                vconsole_server.triggers.push(trigger);
                                break;
                            case "TRGD":
                                for(let i = 0; i < vconsole_server.triggers.length; i++) {
                                    if(vconsole_server.triggers[i].index == parseInt(args[0])) {
                                        if(!vconsole_server.triggers[i].triggering) {
                                            ws.send(JSON.stringify({
                                                type: "trigger",
                                                startLocation: vconsole_server.triggers[i].startLocation,
                                                output: args[1],
                                                once: args[2] == "true"
                                            }));
                                            vconsole_server.triggers[i].updateTime = Date.now();
                                            vconsole_server.triggers[i].triggeringLocally = true;
                                            if(vconsole_server.triggers[i].localInterval === null) {
                                                vconsole_server.triggers[i].localInterval = setInterval(() => {
                                                    if(vconsole_server.triggers[i] !== undefined) {
                                                        if(Date.now() - vconsole_server.triggers[i].updateTime > config.client_grace_period) {
                                                            vconsole_server.triggers[i].triggeringLocally = false;
                                                            clearInterval(vconsole_server.triggers[i].localInterval);
                                                            vconsole_server.triggers[i].localInterval = null;
                                                        }
                                                    }
                                                }, 1000);
                                            }
                                        }
                                        break;
                                    }
                                }
                                break;
                        }
                    }
                    vconsole_server.alive = Date.now();
                } else if(message.includes("keepalive")) {
                    // Even though it's an unknown command, it still received a keepalive.
                    vconsole_server.alive = Date.now();
                } else if(message.includes(": no entity")) {
                    // A physics object dissapeared from us, remove it by entity index.
                    const index = message.split(" no entity ")[1]
                    if(index) {
                        for(let i = 0; i < vconsole_server.physicsObjects.length; i++) {
                            if(vconsole_server.physicsObjects[i].index == parseInt(index)) {
                                vconsole_server.physicsObjects.splice(i, 1);
                                break;
                            }
                        }
                    }
                } else if(message.includes("Command buffer full")) {
                    vconsole_server.alive -= 2500; // It might be dead.
                } else if(config.client_print_vconsole.toLowerCase() == "true"
                    && !message.includes("conversion")
                    && !message.includes("Script not found")
                    && !message.includes("KCOM")
                    && !message.includes("===============")
                    && !message.includes("Connected.")
                    && !message.includes("metropolice")) {
                    console.log(chalk.yellow(`[VC] [PRNT] ${message}`));
                }
            }
        });
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
                if((user.player.hudText.position.x != player.player.hudText.position.x || user.player.hudText.position.y != player.player.hudText.position.y || user.player.hudText.position.z != player.player.hudText.position.z
                    || user.player.hudText.angles.x != player.player.hudText.angles.x || user.player.hudText.angles.y != player.player.hudText.angles.y || user.player.hudText.angles.z != player.player.hudText.angles.z)
                    && player.nameTagIndex != 0) {
                    vconsole_server.WriteCommand(`ent_setpos ${player.nameTagIndex} ${user.player.hudText.position.x} ${user.player.hudText.position.y} ${user.player.hudText.position.z}`
                        +`;ent_setang ${player.nameTagIndex} ${user.player.hudText.angles.x} ${user.player.hudText.angles.y} ${user.player.hudText.angles.z}`);
                }
                // Show the hud.
                if(!user.player.dead && user.player.hud != player.player.hud) {
                    vconsole_server.WriteCommand(`ent_fire ${vconsole_server.prefix}_kiwi_player_name_${user.player.id} setmessage \"${user.player.hud}\"`);
                };
                // Player is teleporting, so we need to update the position.
                if(user.player.teleport.position.x != 0 || user.player.teleport.position.y != 0 || user.player.teleport.position.z != 0
                    || user.player.teleport.angles.x != 0 || user.player.teleport.angles.y != 0 || user.player.teleport.angles.z != 0) {
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
                if((user.player.position.x != player.player.position.x || user.player.position.y != player.player.position.y || user.player.position.z != player.player.position.z
                    || user.player.angles.x != player.player.angles.x || user.player.angles.y != player.player.angles.y || user.player.angles.z != player.player.angles.z)
                    && config.client_player_collision.toLowerCase() == "true") {
                    vconsole_server.WriteCommand(`ent_setpos ${player.npcIndex} ${user.player.position.x} ${user.player.position.y} ${user.player.position.z}`);
                }
                // Name tags
                if((user.player.nameTag.position.x != player.player.nameTag.position.x || user.player.nameTag.position.y != player.player.nameTag.position.y || user.player.nameTag.z != player.player.nameTag.position.z
                    || user.player.nameTag.angles.x != player.player.nameTag.angles.x || user.player.nameTag.angles.y != player.player.nameTag.angles.y || user.player.nameTag.angles.z != player.player.nameTag.angles.z
                    || user.player.health != player.player.health)
                    && player.nameTagIndex != 0) {
                    vconsole_server.WriteCommand(`ent_setpos ${player.nameTagIndex} ${user.player.head.position.x} ${user.player.head.position.y} ${user.player.head.position.z+10}`
                        +`;ent_setang ${player.nameTagIndex} 0 ${user.player.angles.y+90} 90`
                        +`;ent_fire ${vconsole_server.prefix}_kiwi_player_name_${user.player.id} setmessage \"${user.username} : ${user.player.health}/100\"`);
                }
                // Player left hands
                if((user.player.leftHand.position.x != player.player.leftHand.position.x || user.player.leftHand.position.y != player.player.leftHand.position.y || user.player.leftHand.position.z != player.player.leftHand.position.z
                    || user.player.leftHand.angles.x != player.player.leftHand.angles.x || user.player.leftHand.angles.y != player.player.leftHand.angles.y || user.player.leftHand.angles.z != player.player.leftHand.angles.z)
                    && player.leftHandIndex != 0) {
                    vconsole_server.WriteCommand(`ent_setpos ${player.leftHandIndex} ${user.player.leftHand.position.x} ${user.player.leftHand.position.y} ${user.player.leftHand.position.z}`
                        +`;ent_setang ${player.leftHandIndex} ${user.player.leftHand.angles.x} ${user.player.leftHand.angles.y} ${user.player.leftHand.angles.z}`);
                }
                // Player right hands
                if((user.player.rightHand.position.x != player.player.rightHand.position.x || user.player.rightHand.position.y != player.player.rightHand.position.y || user.player.rightHand.position.z != player.player.rightHand.position.z
                    || user.player.rightHand.angles.x != player.player.rightHand.angles.x || user.player.rightHand.angles.y != player.player.rightHand.angles.y || user.player.rightHand.angles.z != player.player.rightHand.angles.z)
                    && player.rightHandIndex != 0) {
                    vconsole_server.WriteCommand(`ent_setpos ${player.rightHandIndex} ${user.player.rightHand.position.x} ${user.player.rightHand.position.y} ${user.player.rightHand.position.z}`
                        +`;ent_setang ${player.rightHandIndex} ${user.player.rightHand.angles.x} ${user.player.rightHand.angles.y} ${user.player.rightHand.angles.z}`);
                }
                // Heads
                if((user.player.head.position.x != player.player.head.position.x || user.player.head.position.y != player.player.head.position.y || user.player.head.position.z != player.player.head.position.z
                    || user.player.head.angles.x != player.player.head.angles.x || user.player.head.angles.y != player.player.head.angles.y || user.player.head.angles.z != player.player.head.angles.z)
                    && player.headsetIndex != 0) {
                    vconsole_server.WriteCommand(`ent_setpos ${player.headsetIndex} ${user.player.head.position.x} ${user.player.head.position.y} ${user.player.head.position.z}`
                        +`;ent_setang ${player.headsetIndex} ${user.player.head.angles.x} ${user.player.head.angles.y} ${user.player.head.angles.z}`);
                }
            }
            player.player = user.player;
        //}
    }
}