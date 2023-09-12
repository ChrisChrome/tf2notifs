const config = require("./config.json");
const colors = require("colors");
const axios = require("axios");
const fs = require("fs");
const SteamUser = require("steam-user");
const TeamFortress2 = require("tf2");
const Discord = require("discord.js");
const { emit } = require("process");
const bot = new Discord.Client({ intents: ["GuildMessages", "Guilds", "MessageContent"] });
const ring_hook = new Discord.WebhookClient({ "url": config.discord.ring_webhook });
const notif_hook = new Discord.WebhookClient({ "url": config.discord.notification_webhook }, { "allowedMentions": false });
const pan_hook = new Discord.WebhookClient({ "url": config.discord.pan_webhook });
let user = new SteamUser();
let tf2 = new TeamFortress2(user);

user.logOn(config.steam);

user.on("loggedOn", async (stuff) => {
	//user.setPersona(1); //Just needed this to check that it was logging in properly, and not false reporting a successful log in lol
	console.log(`${colors.cyan("[Steam]")} Logged into steam`)
	await user.gamesPlayed([440]);

})

tf2.on("connectedToGC", async (ver) => {
	console.log(`${colors.yellow("[TF2]")} Connected to GC, version: ${ver}`)
	// Get lang file from tf wiki  https://wiki.teamfortress.com/w/images/c/cf/Tf_english.txt
	console.log(`${colors.green("[Lang]")} Getting TF2 Lang File from wiki`);
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
			if (tf2.lang) return console.log(`${colors.yellow("[TF2]")} Loaded TF2 Lang File`);
			console.log(`${colors.green("[Lang]")} Failed to load TF2 Lang File`);
		} catch (err) {
			console.log(`${colors.green("[Lang]")} Failed to load TF2 Lang File`);
		}
	})
})

tf2.on("disconnectedFromGC", (reason) => {
	console.log(`${colors.yellow("[TF2]")} Disconnected from GC, reason: ${reason}`)
})

tf2.on("systemMessage", (msg) => {
	console.log(`${colors.yellow("[TF2]")} New System Message: ${msg}`)
	notif_hook.send({
		embeds: [
			{
				description: `<:Messages:1151242960655089744> ${msg}`,
				color: 0x3498DB
			}
		]
	})
})

tf2.on("itemBroadcast", (msg, username, wasDestruction, defindex) => {
	console.log(`${colors.yellow("[TF2]")} New Item :$ {msg}`);
	pan_hook.send({
		content: wasDestruction ? "@everyone" : "", embeds: [
			{
				description: `<:Alert:1151242961485562008> ${msg}`,
				color: wasDestruction ? 0xff0000 : 0xF1C40F
			}
		]
	})
})

tf2.on("displayNotification", (title, body) => {
	console.log(`${colors.yellow("[TF2]")} New Notif: ${title}: ${body}`)
	ring_hook.send({
		embeds: [
			{
				description: `<:Alert:1151242961485562008> ${body}`,
				color: 0xF1C40F
			}
		]
	})
})

bot.on("ready", () => {
	console.log(`${colors.blue("[Discord]")} Logged in as ${bot.user.tag}`);
})

bot.on("messageCreate", (msg) => {
	if (!msg.webhookId) return;
	msg.crosspost();
})

const sendTestNotifications = () => {
	// emit the notifications
	tf2.emit("systemMessage", "Test Notification");
	tf2.emit("itemBroadcast", "Test Notification", "Test User", false, 0);
	tf2.emit("displayNotification", "Test Notification", "Test Notification");
}



bot.login(config.discord.token);
