-- This script is ran every time a collision box entity is damaged.
Msg("");
Msg("KIWI DMGSTART");
-- We literally don't know what entity was damaged, so we'll cycle through all of them and send them to the server.
for k,v in ipairs(EntityGroup) do
	Msg("KIWI DMGKEY "..k);
	Msg("KIWI DMG "..v:GetHealth());
end;
Msg("KIWI DMGEND");
