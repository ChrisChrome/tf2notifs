const config = require("./config.json");
const fs = require("fs");
const SteamUser = require("steam-user");
const TeamFortress2 = require("tf2");
const Discord = require("discord.js");
const bot = new Discord.Client({intents: ["GuildMessages", "Guilds", "MessageContent"]});
const ring_hook = new Discord.WebhookClient({"url": config.discord.ring_webhook});
const notif_hook = new Discord.WebhookClient({"url": config.discord.notification_webhook}, {"allowedMentions": false});
const pan_hook = new Discord.WebhookClient({"url": config.discord.pan_webhook}, {"allowedMentions": false});
let user = new SteamUser();
let tf2 = new TeamFortress2(user);

user.logOn(config.steam);

user.on("loggedOn", (stuff) => {
	//user.setPersona(1); //Just needed this to check that it was logging in properly, and not false reporting a successful log in lol
	console.log("Logged into steam")
	user.gamesPlayed([440]);
	tf2.setLang(fs.readFileSync("./tf_english.txt").toString())
	if(tf2.lang) console.log("Updated the localization files")
})

tf2.on("connectedToGC", (ver) => {
	console.log(`Connected to Game Coordinator, Listening for events!`)
})

tf2.on("systemMessage", (msg) => {
	console.log(`New System Message: ${msg}`)
	notif_hook.send({embeds: [
		{
			description: msg,
			color: Discord.Colors.Blue
		}
	]})
})

tf2.on("itemBroadcast", (msg, username, wasDestruction, defindex) => {
	console.log(`New Item BC:\nMsg:${msg}\nUser:${username}\nDestroy?:${wasDestruction}`)

})

tf2.on("displayNotification", (title, body) => {
	console.log(`New Notif: ${title}: ${body}`)
	ring_hook.send({embeds: [
		{
			description: body,
			color: Discord.Colors.Gold
		}
	]})
})

bot.on("ready", () => {
	console.log("Logged into Discord");
})

bot.on("messageCreate", (msg) => {
	if(msg.author.bot) return;
	if (config.discord.channels.includes(msg.channel.id)) {
		msg.crosspost();
	}
})

bot.login(config.discord.token);
