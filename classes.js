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
import * as net from 'net';
import chalk from 'chalk';

// Exports

/**
 * Client class to represent a player.
 * @param {string} username The username of the player.
 * @param {string} authid The authid of the player.
 * @param {string} memo The memo of the player.
 */
export class Client {
    username = '';
    authid = '';
    memo = '';
    /**
     * Player entity linked to the client.
     * @type {Player}
     */
    player = null;
    constructor (username, authid) {
        this.username = username;
        this.authid = authid;
    }
}

export class Entity {
    position = {
        x: 0,
        y: 0,
        z: 0
    }
    angles = {
        x: 0,
        y: 0,
        z: 0
    }
}

export class PhysicsObject extends Entity {
    index = 0;
    name = '';
    startLocation = {
        x: 0,
        y: 0,
        z: 0
    }
    door = false;
    motionDisabled = false;
    updateTime = Date.now();
    interval = null;
    localInterval = null;
    movingLocally = false;
    constructor (index, name) {
        super();
        this.index = index;
        this.name = name;
    }
}

export class Button extends Entity {
    index = 0;
    name = '';
    startLocation = {
        x: 0,
        y: 0,
        z: 0
    }
    interval = null;
    localInterval = null;
    constructor (index, name) {
        super();
        this.index = index;
        this.name = name;
    }
}

export class Player extends Entity {
    id = 0;
    health = 100;
    head = new Entity();
    leftHand = new Entity();
    rightHand = new Entity();
    teleport = new Entity();
    nameTag = new Entity();
    hudText = new Entity();
    hud = '';
    dead = true;
    lastDamage = 0;
    constructor (id) {
        super();
        this.id = id;
    }
}

export class LocalPlayer {
    headsetIndex = 0;
    nameTagIndex = 0;
    leftHandIndex = 0;
    rightHandIndex = 0;
    npcIndex = 0;
    player = new Player(0);
}

/**
 * VConsole class to represent the connection to Half-Life: Alyx.
 * @param {net.Socket} socket The socket to VConsole.
 */
export class VConsole {
    /**
     * Socket to VConsole.
     * @type {net.Socket} socket
     */
    socket = null;

    /**
     * Monitor for VConsole output.
     * @type {Object} monitor
     */
    monitor = null;

    /**
     * The game version-based protocol to use.
     * This can be found within VConsole.
     * @type {number}
     */
    protocol = 211;

    /**
     * Is it safe to transmit data to VConsole?
     * @type {boolean}
     */
    killed = false;

    /**
     * Default port, it's unlikely for this to change.
     * @type {number}
     */
    port = 29000;

    /**
     * The last time we recieved alive data from VConsole.
     */
    alive = Date.now();

    /**
     * An interval that repeatedly sends "keepalive" command to VConsole.
     * @type {Object}
     */
    interval = null;

    /** 
     * Queue for urgent commands.
     * @type {Array}
     */
    queue = [];

    /**
     * Prefix used for the map extension.
     * @type {string}
     */
    prefix = "";

    /**
     * List of physics objects known to us.
     * @type {Array}
     */
    physicsObjects = [];

    /**
     * List of buttons known to us.
     * @type {Array}
     */
    buttons = [];

    /**
     * Current map name.
     * @type {string}
     */
    mapName = "";

    constructor (socket) {
        this.socket = socket;
    }

