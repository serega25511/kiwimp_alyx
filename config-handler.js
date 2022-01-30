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
import * as fs from 'fs';
import * as readline from 'readline';
import chalk from 'chalk';

// Exports
export let config = {};

// Variables
const configloc = (process.argv[2] !== undefined) ? process.argv[2] : ((process.env.NODE_ENV === 'production') ? './kiwi_config.json' : './kiwi_config.dev.json');
const configtemplate = JSON.parse(fs.readFileSync('./kiwi_config.template.json', 'utf8'));
const nodepackage = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const validtypes = ["string", "number", "boolean", "note"];
let activeprompts = [];

/**
 * Loads the config file.
 * @returns {Promise} The config object.
 */
 export function LoadConfig() {
    if(fs.existsSync(configloc)) {
        config = JSON.parse(fs.readFileSync(configloc, 'utf8'));
        if(config.version !== nodepackage.version && config.disable_config_setup === 'true') {
            console.log(chalk.red.bold(`\n[ERROR] The config file is out of date. Config setup will now begin, please open the previous config file for reference.`));
            return new Promise((resolve, reject) => {
                StartConfigSetup(nodepackage.version).then((config) => {
                    resolve(config);
                });
            });
        }
    }
    if(!(config.disable_config_setup === 'true')) {
        return new Promise(async (resolve, reject) => {
            StartConfigSetup(nodepackage.version).then((config) => {
                resolve(config);
            });
        });
    }
    return Promise.resolve(config);
}

/**
  * This function starts a guided config setup process for the end user.
  * @returns {boolean} Whether or not the config setup was successful.
  */
 function StartConfigSetup() {
    return new Promise((resolve, reject) => {
        console.log(chalk.magenta.bold("\nWelcome to kiwimp_alyx's config setup! This will guide you through the process of setting up the config JSON file."));
        console.log(chalk.magenta("Pay attention to the prompts and the types of values you can enter, invalid values will output their default value.\n"));
        for(let key in configtemplate) {
            if(configtemplate.hasOwnProperty(key)) {
                let value = configtemplate[key];
                activeprompts.push({key: key, value: value});
            }
        }
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        let next = activeprompts.shift();
        ConfigChoice(next.key, next.value, rl).then((config) => {
            resolve(config);
        });
    });
}

/**
  * Proceed with user prompt for a config option.
  * @param {string} key The key of the config option.
  * @param {string} value The value of the config option.
  * @returns {boolean} Whether or not the config setup was successful.
  */
function ConfigChoice(key, value, rl) {
    return new Promise((resolve, reject) => {
        if(value.name !== undefined)
            console.log(chalk.yellow.bold(`${value.name || ""}`));
        if(value.description !== undefined)
            console.log(chalk.green(`${value.description || ""}`));
        if(value.default !== undefined)
            console.log(chalk.blueBright(`Default: ${value.default || ""}`));
        if(value.type !== undefined && validtypes.includes(value.type)) {
            // Readline is used to prompt the user for input.
            // We'll pause the process until the user has inputted a value.
            // FIXME: Placing the rest of the note's description here.
            rl.question(chalk.blueBright((value.type != "note") && `[${value.type}] > ` || chalk.green("Otherwise, press Ctrl+C to exit without saving.")), (answer) => {
                switch(value.type) {
                    case "string":
                        config[key] = (answer === "") ? value.default : answer;
                        break;
                    case "number":
                        config[key] = (isNaN(parseInt(answer))) ? parseInt(value.default) : parseInt(answer);
                        break;
                    case "boolean":
                        config[key] = (answer === "") ? value.default.toLowerCase() : answer.toLowerCase();
                        break;
                }
                console.log(chalk.blue.italic(`${key}: ${config[key]}`));
                // Check whether to skip or continue.
                if(activeprompts.length > 0) {
                    let next = activeprompts.shift();
                    if(value.skip && value.skip[config[key]]) {
                        // Skip to key in skip variable.
                        let i = activeprompts.length;
                        while(i--) {
                            if(next.key === value.skip[config[key].toString()]) {
                                break;
                            }
                            next = activeprompts.shift();
                        }
                    }
                    // Proceed with next prompt.
                    ConfigChoice(next.key, next.value, rl).then((config) => {
                        resolve(config);
                    });
                }
            });
        } else {
            // Add or update package version for config.
            config.version = nodepackage.version;
            // Write the config to file.
            fs.writeFileSync(configloc, JSON.stringify(config, null, 2));
            rl.close();
            resolve(config);
        }
    });
}
