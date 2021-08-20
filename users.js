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
        delete userSlots[index];
        return true;
    },
    move: (index, player) => {
        const user = userSlots[index];
        if(!user)
            return false; // No such user.
        userSlots[index] = player;
        return true;
    },
    damage: (victim, damage) => {
        var user;
        var index;
        for(i = 0; i < userSlots.length; i++) {
            if(userSlots[i].username == victim.username) {
                user = userSlots[i];
                index = i;
                break;
            };
        };
        if(!user)
            return false; // No such user.
        if(!user.authid == victim.authid)
            return false; // Not the correct authid, discard.
        
        return true;
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
            if(userSlots[i].username == username) {
                return i;
            };
        };
        return false;
    }
};