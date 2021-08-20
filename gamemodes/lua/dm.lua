-- Keep in mind that static functions do not automatically update and require a changelevel.
Msg("This is the base gamemode. Welcome.")
local player = Entities.GetLocalPlayer()
-- You can get networked collision boxes ("players") by calling EntityGroup[Player].
