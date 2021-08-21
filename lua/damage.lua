Msg("");
-- We literally don't if entities are being damaged or not so we'll cycle through all of them and send them to the server.
for k,v in ipairs(EntityGroup) do
	Msg("");
	local health = v:GetHealth()
	if health < 100 then
		Msg("KIWI DMG "..100-health.." "..k);
	end
	v:SetHealth(100);
end;
