local health = 100;
local player = Entities:FindByClassname(nil, "player");
local playerCenter = player:GetCenter();
local playerAngles = player:GetAnglesAsVector();
local playerHealth = player:GetHealth();
Msg("KIWI HEADPOS "..playerCenter[1].." "..playerCenter[2].." "..playerCenter[3]);
Msg("");
Msg("KIWI HEADANG "..playerAngles[1].." "..playerAngles[2].." "..playerAngles[3]);
Msg("");
Msg("KIWI HP "..playerHealth);
Msg("");
if playerHealth < health then
    //local dmg = CreateDamageInfo(self, self, Vector(0, 0, 100000), Vector(0,0,0), 1000, DMG_BURN)
    //player:TakeDamage(dmg);
    //DestroyDamageInfo(dmg);
    player:SetHealth(100);
end
