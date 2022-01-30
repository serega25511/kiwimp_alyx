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
        vconsole_server = alyx.InitVConsole(ws);
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
                //await vconsole_server.WriteCommand(`changelevel ${message.map}`);
                await vconsole_server.WriteCommand(`addon_play ${message.map}`);
                await vconsole_server.WriteCommand(`addon_tools_map ${message.map}`);
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
