# kiwimp_alyx
A work-in-progress customizable multiplayer mod for Half-Life: Alyx.

## Credits
- [NoobHub](https://github.com/Overtorment/NoobHub)
- [alyx-multiplayer](https://github.com/ZacharyTalis/alyx-multiplayer)

## Example Config
The following configuration file should be saved as ``config.json`` in the root directory of ``kiwimp_alyx``:
```json
{
    "server": "localhost",
    "dedicated": false,
    "publicip": "68.108.19.62",
    "port": 27025,
    "vconsoleip": "127.0.0.1",
    "vconsoleport": 29000,
    "password": "",
    "maxplayers": 16,
    "map": "mp_kiwitest",
    "hostname": "A Half-Life: Alyx server",
    "username": "Alyx",
    "gamemode": "base",
    "verbose": true,
    "writeserver": false,
    "printmovesuccess": false,
    "npccollision": false,
    "clientdisallowgamemodes": false,
    "clientdisallowvscripts": false,
    "vscripts": [],
    "servervscriptdir": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Half-Life Alyx\\game\\hlvr_addons\\kiwimp_alyx\\scripts\\vscripts\\",
    "clientvscript": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Half-Life Alyx\\game\\hlvr_addons\\kiwimp_alyx\\scripts\\vscripts\\client.lua",
    "freemode": false,
    "pingtimeout": 2000,
    "pinginterval": 10,
    "serverinterval": 10,
    "servertimeout": 5000,
    "channel": "kiwi"
}
```