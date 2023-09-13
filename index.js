const config = require("./config.json");
const fs = require("fs");
const colors = require("colors");
const axios = require("axios");
const SteamUser = require("steam-user");
const TeamFortress2 = require("tf2");
const Discord = require("discord.js");
const bot = new Discord.Client({intents: ["GuildMessages", "Guilds", "MessageContent"]});
const ring_hook = new Discord.WebhookClient({"url": config.discord.ring_webhook});
const notif_hook = new Discord.WebhookClient({"url": config.discord.notification_webhook}, {"allowedMentions": false});
const pan_hook = new Discord.WebhookClient({"url": config.discord.pan_webhook});
const user = new SteamUser();
const tf2 = new TeamFortress2(user);

user.on("loggedOn", (stuff) => {
	//user.setPersona(1); //Just needed this to check that it was logging in properly, and not false reporting a successful log in lol
	console.log(`${colors.cyan("[Steam]")} Logged into steam`)
	user.gamesPlayed([440]);
	axios.get("https://wiki.teamfortress.com/w/images/c/cf/Tf_english.txt").then((res) => {
		console.log(`${colors.green("[Lang]")} Got TF2 Lang File from wiki`);
		// set lang from body
		tf2.setLang(res.data)
		// Save a local copy
		fs.writeFileSync("./tf_english.txt", res.data);
		console.log(`${colors.green("[Lang]")} Saved backup TF2 Lang File`);
		if (tf2.lang) return console.log(`${colors.yellow("[TF2]")} Loaded TF2 Lang File`);
		console.log(`${colors.green("[Lang]")} Failed to load TF2 Lang File`);
	}).catch((err) => {
		console.log(`${colors.green("[Lang]")} Failed to load TF2 Lang File from wiki, trying local file`);
		// try to load local file
		try {
			tf2.setLang(fs.readFileSync("./tf_english.txt", "utf8"));
			console.log(tf2.lang)
			if (tf2.lang) return console.log(`${colors.yellow("[TF2]")} Loaded TF2 Lang File`);
			console.log(`${colors.green("[Lang]")} Failed to load TF2 Lang File`);
		} catch (err) {
			console.log(`${colors.green("[Lang]")} Failed to load TF2 Lang File`);
		}
	})
})

tf2.on("connectedToGC", (ver) => {
	console.log(`${colors.yellow("TF2")} Connected to GC`)
	console.log(`${colors.blue("[Info]")} Startup took ${Date.now() - initTime}ms`)
})

tf2.on("systemMessage", (msg) => {
	console.log(`[TF2] New System Message: ${msg}`)
	notif_hook.send({embeds: [
		{
			description: `<:Messages:1151242960655089744> ${msg}`,
			color: Discord.Colors.Blue
		}
	]})
})

tf2.on("itemBroadcast", (msg, username, wasDestruction, defindex) => {
	console.log(`[TF2] New Item :\nMsg:${msg}\nUser:${username}\nDestroy?:${wasDestruction}`);
	pan_hook.send({embeds: [
		{
			description: `<:Alert:1151242961485562008> ${msg}`,
			color: wasDestruction?Discord.Colors.Red:Discord.Colors.Gold
		}
	]})

})

tf2.on("displayNotification", (title, body) => {
	console.log(`[TF2] New Notif: ${title}: ${body}`)
	ring_hook.send({embeds: [
		{
			description: `<:Alert:1151242961485562008> ${body}`,
			color: Discord.Colors.Gold
		}
	]})
})

bot.on("ready", () => {
	console.log(`[Discord] Logged in as ${bot.user.tag}`);
})

bot.on("messageCreate", (msg) => {
	if(msg.author.bot) return;
	if (config.discord.channels.includes(msg.channel.id)) {
		msg.crosspost();
	}
})

// Catch all errors
process.on('uncaughtException', async (err) => {
	await sendLog(`${colors.red("[ERROR]")} Uncaught Exception: ${err}`);
});

process.on('unhandledRejection', async (err) => {
	await sendLog(`${colors.red("[ERROR]")} Unhandled Rejection: ${err}`);
});



// Handle SIGINT gracefully
process.on('SIGINT', () => {
	setTimeout(() => {
		console.log(`${colors.red("[ERROR]")} Took too long to exit, exiting forcefully...`);
		process.exit(1);
	}, 10000)
	console.log(`${colors.blue("[INFO]")} Stop received, exiting...`);
	bot.destroy();
	user.logOff();
	console.log(`${colors.blue("[INFO]")} Goodbye!`);
	process.exit(0);
});

console.log(`${colors.cyan("[INFO]")} Starting...`)
// Start timer to see how long startup takes
const initTime = Date.now()
console.log(`${colors.cyan("[Steam]")} Logging into steam`);
user.logOn(config.steam);
console.log(`${colors.cyan("[Discord]")} Logging into discord`);
bot.login(config.discord.token);