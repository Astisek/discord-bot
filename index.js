/*

First you need to create a config.json file in data folder

{
	"token": "discord bot token",
	"prefix": "s",
	"youtube_api_key": "youtube api token"
}

*/


// Libs 

const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const searchYoutube = require('youtube-api-v3-search');


const bot = new Discord.Client();
Array.prototype.insert = function ( index, item ) {
	this.splice( index, 0, item );
};

// Config File

const config = require('./data/config.json');

bot.login(config.token);

// Bot Settings

var queue = [];
var enable = false;
var songPlaying;
let dispatcher;
let volume = 1;
let streamTime = 0;
let songRepeat = false;

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
	if (message.content.startsWith(config.prefix+"repeat")) repeat(message);
	if (message.content.startsWith(config.prefix+"move")) moveSong(message);
	if (message.content.startsWith(config.prefix+"np")) np(message);
	if (message.content.startsWith(config.prefix+"mix")) mix(message);
	if (message.content.startsWith(config.prefix+"topplay")) topplay(message);

	if (message.content.startsWith(config.prefix+"help")) help(message);

	if (message.content.startsWith(config.prefix+"status")) status(message);
});




function secToMin(min) { // Function translating the number of seconds in 00:00 format
	let sec = min % 60;
	min = (min - sec) / 60;

	if (sec < 10) sec = "0" + sec;
	if (min < 10) min = "0" + min;

	return min+":"+sec;
}



function timeToStart() { // Function that calculates the time until the end of the playlist
	let timeToStart = 0;

	let timeFromStart = Math.round(streamTime + (dispatcher.streamTime / 1000));

	timeToStart += queue[0].lengthSec - timeFromStart;
	for (let i = 1; i < queue.length; i++) {
		timeToStart += Number(queue[i].lengthSec);
	}
	
	return timeToStart;
}

function move(arr, oldId, newId) { // A function that moves element 'oldId' to position 'newId' in the 'arr' array
	let movedItem = arr[oldId];
	arr.splice(oldId, 1);

	arr.insert(newId, movedItem);
}

async function startMusic(message) { // Function that starts playback of the 'queue' array
	enable = true;

	dispatcher = await message.guild.voice.connection.play(ytdl(queue[0].url, {audioonly: true}), {passes : 4, volume: volume});
	dispatcher.on('finish', end => {
		if (!songRepeat) queue.shift();
		if (queue.length != 0) startMusic(message); else enable = false;
	});

}


// Bot functions

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


