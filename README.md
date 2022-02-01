# Kiwi's Co-Op Mod for Half-Life: Alyx (KCOM)

A work-in-progress customizable multiplayer and co-op mod for [Half-Life: Alyx](https://store.steampowered.com/app/546560/HalfLife_Alyx/) by [KiwifruitDev](https://github.com/TeamPopplio).

## A word of warning
**You are at your own risk if you use this mod!**

Both client and server-side functionality can easily be exploited when port forwarding is enabled.

It is recommended to keep it simple and to use it locally or only over the internet with a password.

## How does this work?
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

## How do I get started?
First, you'll need to install some prerequisite software, assuming you already have Half-Life: Alyx installed:

1. Install [node.js](https://nodejs.org/) >=16 with native build tools.
    - Build tools are required for the ``cap`` library.
2. Install [npcap](https://npcap.org/).
    - This is required for the ``cap`` library to function.
3. Install [git](https://git-scm.com/).
    - This is used to clone the repository to allow for updating but it is not required.

Now that you have the required software installed, you can install the application:

4. Open a `Git Bash` window within the directory you would like to install the application.
    - It does not nesearily need to be the same directory as the game.
5. Clone the repository using ``git clone https://github.com/TeamPopplio/kiwimp_alyx.git`` within the Git Bash window.
    - Alternatively, download the zip file via GitHub and extract it.
6. Navigate to the folder containing the repository and open the ``install-update.bat`` file (Ignore Git errors if you do not have Git installed).
    - This will install the required dependencies and compile ``cap`` using [npm](https://www.npmjs.com/) alongside updating via Git if possible.

After the installation is complete, you can now install the addon:

7. Download the [latest release](https://github.com/TeamPopplio/kiwimp_alyx/releases) and extract it into the same directory as the game.
    - By default, this will be ``C:\Program Files (x86)\Steam\steamapps\common\Half-Life Alyx``.
8. Inside of Steam, head to launch options and add the parameters ``-console -vconsole`` (Optionally, add ``-novr`` to disable VR support).
    - This will allow the application to interact with the game.
9. Launch the game and enable the addon through the menu.
    - If VR is disabled, launch VConsole using the tilde key (``~``) and use the ``addon_list`` command to click ``(enable)`` on the addon.

Finally, you can now launch the application:

10. Open ``launch.bat`` within the directory containing the application (Make sure VConsole is closed while the game is running).
    - This will first start the config wizard to guide you through the setup before launching the application.
11. If you hear a sound coming from Half-Life: Alyx, connection succeeded (This sound plays whenever a client sends a chat message).
    - You can use the ``/vc`` command within the command prompt to send commands to the game, alongside sending chat messages.
12. When you're finished playing, press Ctrl+C within the command prompt to close the connection and shut down gracefully.
    - This will keep the game running but you will be disconnected from the server.

Have fun!

## How do I update?
You can update the mod using the following steps:

1. Open the ``install-update.bat`` file within the directory containing the application.
    - As previously mentioned, this will update via Git and reinstall the dependencies.
2. Download the [latest release](https://github.com/TeamPopplio/kiwimp_alyx/releases), delete the existing version and extract the new version into the same directory as the game.
    - This will ensure that there are no conflicts with the existing version.
3. Open the ``launch.bat`` file within the directory containing the application.
    - If your config file is outdated, you will be prompted with the config wizard.

This process should be relatively quick, it is recommended to install Git to ensure that updates are seamless.

## How do I fix lag?
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

## Software Used
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

## Code References
- [alyx-multiplayer](https://github.com/ZacharyTalis/alyx-multiplayer)
    - Inspiration for this project and its initial implementation.
    - This repository does not contain any code from this project.
    - Licensed under the [MIT License](https://github.com/ZacharyTalis/alyx-multiplayer/blob/master/LICENSE)
