-- This file is executed every time the "timer" entity fires the "relay" in kiwimp_alyx_x16.
-- Keep in mind that static functions do not automatically update and require a changelevel.
Msg(""); -- Blank lines are used to buffer vconsole so much it has so accept our vconsole trick.

-- You can get networked collision boxes ("players") by calling EntityGroup[Player].
-- You can also use the "players" to check if other players are in a certain area for custom maps.

-- Consider modifying kiwimp_alyx_x16.vmap and adding a suffix (e.g. "_nameofgamemode.vmap").
-- The "script_gamemode" entity contains the default EntityGroup values, which can be modified.

-- Be aware that modifying script_gamemode's EntityGroups will not allow you to use the default values anymore.
-- This can be remedied by creating a new logic_script entity and using RunScriptFile with "vscript0.lua" as the script.

-- Though vscripts are intended for server owners, you may set the config.json's "vscript" value to an array of paths to script files.
-- This will allow you to use multiple scripts at the same time for one gamemode.

-- Alternatively, you can duplicate script_gamemode and change the EntityGroup values and just check if their classes are relevant.
