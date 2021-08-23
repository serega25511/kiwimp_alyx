var dm = require("./base")

dm.name = "Deathmatch"
dm.description = "The goal is to frag until the frag limit."
dm.playerAuthorized = function(data, hub, users, index) {
    const hud = {};
    const user = users.getUsers()[index];
    if(user === undefined) return; // ???
    const respawnvector = dm.config.respawnvectors[Math.floor(Math.random() * dm.config.respawnvectors.length)];
    hud.teleportX = respawnvector[0];
    hud.teleportY = respawnvector[1];
    hud.teleportZ = respawnvector[2];
    hud.hud = `Welcome to Deathmatch.\\n${user.score}/${dm.config.gamemodeconfig.fraglimit || 2} frags`;
    users.updateUser(hud, index);
    console.log(`[${dm.header}] Initialized user ${user.username}.`);
};
dm.playerDamage = function(data, hub, users, index, damage, attacker) {
    const attackerHud = {};
    const allUsers = users.getUsers();
    const attackerUser = allUsers[attacker];
    const localUserHud = {};
    const localUser = allUsers[index];
    if(!localUserHud.gamemodeProps) localUserHud.gamemodeProps = {};
    if(!attackerHud.gamemodeProps) attackerHud.gamemodeProps = {};
    // Accumulate damage per player.
    if(attackerUser.gamemodeProps.currentPlayer == localUser.username) {
        attackerHud.gamemodeProps.damage = attackerUser.gamemodeProps.damage+damage;
    } else {
        attackerHud.gamemodeProps.damage = damage;
    };
    attackerHud.gamemodeProps.currentPlayer = localUser.username;
    attackerHud.gamemodeProps.totalDamage = (attackerUser.gamemodeProps.totalDamage|| 0)+damage;
    if(localUser.gamemodeProps.fragged != true && localUser.teleportX == 0 && localUser.teleportY == 0 && localUser.teleportZ == 0) {
        localUserHud.hud = `You took ${attackerHud.gamemodeProps.damage} damage from ${localUser.username}!\\n${localUser.score}/${dm.config.gamemodeconfig.fraglimit || 2} frags`;
        attackerHud.hud = `You hurt ${localUser.username} for ${attackerHud.gamemodeProps.damage} damage!\\n${attackerUser.score}/${dm.config.gamemodeconfig.fraglimit || 2} frags`;
        users.updateUser(localUserHud, index);
        users.updateUser(attackerHud, attacker);
    };
};
dm.playerKilled = function(data, hub, users, index, damage, attacker) {
    const attackerHud = {};
    const allUsers = users.getUsers();
    const attackerUser = allUsers[attacker];
    const localUserHud = {};
    const localUser = allUsers[index];
    // All players should be respawned when the frag limit has been reached.
    if(attackerUser.score+1 >= (dm.config.gamemodeconfig.fraglimit || 2)) {
        console.log(`[${dm.header}] The game has ended, ${attackerUser.username} has won! Respawning all players.`);
        for(let i = 0; i < allUsers.length; i++) {
            const genericHud = {};
            console.log(`[${dm.header}] ${allUsers[i].username} respawned.`);
            genericHud.score = 0;
            genericHud.health = 0;
            genericHud.gamemodeProps = {
                fragged: true,
                currentPlayer: "",
                damage: 0
            };
            genericHud.hud = `${attackerUser.username} won the game with ${attackerUser.gamemodeProps.totalDamage} total damage!\\n0/${dm.config.gamemodeconfig.fraglimit || 2} frags`;
            users.updateUser(genericHud, i);
        };
    } else {
        console.log(`[${dm.header}] ${attackerUser.username} has fragged ${localUser.username}!`);
        localUserHud.hud = `${attackerUser.username} fragged you at ${attackerUser.gamemodeProps.damage || 0} damage!\\n${localUser.score}/${dm.config.gamemodeconfig.fraglimit || 2} frags`;
        if(!localUserHud.gamemodeProps) localUserHud.gamemodeProps = {};
        localUserHud.gamemodeProps.fragged = true;
        localUserHud.gamemodeProps.currentPlayer = "";
        localUserHud.gamemodeProps.damage = 0;
        if(!attackerHud.gamemodeProps) attackerHud.gamemodeProps = {};
        attackerHud.gamemodeProps.currentPlayer = "";
        attackerHud.gamemodeProps.damage = 0;
        attackerHud.score = attackerUser.score + 1;
        attackerHud.gamemodeProps.totalDamage = attackerUser.gamemodeProps.totalDamage;
        attackerHud.hud = `You fragged ${localUser.username} at ${attackerUser.gamemodeProps.damage || 0} damage!\\n${attackerHud.score}/${dm.config.gamemodeconfig.fraglimit || 2} frags`;
        users.updateUser(localUserHud, index);
        users.updateUser(attackerHud, attacker);
    };
};
dm.getGamemodeProperties = function(users, index) {
    const user = users.getUsers()[index];
    // If a player was fragged, play a death sound for everyone else.
    if(user.gamemodeProps.fragged == true) {
        return `\nEntityGroup[${i+1}]:EmitSoundParams("Combat.PlayerKilledNPC", 1, 1, 1);`;
    };
    return ``;
};
const soundThreshold = 10;
var soundAmount = 0;
dm.getLocalGamemodeProperties = function(users, index) {
    const user = users.getUsers()[index];
    // If the local player was fragged, play a death sound for themselves.
    if(user.gamemodeProps.fragged == true) {
        if(soundAmount >= soundThreshold) {
            if(!user.gamemodeProps) localUserHud.gamemodeProps = {};
            user.gamemodeProps.fragged = false;
            soundAmount = 0;
            return ``;
        } else {
            soundAmount++;
        };
        return `\nEntities:GetLocalPlayer():EmitSound("Combat.PlayerKilledNPC");`
    };
    return ``;
};
module.exports = dm;