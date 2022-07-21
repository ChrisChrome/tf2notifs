const config = require("./config.json")
const SteamUser = require("steam-user");
const TeamFortress2 = require("tf2");
let user = new SteamUser()
let tf2 = new TeamFortress2(user)

user.logOn(config.steam)

user.on("loggedOn", (stuff) => {
	user.setPersona(1);
	console.log("LOGGED IN TO STEAM")
	user.gamesPlayed([440]);
})

tf2.on("connectedToGC", (ver) => {
	console.log(`CONNECTED TO GC`)
})

tf2.on("systemMessage", (msg) => {
	console.log(`New System Message: ${msg}`)
})