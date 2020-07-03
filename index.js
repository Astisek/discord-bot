const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const searchYoutube = require('youtube-api-v3-search');
const bot = new Discord.Client();

const config = require('./data/config.json');

bot.login(config.token);

var queue = [];
var enable = false;
var songPlaying;
let dispatcher;
let volume = 1;
let streamTime = 0;

bot.on("ready", () => {
	console.log("OK!");
});

bot.on("message", (message) => {
	if (message.author.bot) return;

	if (message.content.startsWith(config.prefix+"join")) join(message);
	if (message.content.startsWith(config.prefix+"leave")) leave(message);
	if (message.content.startsWith(config.prefix+"play")) play(message);
	if (message.content.startsWith(config.prefix+"skip")) skip(message);
	if (message.content.startsWith(config.prefix+"clear")) clear(message);
	if (message.content.startsWith(config.prefix+"volume")) volumeChange(message);
	if (message.content.startsWith(config.prefix+"pause")) pause(message);
	if (message.content.startsWith(config.prefix+"resume")) resume(message);
	if (message.content.startsWith(config.prefix+"seek")) seek(message);
	if (message.content.startsWith(config.prefix+"queue")) queuestat(message);
	if (message.content.startsWith(config.prefix+"idskip")) skipid(message);

	if (message.content.startsWith(config.prefix+"status")) status(message);
});

// bot.on("guildMemberAdd", (member) => {
// 	// При подключении пользователя к серверу
// });

function secToMin(min) {
	let sec = min % 60;
	min = (min - sec) / 60;

	if (sec < 10) sec = "0" + sec;
	if (min < 10) min = "0" + min;

	return min+":"+sec;
}

function timeToStart() {
	let timeToStart = 0;

	let timeFromStart = Math.round(streamTime + (dispatcher.streamTime / 1000));

	timeToStart += queue[0].lengthSec - timeFromStart;
	for (let i = 1; i < queue.length; i++) {
		timeToStart += Number(queue[i].lengthSec);
	}
	
	return timeToStart;
}












function join(message) {
	var voiceChannel = message.member.voice.channel;

	if (voiceChannel != null) {
		voiceChannel.join();
		return true
	} else return false
}

function leave(message) {
	var voiceChannel = message.member.voice.channel;

	if (voiceChannel != null) {
		voiceChannel.leave();
		return true
	} else return false
}

async function play(message) {
	if (!join(message)) return;

	var messageText = message.content;

	var url = messageText.replace(config.prefix+'play ', "");
	if (url == config.prefix+'play') return;

	if (url.startsWith('https://')) {

		if (queue.length > 0) message.channel.send("Time To Start: "+secToMin(timeToStart()));

		
		await ytdl.getInfo(url, (err, info) => {
			queue.push({
				url: url,
				name: info.title,
				lengthSec: info.length_seconds
			})
			message.channel.send("Added"+"```"+info.title+"```");
			if (!enable) startMusic(message);
		});
	} else {
		var options = {
			q: url,
			part: 'snippet',
			type: 'video'
		};

		searchYoutube(config.youtube_api_key, options, async function (err, result) {
			if (err) {
				message.channel.send("Nothing found");
				return;
			} else {
				url = result.items[0].id.videoId;
				await ytdl.getInfo(url, (err, info) => {

					if (queue.length > 0) message.channel.send("Time To Start: "+secToMin(timeToStart()));

					queue.push({
						url: 'https://www.youtube.com/watch?v='+url,
						name: info.title,
						lengthSec: info.length_seconds
					});
					message.channel.send("Added"+"```"+info.title+"```");

				});
				if (!enable) startMusic(message);
			}
		});
	}
}

async function startMusic(message) {
	enable = true;

	dispatcher = await message.guild.voice.connection.play(ytdl(queue[0].url, {audioonly: true}), {passes : 4, volume: volume});
	dispatcher.on('finish', end => {
		queue.shift();
		if (queue.length != 0) startMusic(message); else enable = false;
	});

}

async function skip(message) {
	if (enable) {
		queue.shift();
		if (queue.length != 0) {
			dispatcher = await message.guild.voice.connection.play(ytdl(queue[0].url, {audioonly: true}), {passes : 4, volume: volume});
			dispatcher.on('finish', end => {
				queue.shift();
				if (queue.length != 0) startMusic(message); else enable = false;
			});
		} else {
			dispatcher.end();
		}
		message.channel.send("Skipped!");
	}
}

async function clear(message) {
	queue = [];

	message.channel.send("Playlist Cleared :ok_hand_tone5:")
}

async function volumeChange(message) {
	if (enable) {
		var messageText = message.content;

		volume = messageText.replace(config.prefix+'volume ', "");
		if (volume == config.prefix+'volume') return;

		if (volume >= 0 && volume <= 2) {
			dispatcher.setVolume(volume);
			message.channel.send("Volume changed to "+volume*100+"%")
		}
	}
}

async function pause(message) {
	if (enable) {
		dispatcher.pause();
		message.channel.send("Paused :point_right_tone5: :ok_hand_tone5: ")
	}
}

async function resume(message) {
	if (enable) {
		dispatcher.resume();
		message.channel.send("Resumed! :point_right_tone5: :ok_hand_tone5: ")
	}
}

async function seek(message) {
	if (enable) {
		var messageText = message.content;

		var time = messageText.replace(config.prefix+'seek ', "");
		if (time == config.prefix+'seek') return;

		time = time.split(':');
		let sumTime = (Number(time[0]) * 60 + Number(time[1]));

		if (sumTime > 0) {

			dispatcher = await message.guild.voice.connection.play(ytdl(queue[0].url, {audioonly: true}), {passes : 4, seek: sumTime, volume: volume});
			dispatcher.on('finish', end => {
				queue.shift();
				streamTime = 0;
				if (queue.length != 0) startMusic(message); else enable = false;
			});
			streamTime = sumTime;
		}
	}
}

async function queuestat(message) {
	const exampleEmbed = new Discord.MessageEmbed()
	.setColor('#DC143C')
	.setTitle('Queue')
	.setAuthor('Сэр гей', 'https://vignette.wikia.nocookie.net/baccano/images/9/90/E12_Ennis.png/revision/latest?cb=20170227231754');

	for (let i = 0; i < queue.length; i++) {
		if (i == 0) exampleEmbed.addField(i+1 + ". " + queue[i].name + " - Now", 'Duration: ' + secToMin(queue[i].lengthSec));
		else exampleEmbed.addField(i+1 + ". " + queue[i].name, 'Duration: ' + secToMin(queue[i].lengthSec));
	}

	if (queue.length == 0) exampleEmbed.setTitle('Queue Is Empty');
	message.channel.send(exampleEmbed); 
}

async function status(message) {
	message.channel.send("Work!");
}

async function skipid(message) {
	if (enable) {
		messageContent = message.content;

		let id = Number(messageContent.replace(config.prefix+'idskip ', ""));
		if (id == config.prefix+'idskip') return;

		if (id > 1 && id <= queue.length) {
			queue.splice(id - 1, 1);
			message.channel.send("Skipped by id " + id + "!");
		} 
		if (id == 1) {
			skip(message);
		}
	}
}