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
    hud.hud = `${user.score || 0}/${dm.config.gamemodeconfig.fraglimit || 2} frags`;
    users.updateUser(hud, index);
    console.log(`[${dm.header}] Initialized user ${user.username}.`);
};
dm.playerKilled = function(data, hub, users, index, damage, attacker) {
    const attackerHud = {};
    const allUsers = users.getUsers();
    const attackerUser = allUsers[attacker];
    const localUserHud = {};
    const localUser = allUsers[index];
    // All players should be respawned when the frag limit has been reached.
    if(attackerUser.score >= dm.config.gamemodeconfig.fraglimit || 2) {
        for(let i = 0; i < allUsers.length; i++) {
            const user = allUsers[i];
            user.score = 0;
            user.health = 100;
            const respawnvector = config.respawnvectors[Math.floor(Math.random() * config.respawnvectors.length)];
            user.teleportX = respawnvector[0];
            user.teleportY = respawnvector[1];
            user.teleportZ = respawnvector[2];
            attackerHud.hud = `${attackerUser.username} won the game!\n${user.score || 0}/${dm.config.gamemodeconfig.fraglimit || 2} frags`;
            users.updateUser(attackerHud, i);
        };
    } else {
        localUserHud.hud = `You have died and respawned.\n${localUser.score || 0}/${dm.config.gamemodeconfig.fraglimit || 2} frags`;
        attackerHud.hud = `${localUser.score || 0}/${dm.config.gamemodeconfig.fraglimit || 2} frags`;
        users.updateUser(localUserHud, index);
        users.updateUser(attackerHud, attacker);
    };
};
dm.getGamemodeProperties = function(users, index) {
    const user = users.getUsers()[index];
    // If the player is teleporting, they died. Let's play a death sound for everyone else.
    if(user.teleportX != 0 && user.teleportY != 0 && user.teleportZ != 0)
        return `\nEntityGroup[${i+1}]:EmitSound("Combat.PlayerKilledNPC");`;
    return ``;
};
dm.getLocalGamemodeProperties = function(users, index) {
    const user = users.getUsers()[index];
    // If the local player is teleporting, they died. Let's play a death sound for themselves.
    if(user.teleportX != 0 && user.teleportY != 0 && user.teleportZ != 0)
        return `\nEntities:GetLocalPlayer():EmitSound("Combat.PlayerKilledNPC");`
    return ``;
};
module.exports = dm;