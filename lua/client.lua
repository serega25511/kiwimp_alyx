local player = Entities:FindByClassname(nil, "player");

local playerOrigin = player:GetOrigin();
local playerCenter = player:GetCenter();
local playerAngles = player:GetAnglesAsVector();
local playerHealth = player:GetHealth();

-- thank you Epic#4527 from the source 2 modding discord!
-- https:--discord.com/channels/692784980304330853/713548145358929990/715966997103509578
function GetHandFromController(controller)
    for k, child in ipairs(controller:GetChildren()) do
        if (child:GetClassname() == "hlvr_prop_renderable_glove") then
            return child
        end
    end
    return controller
end

local head = player:GetHMDAvatar()

if head then
    local leftController = head:GetVRHand(0)
    local rightController = head:GetVRHand(1)
    local leftHand = GetHandFromController(leftController)
    local rightHand = GetHandFromController(rightController)

    local playerHead = head:GetCenter();
    local playerLeftHand = leftHand:GetCenter();
    local playerRightHand = rightHand:GetCenter();
    local playerLeftHandAngles = leftHand:GetAnglesAsVector();
    local playerRightHandAngles = rightHand:GetAnglesAsVector();

    Msg("KIWI HEADPOS "..playerHead[1].." "..playerHead[2].." "..playerHead[3]);
    Msg("");
    Msg("KIWI LHANDPOS "..playerLeftHand[1].." "..playerLeftHand[2].." "..playerLeftHand[3]);
    Msg("");
    Msg("KIWI RHANDPOS "..playerRightHand[1].." "..playerRightHand[2].." "..playerRightHand[3]);
    Msg("");
    Msg("KIWI LHANDANG "..playerLeftHandAngles[1].." "..playerLeftHandAngles[2].." "..playerLeftHandAngles[3]);
    Msg("");
    Msg("KIWI RHANDANG "..playerRightHandAngles[1].." "..playerRightHandAngles[2].." "..playerRightHandAngles[3]);
    Msg("");
else
    Msg("KIWI HEADPOS "..playerCenter[1].." "..playerCenter[2].." "..playerCenter[3]+30);
    Msg("");
end

Msg("KIWI POS "..playerOrigin[1].." "..playerOrigin[2].." "..playerOrigin[3]);
Msg("");
Msg("KIWI ANG "..playerAngles[1].." "..playerAngles[2].." "..playerAngles[3]);
Msg("");
Msg("KIWI HP "..playerHealth);
Msg("");

-- We don't want the player to die in multiplayer, let's make make them respawn.
if playerHealth <= 1 then
    player:SetHealth(100);
    local start = FindByClassname(nil, "info_player_start");
    if start then
        player:SetOrigin(start:GetOrigin());
    end
end
