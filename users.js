const vscript = require('./vscript');
const Player = require('./classes/player');
const header = 'alyx-users-kiwi'
var userSlots = []
var teletime = 0;

module.exports = {
    getUsers: () => {
        return userSlots;
    },
    getOnlineUsers: () => {
        return userSlots.length;
    },
    // Add a user to the user table and assign their authid.
    newUser: (desiredUsername, authid) => {
        for(i = 0; i < userSlots.length; i++) {
            if(!userSlots[i]) continue; //???
            if(userSlots[i].username == desiredUsername) {
                return; // Username already taken at this time.
            };
        };
        const ply = new Player(desiredUsername, authid)
        userSlots.push(ply)
        ply.authid = authid;
        ply.username = desiredUsername;
        return ply;
    },
    // Remove a user from the user table.
    logOut: (index) => {
        var user = userSlots[index];
        if(!user)
            return false; // No such user.
        userSlots.splice(index, 1);
        return true;
    },
    move: (index, player, config) => {
        const user = userSlots[index];
        if(!user)
            return false; // No such user.
        userSlots[index].x = player.x;
        userSlots[index].y = player.y;
        userSlots[index].z = player.z;
        userSlots[index].headX = player.headX;
        userSlots[index].headY = player.headY;
        userSlots[index].headZ = player.headZ;
        userSlots[index].pitch = player.pitch;
        userSlots[index].yaw = player.yaw;
        userSlots[index].roll = player.roll;
        userSlots[index].leftHandX = player.leftHandX;
        userSlots[index].leftHandY = player.leftHandY;
        userSlots[index].leftHandZ = player.leftHandZ;
        userSlots[index].rightHandX = player.rightHandX;
        userSlots[index].rightHandY = player.rightHandY;
        userSlots[index].rightHandZ = player.rightHandZ;
        if(userSlots[i].health <= 0) { // If the user is dead, respawn them.
            userSlots[i].health = 100;
            const respawnvector = config.respawnvectors[Math.floor(Math.random() * config.respawnvectors.length)];
            userSlots[i].teleportX = respawnvector[0];
            userSlots[i].teleportY = respawnvector[1];
            userSlots[i].teleportZ = respawnvector[2];
            console.log(`[${header}] Respawning ${userSlots[i].username} at ${userSlots[i].teleportX}, ${userSlots[i].teleportY}, ${userSlots[i].teleportZ}.`);
        }
        if(teletime >= config.serverteletimeout) { // If the user was teleported, reset the teleport vectors when applicable
            if(userSlots[i].teleportX != 0 && userSlots[i].teleportY != 0 && userSlots[i].teleportZ != 0) {
                userSlots[i].teleportX = 0;
                userSlots[i].teleportY = 0;
                userSlots[i].teleportZ = 0;
            };
            teletime = 0;
        } else {
            teletime++;
        }
        return true;
    },
    damage: (victim, damage) => {
        for(i = 0; i < userSlots.length; i++) {
            if(userSlots[i].username == victim) {
                userSlots[i].health -= damage;
                return true;
            };
        };
        return false;
    },
    getUserByUsername: (username) => {
        for(i = 0; i < userSlots.length; i++) {
            if(userSlots[i].username == username) {
                return userSlots[i];
            };
        };
        return false;
    },
    getIndexByUsername: (username) => {
        for(i = 0; i < userSlots.length; i++) {
            if(!userSlots[i]) return false; // This is really hard to work with so I just return false.
            if(userSlots[i].username == username) {
                return i;
            };
        };
        return false;
    },
    calledGamemodeAction: (index) => {
        for (i = 0; i < userSlots.length; i++) {
            if(userSlots[i].username == index) {
                userSlots[i].gamemodeArgs = [];
                return true;
            };
        }
        return false;
    }
};