# kiwimp_alyx
A work-in-progress customizable multiplayer mod for Half-Life: Alyx.

## A Word of Warning
**You are at your own risk if you use this mod!**

**This mod is not supported by Valve!**

Both client and server-side functionality can easily be exploited.

Players can noclip beyond your control, they can send bad packets, and they can cause crashes.

Do not, under any circumstances, use this mod for a public server.

It is recommended to keep it simple and to use it locally or with friends only.

## Support
As the author to a new mod, I am free to offer help and support.

Join my [Discord Server](https://discord.gg/3X3teNecWs) and ask me anything!

## Credits
- [NoobHub](https://github.com/Overtorment/NoobHub)
- [alyx-multiplayer](https://github.com/ZacharyTalis/alyx-multiplayer)

## Example Config
The config file determines both client and server settings.

In the future, there will be more documentation regarding the config file.

The following config file should be saved as ``config.json`` in the root directory of ``kiwimp_alyx``:
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
    "dedicatedhostpassword": "",
    "gamemode": "base",
    "gamemodeconfig": {},
    "verbose": false,
    "writeserver": false,
    "printmovesuccess": false,
    "npccollision": true,
    "clientdisallowgamemodes": false,
    "clientdisallowvscripts": false,
    "showheadsets": true,
    "clientshowmyheadset": true,
    "showhud": true,
    "globalhudscale": 200,
    "vscripts": [],
    "respawnvectors": [
        [0,0,0]
    ],
    "servervscriptdir": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Half-Life Alyx\\game\\hlvr_addons\\kiwimp_alyx\\scripts\\vscripts\\",
    "freemode": false,
    "pingtimeout": 1000,
    "pinginterval": 0,
    "serverinterval": 10,
    "servertimeout": 1000,
    "channel": "kiwi"
}
```