    /**
     * Sends a command to the game.
     * @param {string} command The command string to send.
     * @param {boolean} urgent If the VConsole isn't connected, these commands will be queued and sent when the connection is established. Optional and defaults to false.
     * @param {string} vcmd The game command to send. Optional and defaults to 'CMND'.
     */
    WriteCommand(command, urgent = false, vcmd = "CMND") {
        // The command structure via TCP goes something like this:
        // CMND\00\d3\00\00\00\13\00\00status\00
        // Let's deconstruct it.
        // CMND - The first 4 bytes is the type of command. CMND is what is used by VConsole to write commands.
        // \00 - This is an unknown byte, likely a seperator.
        // d3 - The second 4 bytes is the protocol version. Half-Life: Alyx uses 211 for this so we'll use that by default.
        // \00\00\00 - These are unknown bytes, likely seperators.
        // \13 - The next byte is the byte length of the command plus 13.
        // \00\00 - These are unknown bytes, likely seperators.
        // status - The byte length specified earlier is the limit of ASCII characters in the actual command.
        // \00 - This is an unknown byte, likely a suffix.
        return new Promise((resolve, reject) => {
            if(!this.killed) {
                let command_ascii = Buffer.from(command, 'ascii');
                if(command_ascii.length + 13 > 255) {
                    console.error(chalk.red(`[ERROR] [VC] Command length is too long.`));
                    resolve();
                }
                let command_hex = (command_ascii.length + 13).toString(16);
                let protocol_hex = this.protocol.toString(16);
                // Prepend hexes with a 0 if they are only one digit.
                if(command_hex.length == 1) {
                    command_hex = '0' + command_hex;
                }
                if(protocol_hex.length == 1) {
                    protocol_hex = '0' + protocol_hex;
                }
                let vcmd_ascii = Buffer.from(vcmd, 'ascii');
                let hex_value = [
                    vcmd_ascii[0], vcmd_ascii[1], vcmd_ascii[2], vcmd_ascii[3],
                    0x00,
                    Buffer.from(protocol_hex, 'hex')[0],
                    0x00, 0x00, 0x00,
                    Buffer.from(command_hex, 'hex')[0],
                    0x00, 0x00
                ];
                // Append each byte of command_ascii to hex_value.
                for (let i = 0; i < command_ascii.length; i++) {
                    hex_value.push(command_ascii[i]);
                }
                // Append the suffix.
                hex_value.push(0x00);
                // Write the command to the socket.
                let total_hex = Buffer.from(hex_value, 'hex');
                this.socket.write(total_hex, (err) => {
                    //console.log(chalk.yellow(`[VC] [${vcmd}] ${command}`));
                    resolve();
                });
            } else if(urgent) {
                this.queue.push(command);
                resolve();
            } else {
                resolve();
            }
        });
    }

    ConnectToVConsole = () => {
        return new Promise((resolve, reject) => {
            this.alive = Date.now();
            this.socket = new net.Socket();
            // Connect to VConsole.
            this.socket.connect(this.port, '127.0.0.1');
            this.socket.on('connect', () => {   
                this.WriteVFCS(false);
                this.killed = false;
                // Send urgent commands that were queued.
                for(let i = 0; i < this.queue.length; i++) {
                    this.WriteCommand(this.queue[i], true);
                    this.queue.splice(i, 1);
                }
                resolve();
                //console.log(chalk.yellow('[VC] Connected to VConsole.'));
            });
            this.socket.on('error', (err) => {
                //console.log(chalk.red(`[VC] [ERROR] ${err}`));
                this.killed = true;
                this.socket.end(() => {
                    // Restart the server.
                    this.ConnectToVConsole();
                });
            });
            clearInterval(this.interval);
            this.interval = setInterval(() => {
                if(Date.now() - this.alive > 1500 && !this.killed) {
                    this.killed = true;
                    this.socket.end(() => {
                        // Restart the server.
                        this.ConnectToVConsole();
                    });
                } else {
                    this.WriteCommand("keepalive");
                    //if(this.prefix != "") this.WriteCommand(`ent_fire ${this.prefix}_relay trigger`, true);
                }
            }, 1000);
        });
    }

    /** 
     * Send window focus command to exclusively VConsole.
     * Using this in VR mode WILL cause lag.
     * @param {boolean} focused Whether the window is focused or not. Optional and defaults to true.
     */
    WriteVFCS(focused = true) {
        const vcfs_buffer = Buffer.from("VFCS", "ascii");
        const vcfs = Buffer.from([
            vcfs_buffer[0], vcfs_buffer[1], vcfs_buffer[2], vcfs_buffer[3], 0x00, Buffer.from(this.protocol.toString(16), "hex")[0], 0x00, 0x00,
            0x00, 0x0d, 0x00, 0x00, (focused == true ? 0x01 : 0x00)
        ]);
        this.socket.write(vcfs);
    }
}
