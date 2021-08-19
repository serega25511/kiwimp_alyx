class Player {
	// Construct a player.
	constructor(username, authid) {
		this.username = username;
		this.authid = authid;
	};
	// These are the user's properties.
	username = "Player"; // The username of the user.
	authId = 0; // The authid of the user. (This is their unique id and will be used alongside their username for server-to-client communication.)
	// The player's location coordinates in the world.
	x = 0; // The x coordinate of the user.
	y = 0; // The y coordinate of the user.
	z = 0; // The z coordinate of the user.
	pitch = 0; // The rotational pitch of the user.
	yaw = 0; // The rotational yaw of the user.
	roll = 0; // The rotational roll of the user.
	centerX = 0; // The x coordinate of the center of the user's body.
	centerY = 0; // The y coordinate of the center of the user's body.
	centerZ = 0; // The z coordinate of the center of the user's body.
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
	// Models used for the player. Not currently used.
	leftHand = ""; // The model name of the player's left hand. (There isn't a way to detect if the player is grasping something; this is just here to be used for the user's hands.)
	rightHand = ""; // The model name of the player's right hand. (Ditto.)
	head = ""; // The model name of the player's head. (Uses VR model.)
	body = ""; // The model name of the player's body. (The body uses the coordinates of the head but with only the head's yaw and pitch.)
	// The following are the user's current stats. (Will update once vscript gets a chance to run)
	health = 100; // The user's health points. (Updates with Alyx's health.)
	resin = 0; // The user's resin. (Updates with Alyx's resin.)
	armor = 0; // The user's armor. (Only here for custom game types to use; will not be updated by normal gameplay. TODO = Find a way to display this)
	score = 0; // Unused score for custom game types. (TODO = Find a way to display this)
	// What the player is currently doing.
	action = ""; // The action the user is currently doing.
	falling = false; // Whether the user is falling. (Updates with the user's falling state.)
	// What the player is currently holding.
	weapon = ""; // The weapon the user is currently holding. (Can only be the following: "pistol"; "shotgun"; "smg"; "multitool"; "".)
	isGrabbing = false; // Whether or not the user is grabbing something. (Do not use until implemented.)
	grabbed = ""; // The item that the user is grabbing. (Do not use until implemented.)
	// The following is the user's current inventory. (Will also update with vscript.)
	leftPocket = ""; // What item is in the player's left pocket. (Can only be the following: "grub"; "battery"; "syringe"; "grenade"; "xengrenade"; "".)
	rightPocket = ""; // What item is in the player's right pocket. (See above for criteria.)
	ammoPistol = 0; // The amount of reserve ammo for the pistol. (Updates with Alyx's ammo.)
	ammoShotgun = 0; // The amount of reserve ammo for the shotgun. (See above.)
	ammoSmg = 0; // The amount of reserve ammo for the SMG. (See above.)
	// The following are the user's weapons. (Will update with vscript.)
	hasGravityGloves = true; // Whether or not the user has gravity gloves. (Updates with the state of Alyx's gravity gloves.)
	hasFlashlight = true; // Whether or not the user has a flashlight. (Updates with the state of Alyx's flashlight.)
	hasMultitool = true; // Whether or not the user has a multitool. (Updates with the state of Alyx's multitool.)
	hasPistol = true; // Whether or not the user has a pistol. (Updates with the state of Alyx's pistol.)
	hasShotgun = true; // Whether or not the user has a shotgun. (Updates with the state of Alyx's shotgun.)
	hasSmg = true; // Whether or not the user has a SMG. (Updates with the state of Alyx's SMG.)
	// Redundant values that can be used for convenience.
	hasGrenade = true; // Whether or not the user has a grenade of any type. (Updates with Alyx's pockets.)
	hasNormalGrenade = true; // Whether or not the user has specifically a normal grenade. (Ditto.)
	hasXenGrenade = true; // Whether or not the user has specifically a xen grenade. (Ditto.)
	isDead = false; // Whether or not the user is dead. (Updates with whether or not Alyx is dead.)
	isFrozen = false; // Disable the user's movement. (Only scripts may use this.)
};
module.exports = Player;
