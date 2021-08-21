const vscript = require('./vscript');
const Player = require('./classes/player');
var userSlots = []

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
                return false; // Username already taken at this time.
            };
        };
        const ply = new Player(desiredUsername, authid)
        userSlots.push(ply)
        ply.authid = authid;
        ply.username = desiredUsername;
        return true;
    },
    // Remove a user from the user table.
    logOut: (index) => {
        var user = userSlots[index];
        if(!user)
            return false; // No such user.
        userSlots.splice(index, 1);
        return true;
    },
    move: (index, player) => {
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
        /*
        if(player.health <= 0) { // If the user is dead, respawn them.
            player.health = 100;
            player.x = config.respawnvector[0];
            player.y = config.respawnvector[1];
            player.z = config.respawnvector[2];
        };
        */
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
    }
};