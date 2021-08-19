function Damaged()
	Msg("");
	Msg("KIWI DMGSTART");
	for k,v in ipairs(EntityGroup) do
		Msg("KIWI DMGKEY "..k);
		Msg("KIWI DMG "..v:GetHealth());
	end;
	Msg("KIWI DMGEND");
end;