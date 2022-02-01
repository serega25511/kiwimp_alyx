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
import * as fs from 'fs';
import chalk from 'chalk';
import * as confighandler from './config-handler.js';
import * as server from './mp-server.js';
import * as client from './mp-client.js';

// Variables
const nodepackage = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Display copyright and version information.
console.log(chalk.blueBright(
    `===============================================\n`
    +`${nodepackage.name} v${nodepackage.version} - ${nodepackage.description}\n`
    +`Copyright (c) ${nodepackage.author}, all rights reserved\n`
    +`This software is licensed under the ${nodepackage.license} License\n`
    +`https://www.github.com/TeamPopplio/kiwimp_alyx/\n`
    +`===============================================`
));

// Start the config setup process, or load config if it exists.
confighandler.LoadConfig().then((config) => {
    if(config.server_enabled === 'true') {
        // Start the server.
        server.StartServer(config);
    }
    if(config.client_enabled === 'true') {
        // Start the client.
        client.StartClient(config);
    }
}).catch((err) => {
    // Handle errors.
    console.error(chalk.redBright(`[ERROR] ${err.stack}`));
});
