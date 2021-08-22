class Player {
	// CLIENT-ONLY VARIABLES
	action = "";
	victimDamage = 0;
	victimIndex = 0;
	gamemodeArgs = [];
	// These are the user's properties.
	username = "Player"; // The username of the user.
	authId = 0; // The authid of the user. (This is their unique id and will be used alongside their username for server-to-client communication.)
	gamemodeProps = {}; // Special properties for the gamemode. DM uses this to store if the played was fragged or not.
	hud = ""; // The HUD to be displayed in the game.
	showHeadsetLocally = false; // Whether or not the headset should be shown locally for this player.
	// The player's location coordinates in the world.
	x = 0; // The x coordinate of the user.
	y = 0; // The y coordinate of the user.
	z = 0; // The z coordinate of the user.
	teleportX = 0; // The x coordinate of the user's next destination.
	teleportY = 0; // The y coordinate of the user's next destination.
	teleportZ = 0; // The z coordinate of the user's next destination.
	pitch = 0; // The rotational pitch of the user.
	yaw = 0; // The rotational yaw of the user.
	roll = 0; // The rotational roll of the user.
	headX = 0; // The x coordinate of the head of the user.
	headY = 0; // The y coordinate of the head of the user.
	headZ = 0; // The z coordinate of the head of the user.
	leftHandX = 0; // The x coordinate of the user's left hand.
	leftHandY = 0; // The y coordinate of the user's left hand.
	leftHandZ = 0; // The z coordinate of the user's left hand.
	leftHandPitch = 0; // The rotational pitch of the user's left hand.
	leftHandYaw = 0; // The rotational yaw of the user's left hand.
	leftHandRoll = 0; // The rotational roll of the user's left hand.
	rightHandX = 0; // The x coordinate of the user's right hand.
	rightHandY = 0; // The y coordinate of the user's right hand.
	rightHandZ = 0; // The z coordinate of the user's right hand.
	rightHandPitch = 0; // The rotational pitch of the user's right hand.
	rightHandYaw = 0; // The rotational yaw of the user's right hand.
	rightHandRoll = 0; // The rotational roll of the user's right hand.
	// The following are the user's current stats. (Will update once vscript gets a chance to run)
	health = 100; // The user's health points. (Updates with Alyx's health.)
	score = 0; // Unused score for custom game types.
};
module.exports = Player;
