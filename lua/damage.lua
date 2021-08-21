Msg("");
-- We literally don't if entities are being damaged or not so we'll cycle through all of them and send them to the server.
for k,v in ipairs(EntityGroup) do
	Msg("");
	local health = v:GetHealth()
	Msg("KIWI DMG "..health.." "..k);
	--if(health <= 0) then -- Hey don't die!
		v:SetHealth(100);
	--end
end;
