'use strict'

/* Variables */

let validBots = ['BotDead','BotEasy','BotMedium','BotHard','BotElite'];
let URL = 'https://localhost:8080/socket';
//const URL = 'https://api.wartemis.com/socket';
if(process.env.DOCKER) {
  URL = 'https://pw-backend/socket';
}

/* Imports */

/*const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});*/
const ws = require('websocket').client;
const Utils = require('./classes/Utils');
const Timer = require('./classes/Timer');
const BOTS = validBots.reduce((acc,val) => {
	acc[val] = require('./bots/'+val);
	return acc;
},{});

/* Libraries */

/* Wrapper for new formatting */

function handleStateMessage(connection, message) {
	connection.bot.processData(transformInput(message.state));
	if(!message.players.includes(connection.id)) {
		return;
	}
	sendMessage(connection, {
		type: 'action',
		action: {
			moves: transformOutput(connection.bot.getMoves())
		}
	});
}

function transformInput(input) {
	let planets = input.planets.map(p => ({
		name: p.id,
		x: p.x,
		y: p.y,
		owner: p.player,
		ship_count: p.ships,
	}));
	let expeditions = input.moves.map(m => ({
		id: m.id,
		origin: m.source,
		destination: m.target,
		turns_remaining: m.turns,
		owner: m.player,
		ship_count: m.ships,
	}));
	return { planets, expeditions };
}

function transformOutput(output) {
	return output.map(m => ({
		source: m.origin,
		target: m.destination,
		ships: m.ship_count,
	}));
}

/* Start */

function start() {
	let botname = process.argv[2];
	if(process.argv.length<3)
		botname = validBots[validBots.length-1];
	if(!validBots.includes(botname))
		Utils.crash(botname+' is not a valid bot!');
	let bot = BOTS[botname];
	setupNewSocket(URL, bot);
}

start();

//Timer.start();
/*(() => {
	let botname = process.argv[2];
	if(process.argv.length<3)
		botname = validBots[validBots.length-1];
	if(!validBots.includes(botname))
		Utils.crash(botname+' is not a valid bot!');
	readline.on('line',
		((bot,data) => {
			bot.processData(JSON.parse(data));
			console.log(JSON.stringify({
				moves: bot.getMoves()
			}));
			//Timer.step();
		}).bind(undefined,new BOTS[botname](1,null))
	);
})();*/

/* Boilerplate stuff */

function setupNewSocket(endpoint, bot) {
  let socket = new ws();

  socket.on('connectFailed', function(error) {
    console.error('Connect Error: ' + error.toString());
  });

  socket.on('connect', connection => {
    console.log('connected!');

    connection.on('error', error => {
      console.log('error: ' + error);
    });

    connection.on('close', () => {
      console.log('closed');
    });

    connection.on('message', handleMessage.bind(undefined, connection, bot));
  });

  console.log(`connecting to socket @ ${endpoint}`);
  socket.connect(endpoint);
}

function sendMessage(connection, message) {
  connection.sendUTF(JSON.stringify(message));
}

function handleMessage(connection, bot, message) {
  if(message.type !== 'utf8')
    console.log('Got a non-text message, ignoring');
  message = JSON.parse(message.utf8Data);

  console.debug(`Got a ${message.type} message!`);

  switch(message.type) {
    case 'connected': handleConnectedMessage(connection, bot, message); break;
    case 'registered': handleRegisteredMessage(connection, message, bot); break;
    case 'invite': handleInviteMessage(connection, bot, message); break;
    case 'state': handleStateMessage(connection, message); break;
    case 'stop': handleStopMessage(connection, message); break;
  }
}

function handleConnectedMessage(connection, bot, message) {
  console.log('connected!');
  let name = 'Pancake\'s '+bot.name;
  if(bot.name === 'BotElite')
    name = 'The Great Filter';
  sendMessage(connection, {
    type: 'register',
    clientType: 'bot',
    name: name,
    game: 'Planet Wars'
  });
}

function handleRegisteredMessage(connection, message, bot) {
  console.log(`Registered with id ${message.id}!`);
  connection.id = message.id;
  connection.bot = new bot(message.id, 0);
}

function handleInviteMessage(connection, bot, message) {
  console.log(`invited to room ${message.room}!`);
  setupNewSocket(URL + '/' + message.room, bot);
}

function handleStopMessage(connection, message) {
  connection.close();
}
