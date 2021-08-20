Msg("");
-- We literally don't if entities are being damaged or not so we'll cycle through all of them and send them to the server.
for k,v in ipairs(EntityGroup) do
	Msg("");
	Msg("KIWI DMG "..v:GetHealth().." "..k);
	v:SetHealth(100);
end;
