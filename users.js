const vscript = require('./vscript');
const Player = require('./classes/player');
var userSlots = []
var onlineUsers = 0

module.exports = {
    getUsers: () => {
        return userSlots;
    },
    getOnlineUsers: () => {
        return onlineUsers;
    },
    // Make sure the user table does not already contain the username.
    // If it does, then the user might as well be already logged in.
    checkUser: (desiredUsername) => {
        for(i = 0; i < onlineUsers; i++) {
            if(userSlots[i].username == desiredUsername)
                return true;
        }
        return false;
    },
    // Add a user to the user table and assign their authid.
    newUser: (desiredUsername, authid) => {
        for(i = 0; i < onlineUsers; i++) {
            if(userSlots[i].username == desiredUsername) {
                return false; // Username already taken at this time.
            };
        };
        userSlots[onlineUsers] = new Player(desiredUsername, authid);
        userSlots[onlineUsers].authid = authid;
        userSlots[onlineUsers].username = desiredUsername;
        onlineUsers++;
        return true;
    },
    // Remove a user from the user table.
    logOut: (username) => {
        var user;
        var index;
        for(i = 0; i < onlineUsers; i++) {
            if(userSlots[i].username == username) {
                user = userSlots[i];
                index = i;
                break;
            };
        };
        if(!user)
            return false; // No such user.
        delete userSlots[index];
        onlineUsers--;
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
        for(i = 0; i < onlineUsers; i++) {
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
    getUserByUsername: (player) => {
        for(i = 0; i < onlineUsers; i++) {
            if(userSlots[i].username == player) {
                return userSlots[i];
            };
        };
        return false;
    },
    getIndexByUsername: (player) => {
        for(i = 0; i < onlineUsers; i++) {
            if(userSlots[i].username == player) {
                return i;
            };
        };
        return false;
    }
};