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
import { WebSocket } from 'ws';
import * as fs from 'fs';
import chalk from 'chalk';
import * as alyx from './alyx.js';

// Variables
const margin = 2; // margin of error

// Exports

/**
 * Start the client.
 * @param {Object} config The configuration object. 
 */
export function StartClient(config) {
    const ws = new WebSocket(`ws://${config.client_ip}:${config.client_port}`, {
        headers: {
            Authorization: `AuthID ${config.client_username} ${config.client_authid}`,
            Password: config.client_password
        }
    });
    let vconsole_server;
    // Client connected.
    ws.on('open', () => {
        console.log(chalk.green("[CL] Connected to server."));
        // Send memo to server.
        ws.send(JSON.stringify({
            type: 'chat',
            message: `(Memo) ${config.client_memo}`
        }));
        // Connect to VConsole.
        vconsole_server = alyx.InitVConsole(ws, config);
    });
    // Handle messages.
    ws.on('message', async (data) => {
        const message = JSON.parse(data);
        switch(message.type) {
            case 'chat':
                // Print chat message for non-listen server hosts.
                if (config.client_ip !== config.server_ip)
                    console.log(`[CHAT] ${message.username}: ${message.message}`);
                // Play sound to game to notify VR users.
                if(vconsole_server)
                    await vconsole_server.WriteCommand("play sounds/ui/hint.vsnd");
                break;
            case 'status':
                // Print status message.
                console.log(chalk.magenta(`[STATUS] ${message.message}`));
                break;
            case 'command':
                // Execute command in VConsole.
                if(vconsole_server)
                    await vconsole_server.WriteCommand(message.command);
                break;
            case 'update':
                // Update player.
                alyx.UpdateVScript(vconsole_server, message.connectioninfo, config);
                break;
            case 'map':
                // Update map.
                if(vconsole_server.mapName !== message.map && message.changelevel === true || message.changelevel === false) {
                    await vconsole_server.WriteCommand(`addon_play ${message.map};addon_tools_map ${message.map}`);
                }
                break;
            case 'physicsobject':
                // Someone else has moved a physics object.
                // This should not fire if we move the object ourselves.
                for(let i = 0; i < vconsole_server.physicsObjects.length; i++) {
                    if(vconsole_server.physicsObjects[i].startLocation.x + margin >= message.startLocation.x && vconsole_server.physicsObjects[i].startLocation.x - margin <= message.startLocation.x
                        && vconsole_server.physicsObjects[i].startLocation.y + margin >= message.startLocation.y && vconsole_server.physicsObjects[i].startLocation.y - margin <= message.startLocation.y
                        && vconsole_server.physicsObjects[i].startLocation.z + margin >= message.startLocation.z && vconsole_server.physicsObjects[i].startLocation.z - margin <= message.startLocation.z) {
                        if(!vconsole_server.physicsObjects[i].movingLocally) {
                            // Name is arbitrary, startLocation is unique.
                            if(!vconsole_server.physicsObjects[i].motionDisabled) {
                                await vconsole_server.WriteCommand(`ent_fire ${vconsole_server.physicsObjects[i].name} disablemotion;ent_fire ${vconsole_server.physicsObjects[i].name} disableinteraction`);
                                vconsole_server.physicsObjects[i].motionDisabled = true;
                            }
                            // Update location.
                            vconsole_server.physicsObjects[i].updateTime = Date.now();
                            await vconsole_server.WriteCommand((vconsole_server.physicsObjects[i].door ? `` : `ent_setpos ${vconsole_server.physicsObjects[i].index} ${message.position.x} ${message.position.y} ${message.position.z};`)+`ent_setang ${vconsole_server.physicsObjects[i].index} ${message.angles.x} ${message.angles.y} ${message.angles.z}`);
                            // Enable motion after inactivity for a while.
                            if(vconsole_server.physicsObjects[i].interval === null) {
                                vconsole_server.physicsObjects[i].interval = setInterval(() => {
                                    if(Date.now() - vconsole_server.physicsObjects[i].updateTime > config.client_grace_period) {
                                        clearInterval(vconsole_server.physicsObjects[i].interval);
                                        vconsole_server.physicsObjects[i].interval = null;
                                        vconsole_server.physicsObjects[i].motionDisabled = false;
                                        vconsole_server.WriteCommand(`ent_fire ${vconsole_server.physicsObjects[i].name} enablemotion;ent_fire ${vconsole_server.physicsObjects[i].name} enableinteraction`);
                                    }
                                }, 1000);
                            }
                        }
                        break;
                    }
                }
                break;
            case 'button':
                // Someone has pressed a button.
                // This should not fire if we press a button ourselves.
                for(let i = 0; i < vconsole_server.buttons.length; i++) {
                    if(vconsole_server.buttons[i].startLocation.x + margin >= message.startLocation.x && vconsole_server.buttons[i].startLocation.x - margin <= message.startLocation.x
                        && vconsole_server.buttons[i].startLocation.y + margin >= message.startLocation.y && vconsole_server.buttons[i].startLocation.y - margin <= message.startLocation.y
                        && vconsole_server.buttons[i].startLocation.z + margin >= message.startLocation.z && vconsole_server.buttons[i].startLocation.z - margin <= message.startLocation.z) {
                        if(!vconsole_server.buttons[i].pressingLocally) {
                            if(!vconsole_server.buttons[i].pressing) {
                                await vconsole_server.WriteCommand(`ent_fire ${vconsole_server.buttons[i].name} lock`);
                                vconsole_server.buttons[i].pressing = true;
                            }
                            vconsole_server.buttons[i].updateTime = Date.now();
                            await vconsole_server.WriteCommand(`ent_fire ${vconsole_server.buttons[i].name} press`);
                            if(vconsole_server.buttons[i].interval === null) {
                                vconsole_server.buttons[i].interval = setInterval(() => {
                                    if(Date.now() - vconsole_server.buttons[i].updateTime > 5000) {
                                        clearInterval(vconsole_server.buttons[i].interval);
                                        vconsole_server.buttons[i].interval = null;
                                        vconsole_server.buttons[i].pressing = false;
                                        vconsole_server.WriteCommand(`ent_fire ${vconsole_server.buttons[i].name} unlock`);
                                    }
                                }, 1000);
                            }
                        }
                        break;
                    }
                }
                break;
            case 'breakphys':
                // Someone has broken a physics object.
                for(let i = 0; i < vconsole_server.physicsObjects.length; i++) {
                    if(vconsole_server.physicsObjects[i].startLocation.x + margin >= message.startLocation.x && vconsole_server.physicsObjects[i].startLocation.x - margin <= message.startLocation.x
                        && vconsole_server.physicsObjects[i].startLocation.y + margin >= message.startLocation.y && vconsole_server.physicsObjects[i].startLocation.y - margin <= message.startLocation.y
                        && vconsole_server.physicsObjects[i].startLocation.z + margin >= message.startLocation.z && vconsole_server.physicsObjects[i].startLocation.z - margin <= message.startLocation.z) {
                        vconsole_server.WriteCommand(`ent_fire ${vconsole_server.physicsObjects[i].name} break`, true);
                        break;
                    }
                }
                break;
            case 'triggerbrush':
                // Someone has triggered something.
                for(let i = 0; i < vconsole_server.triggers.length; i++) {
                    if(vconsole_server.triggers[i].startLocation.x + margin >= message.startLocation.x && vconsole_server.triggers[i].startLocation.x - margin <= message.startLocation.x
                        && vconsole_server.triggers[i].startLocation.y + margin >= message.startLocation.y && vconsole_server.triggers[i].startLocation.y - margin <= message.startLocation.y
                        && vconsole_server.triggers[i].startLocation.z + margin >= message.startLocation.z && vconsole_server.triggers[i].startLocation.z - margin <= message.startLocation.z) {
                        if(!vconsole_server.triggers[i].triggeringLocally) {
                            if(!vconsole_server.triggers[i].triggering) {
                                await vconsole_server.WriteCommand(`ent_fire ${vconsole_server.triggers[i].name} disable`);
                                vconsole_server.triggers[i].triggering = true;
                            }
                            vconsole_server.triggers[i].updateTime = Date.now();
                            if(message.once && !vconsole_server.triggers[i].triggeredOnce || !message.once) {
                                console.log(`${message.once} ${vconsole_server.triggers[i].index} ${message.output}`);
                                vconsole_server.triggers[i].triggeredOnce = message.once;
                                // Yes, you can still 'touch' triggers even if they're disabled.
                                await vconsole_server.WriteCommand(`trigger_touch ${vconsole_server.triggers[i].index} ${message.output}`, true);
                                if(vconsole_server.triggers[i].interval === null && !vconsole_server.triggers[i].once) { // Only re-enable if it's not a trigger_once.
                                    vconsole_server.triggers[i].interval = setInterval(() => {
                                        if(Date.now() - vconsole_server.triggers[i].updateTime > config.client_grace_period) {
                                            clearInterval(vconsole_server.triggers[i].interval);
                                            vconsole_server.triggers[i].interval = null;
                                            vconsole_server.triggers[i].triggering = false;
                                            vconsole_server.WriteCommand(`ent_fire ${vconsole_server.triggers[i].name} enable`);
                                        }
                                    }, 1000);
                                }
                            }
                        }
                        break;
                    }
                }
                break;
        }
    });
    // Handle errors.
    ws.on('error', (error) => {
        console.log(chalk.red(`[ERROR] [CL] ${error.stack}`));
    });
    // Handle close.
    ws.on('close', () => {
        console.log(chalk.red("[CL] Disconnected from server. The program will now exit."));
        process.exit(0);
    });
    // Chat through the console.
    process.stdin.on('data', (data) => {
        const message = data.toString().trim();
        if(message.length > 0) {
            // Check for commands.
            if (message.startsWith("/")) {
                let command = message.substring(1).split(" ")[0];
                let args = message.substring(1).split(" ").slice(1);
                // Send command to server.
                ws.send(JSON.stringify({
                    type: 'command',
                    command: command,
                    args: args
                }));
            } else {
                // Send chat message to server.
                ws.send(JSON.stringify({
                    type: 'chat',
                    message: message
                }));
            }
        }
    });
}
