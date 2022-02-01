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
                    const physicsObject = vconsole_server.physicsObjects[i];
                    if(physicsObject.startLocation.x + margin >= message.startLocation.x && physicsObject.startLocation.x - margin <= message.startLocation.x
                        && physicsObject.startLocation.y + margin >= message.startLocation.y && physicsObject.startLocation.y - margin <= message.startLocation.y
                        && physicsObject.startLocation.z + margin >= message.startLocation.z && physicsObject.startLocation.z - margin <= message.startLocation.z) {
                        if(!physicsObject.movingLocally) {
                            // Name is arbitrary, startLocation is unique.
                            if(!physicsObject.motionDisabled) {
                                await vconsole_server.WriteCommand(`ent_fire ${physicsObject.name} disablemotion;ent_fire ${physicsObject.name} disableinteraction`);
                                physicsObject.motionDisabled = true;
                            }
                            // Update location.
                            physicsObject.updateTime = Date.now();
                            await vconsole_server.WriteCommand((physicsObject.door ? `` : `ent_setpos ${physicsObject.index} ${message.position.x} ${message.position.y} ${message.position.z};`)+`ent_setang ${physicsObject.index} ${message.angles.x} ${message.angles.y} ${message.angles.z}`);
                            // Enable motion after inactivity for a while.
                            if(physicsObject.interval === null) {
                                physicsObject.interval = setInterval(() => {
                                    if(Date.now() - physicsObject.updateTime > config.client_grace_period) {
                                        clearInterval(physicsObject.interval);
                                        physicsObject.interval = null;
                                        physicsObject.motionDisabled = false;
                                        vconsole_server.WriteCommand(`ent_fire ${physicsObject.name} enablemotion;ent_fire ${physicsObject.name} enableinteraction`);
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
                    const button = vconsole_server.buttons[i];
                    if(button.startLocation.x + margin >= message.startLocation.x && button.startLocation.x - margin <= message.startLocation.x
                        && button.startLocation.y + margin >= message.startLocation.y && button.startLocation.y - margin <= message.startLocation.y
                        && button.startLocation.z + margin >= message.startLocation.z && button.startLocation.z - margin <= message.startLocation.z) {
                        if(!button.pressingLocally) {
                            if(!button.pressing) {
                                await vconsole_server.WriteCommand(`ent_fire ${button.name} lock`);
                                button.pressing = true;
                            }
                            button.updateTime = Date.now();
                            await vconsole_server.WriteCommand(`ent_fire ${button.name} press`);
                            if(button.interval === null) {
                                button.interval = setInterval(() => {
                                    if(Date.now() - button.updateTime > 5000) {
                                        clearInterval(button.interval);
                                        button.interval = null;
                                        button.pressing = false;
                                        vconsole_server.WriteCommand(`ent_fire ${button.name} unlock`);
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
                    const physicsObject = vconsole_server.physicsObjects[i];
                    if(physicsObject.startLocation.x + margin >= message.startLocation.x && physicsObject.startLocation.x - margin <= message.startLocation.x
                        && physicsObject.startLocation.y + margin >= message.startLocation.y && physicsObject.startLocation.y - margin <= message.startLocation.y
                        && physicsObject.startLocation.z + margin >= message.startLocation.z && physicsObject.startLocation.z - margin <= message.startLocation.z) {
                        vconsole_server.WriteCommand(`ent_fire ${physicsObject.name} break`, true);
                        break;
                    }
                }
                break;
            case 'triggerbrush':
                // Someone has triggered something.
                for(let i = 0; i < vconsole_server.triggers.length; i++) {
                    const triggerBrush = vconsole_server.triggers[i];
                    if(triggerBrush.startLocation.x + margin >= message.startLocation.x && triggerBrush.startLocation.x - margin <= message.startLocation.x
                        && triggerBrush.startLocation.y + margin >= message.startLocation.y && triggerBrush.startLocation.y - margin <= message.startLocation.y
                        && triggerBrush.startLocation.z + margin >= message.startLocation.z && triggerBrush.startLocation.z - margin <= message.startLocation.z) {
                        if(!triggerBrush.triggeringLocally) {
                            if(!triggerBrush.triggering) {
                                await vconsole_server.WriteCommand(`ent_fire ${triggerBrush.name} disable`);
                                triggerBrush.triggering = true;
                            }
                            triggerBrush.updateTime = Date.now();
                            // Yes, you can still 'touch' triggers even if they're disabled.
                            await vconsole_server.WriteCommand(`trigger_touch ${triggerBrush.index} ${message.output}`, true);
                            if(triggerBrush.interval === null) {
                                triggerBrush.interval = setInterval(() => {
                                    if(Date.now() - triggerBrush.updateTime > config.client_grace_period) {
                                        clearInterval(triggerBrush.interval);
                                        triggerBrush.interval = null;
                                        triggerBrush.triggering = false;
                                        vconsole_server.WriteCommand(`ent_fire ${triggerBrush.name} enable`);
                                    }
                                }, 1000);
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