async function skip(message) {
	if (enable) {
		queue.shift();
		if (queue.length != 0) {
			dispatcher = await message.guild.voice.connection.play(ytdl(queue[0].url, {audioonly: true}), {passes : 4, volume: volume});
			dispatcher.on('finish', end => {
				if (!songRepeat) queue.shift();
				if (queue.length != 0) startMusic(message); else enable = false;
			});
		} else {
			dispatcher.end();
		}
		message.channel.send("Skipped!");
		songRepeat = false;
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

		if (time.length == 3) var seektime = time[0] + "h" + time[1] + "m" + time[2] + "s";
		else if (time.length == 2) var seektime = time[0] + "m" + time[1] + "s";
		else return;

		let sumTime = (Number(time[0]) * 60 + Number(time[1]));

		if (sumTime >= 0) {

			dispatcher = await message.guild.voice.connection.play(ytdl(queue[0].url, {audioonly: true, begin: seektime}), {passes : 4, volume: volume});
			dispatcher.on('finish', end => {
				if (!songRepeat) queue.shift();
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

async function repeat(message) {
	if (enable) {
		if (!songRepeat) {
			dispatcher.on('finish', end => {
				streamTime = 0;
				if (queue.length != 0) startMusic(message); else enable = false;
			});
			songRepeat = true;
			message.channel.send(":radioactive: Repeat mode enable :radioactive: ");
		} else {
			dispatcher.on('finish', end => {
				queue.shift();
				streamTime = 0;
				if (queue.length != 0) startMusic(message); else enable = false;
			});
			songRepeat = false;
			message.channel.send(":no_entry: Repeat mode disabled :no_entry:");
		}
	}
}

async function moveSong(message){
	if (enable) {
		let messageContent = message.content;

		let info = messageContent.replace(config.prefix+"move ", "");
		if (info == config.prefix+"move") return;

		info = info.split(' ');
		if (info.length == 2) {
			move(queue, Number(info[0])-1, Number(info[1])-1);
			if (info[1] == 1) startMusic(message);
		}
		message.channel.send("Song Moved!");
	}
}

async function np(message) {
	if (enable) {
		const embed = new Discord.MessageEmbed();
		embed.setAuthor('Сэр гей', 'https://vignette.wikia.nocookie.net/baccano/images/9/90/E12_Ennis.png/revision/latest?cb=20170227231754');
		embed.setTitle("Now Playing");
		embed.setColor('#20B2AA');
		embed.setDescription(queue[0].name);
		embed.addField('\u200B', '\u200B');

		let lineString = '|';
		let currentTime = Math.round(streamTime + (dispatcher.streamTime / 1000));
		let endTime = queue[0].lengthSec;

		let currentPossition = Math.round((currentTime / endTime) * 10);

		for (let i = 0; i < 10; i++) {
			if (currentPossition == i) lineString += '|';
			lineString += "---"
		}

		lineString += "|";

		embed.addField(secToMin(currentTime), '\u200B', true);
		embed.addField(lineString, '\u200B', true);
		embed.addField(secToMin(endTime), '\u200B', true);

		message.channel.send(embed);
	}
}

async function mix(message) {
	let firstElem = queue.shift();
	if (queue.length > 0) queue.sort(() => Math.random() - 0.5);

	queue.insert(0, firstElem);

	message.channel.send("Playlist mixed");
}

async function topplay(message) {
	if (enable) {
		let url = message.content.replace(config.prefix+"topplay ", "");
		if (url == config.prefix+"topplay") return;

		if (url.startsWith('https://')) {

			if (queue.length > 0) message.channel.send("Time To Start: "+secToMin(timeToStart()));


			await ytdl.getInfo(url, (err, info) => {
				queue.insert(1, {
					url: url,
					name: info.title,
					lengthSec: info.length_seconds
				});
				message.channel.send("Added"+"```"+info.title+"```");
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

						if (queue.length > 0) message.channel.send("Time To Start: " + secToMin(Math.round(Number(queue[0].lengthSec) - dispatcher.streamTime / 1000)));

						queue.insert(1, {
							url: 'https://www.youtube.com/watch?v='+url,
							name: info.title,
							lengthSec: info.length_seconds
						});
						message.channel.send("Added"+"```"+info.title+"```");

					});
				}
			});

		} 
	}
	else {
		play(message)
	}
}



// Default functions 

async function status(message) {
	message.channel.send("Work!");
}

async function help(message) {
	const exampleEmbed = new Discord.MessageEmbed()
	.setColor('#87CEFA')
	.setTitle('Command list')
	.setAuthor('Сэр гей', 'https://vignette.wikia.nocookie.net/baccano/images/9/90/E12_Ennis.png/revision/latest?cb=20170227231754')
	.addField("join", "Connect the bot to the voice channel")
	.addField("leave", "Disconnects bot from voice chat")
	.addField("play", "Includes music from YouTube, you can also use search queries")
	.addField("skip", "Skip current track")
	.addField("clear", "Clears a playlist")
	.addField("volume", "Changes the volume of music")
	.addField("pause", "Pause music")
	.addField("resume", "Continues playing music")
	.addField("seek", "Rewinds the current track \n Example: seek 5:00")
	.addField("queue", "Displays the current playlist")
	.addField("idskip", "Skips track by id from queue")
	.addField("repeat", "Enables repeating the current track")
	.addField("move", "Moves the selected track to another position \n Example: move 5 2 ")
	.addField("np", "Shows current track")
	.addField("mix", "Shuffle the current playlist")
	.addField("topplay", "Adds a track to the next position")

	.addField('\u200B', '\u200B')
	.addField("status", "Displays whether the bot is working")

	message.channel.send(exampleEmbed);
}