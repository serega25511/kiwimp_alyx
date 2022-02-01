# Kiwi's Co-Op Mod for Half-Life: Alyx (KCOM)

A work-in-progress customizable multiplayer and co-op mod for [Half-Life: Alyx](https://store.steampowered.com/app/546560/HalfLife_Alyx/) by [KiwifruitDev](https://github.com/TeamPopplio).

## Warning
**You are at your own risk if you use this mod!**

Both client and server-side functionality can easily be exploited when port forwarding is enabled.

It is recommended to keep it simple and to use it locally or only over the internet with a password.

## Information
KCOM takes a different approach compared to other multiplayer mods.

- This mod 'fakes' a VConsole application compatible with Half-Life: Alyx.
    - You won't be able to open VConsole at the same time.
    - Half-Life: Alyx needs the ``-console -vconsole`` arguments to be passed through.
    - This is done using TCP sockets with the node.js ``net.Socket()`` class.
- Alongside that, as it is improbable to receive output directly from VConsole, this mod also captures network packets from VConsole's port number.
    - The 'fake' VConsole can send data to the game, but can't receive data.
    - Both of these actions (sending and receiving) are done using separate modules.
    - This is done using the node.js [cap](https://github.com/mscdex/cap) library.
- VConsole is used as there is no way to send data directly to the game.
    - An addon must be enabled in order for this mod to work, the addon uses VScript to share entity data for up to 16 players.
    - Output from VScript is proxied through this mod and sent as input using console commands.
    - Examples of commands include ``ent_setpos``, ``ent_setang``, ``ent_fire``, etc.
- The output is a seamless and smooth networking environment.
    - The heads and hands of players will display for everyone.
    - Triggering events and moving props will do the same for everyone else.
    - You can also damage other players if enabled, alongside seeing their health.

## Installation
The best way to install all necessary dependencies automatically is by using the new [installer script](https://gist.github.com/TeamPopplio/993a1abbe23df259c08f47c6847be3a4):

1. View the [installer script source code via GitHub Gist](https://gist.github.com/TeamPopplio/993a1abbe23df259c08f47c6847be3a4).
2. Click the *"Raw"* button.
3. Right click within your browser and select *"Save as"* or similar.
4. Save the file to your computer as ``installer.bat``.
    - Please ensure that file name extensions are visible witihin File Explorer before saving.
    - Make sure that the *"Save as type"* is set to *"All files (\*.\*)"* and remove the ``.txt`` extension if you have to.
5. Open the installer file by double-clicking it within File Explorer.
6. Follow the instructions, then install [npcap](https://npcap.com/) and subscribe to the [Steam Workshop addon](https://steamcommunity.com/sharedfiles/filedetails/?id=2739356543) when prompted.
    - The installer will automatically open the npcap installer and the Steam Community page for the addon within Steam.
    - If something goes wrong during the installation process (i.e ``git`` or ``npm`` errors), try running the installer again.
7. Inside of Steam, open the settings menu for Half-Life: Alyx and type ``-console -vconsole`` into the launch options.
    - Optionally, add ``-novr`` to disable VR mode.
8. Open the game within Steam and enable the addon.
    - If you disabled VR mode, you will need to hold CTRL to crouch and press E to navigate through the menus.
9. Make sure VConsole is not open.
    - VConsole is a seperate window that is usually opened by the tilde (~) key. It should not be open when using this mod.
10. Open ``launch.bat`` within the ``kiwimp_alyx`` directory to run the config wizard and start connecting to the server.
    - If you are connecting to a friend, make sure that you have their public IP address and that the port ``27025`` is forwarded on their router.

Once you have connected to the server, you can start playing!

Can't run the installer? View legacy instructions [here](https://gist.github.com/TeamPopplio/a510ba7b3a825dff3e0cb88c66f04f01).

## Updating
You can update the mod using the following steps:

1. Open the ``update.bat`` file within the ``kiwimp_alyx`` directory.
2. Make sure that your Half-Life: Alyx Steam Workshop addons are up to date.
3. Open the ``launch.bat`` file within the directory containing the application.
    - If your config file is outdated, you will be prompted with the config wizard.

This process should be relatively quick, it is recommended to install Git to ensure that updates are seamless.

## Troubleshooting
If you experience network lag, severe input delay, invisible players, or sudden disconnections, you can try the following procedures in any order:

**Make sure VConsole is closed while the game is running, this is the most common cause of issues.**

**If you are using a cloud gaming PC, you CAN NOT host a server. A VPS is required as you must open a port for the game to connect to.**

- Updating KCOM to the latest version.
- Restarting Half-Life: Alyx.
- Disabling VConsole logging via config.
- Restarting KCOM.
- Using non-vr mode (``-novr``) if playing in VR. (Ideally, both methods should work but this is not guaranteed.)
- Restarting your computer.
- Using a different port number.
- Changing usernames and AuthIDs.
- Tabbing into the game as soon as possible.
- Disabling other addons.
- Using a different map name.
- Using port forwarding if hosting a server using the internet with UPNP mapping.
- Disabling VPNs or proxy servers, this includes LAN applications such as Hamachi and ZeroTier.
- Allowing node.js and hlvr.exe (Half-Life: Alyx) through the firewall.
- Reinstalling npcap with a different configuration, keep note of the last good configuration for future use.
- Try waiting up to a minute when all clients are connected before moving excessively in-game. You can check the latency by sending a chat message.

If the problem persists, please contact me on my Discord linked below.

## Support
Join my personal [Discord Server](https://discord.gg/3X3teNecWs) to ask me anything!

There is a channel dedicated to `kiwis-co-op-mod` in the server.

My username is [Kiwifruit#2003](https://discord.com/users/728082336536854559).

## License
This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

Please see the `LICENSE` file for more information.

## Software
- [cap](https://github.com/mscdex/cap)
    - Used for sniffing VConsole output.
    - Licensed under the [MIT License](https://github.com/mscdex/cap/blob/master/LICENSE).
- [chalk](https://github.com/chalk/chalk)
    - Used to pretty-print output for the command prompt.
    - Licensed under the [MIT License](https://github.com/chalk/chalk/blob/main/license).
- [ws](https://github.com/websockets/ws/)
    - Used as the method of connectivity between clients and servers.
    - Licensed under the [MIT License](https://github.com/websockets/ws/blob/master/LICENSE).
- [node.js](https://nodejs.org/)
    - Used as the application runtime.
    - Must be installed by the end-user.
    - Licensed under the [MIT License](https://github.com/nodejs/node/blob/master/LICENSE).
- [npcap](https://npcap.org/)
    - Required by the ``cap`` node.js library.
    - Must be installed by the end-user.
    - View its license [here](https://github.com/nmap/npcap/blob/master/LICENSE).

## Related Projects
- [alyx-multiplayer](https://github.com/ZacharyTalis/alyx-multiplayer)
    - Inspiration for this project and its initial implementation.
    - This repository does not contain any code from this project.
    - Licensed under the [MIT License](https://github.com/ZacharyTalis/alyx-multiplayer/blob/master/LICENSE).
