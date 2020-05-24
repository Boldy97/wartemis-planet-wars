# Wartemis Planet Wars Bot

This is a bot for [Wartemis](https://github.com/Project-Wartemis) (that I also maintain), which is live on [wartemis.com](www.wartemis.com).
At the moment it is pretty much a clone of my implementation on my [other repository](https://github.com/Boldy97/Bottlebats).

## What it does

This script will run one of 4 bots, connect to the configured websocket, and listen for new games.
Then join the websockets of these games, and play games on them.

## Configuration

At the top of `run.js` you can specify which URL to connect to. If the environment variable `DOCKER` is set to a truthy value, it will instead connect to `pw-backend`. This is used to run on the same machine and docker network as [the Wartemis backend application](https://github.com/Project-Wartemis/pw-backend).

## Install

Have node and npm installed

> `npm install`

## Run

The options are `BotDead`, `BotEasy`, `BotMedium`, `BotHard` and `BotElite`

Either specify a name of a bot, or nothing to default to `BotElite`

> `node run.js`

> `node run.js BotHard`

## Bot Levels

### Dead

* Plays dead, sends empty moves all the time

### Easy

* Attacks with all planets to the nearest not-owned planet

### Medium

Extension of [Easy](#easy) and...

* Holds armies for planets under attack

### Hard

Reduces the game complexity by creating a mesh, using the connections between planets as a network for routing messages, and allows each planet to send messages to its neighbours. It creates messages for the following statistics:

* How many more attackers are on the way than defenders (MessagePressureLocal)
* The pressure exterted from opponents, or negative pressure from how many ships we haved (MessagePressureGlobal)
* How many ships are needed (by turn) to defend this planet indefinitely (MessageRequestActive)
* How many ships are available (by turn) to keep this planet (MessageRequestPassive)

Note: Creating this mesh is inspired by the algorithm that [RIP](https://en.wikipedia.org/wiki/Routing_Information_Protocol) is based on. More specifically the [Bellman-Ford algorithm](https://en.wikipedia.org/wiki/Bellman%E2%80%93Ford_algorithm), but applied to all nodes.
Note: Creating this mesh is of time complexity O(N³). Not that optimal, but should it not have created a network after 500ms, it temporarily acts like [Medium](#medium)

![mesh example](https://i.imgur.com/hiq87WM.png)

### Elite

Extension of [Hard](#hard) and also does the following:
* Tries to get a better startposition if needed. This might give a disadvantage against weaker opponents, but improves winrate against stronger ones that do not do this
* Maximize future prospected return on conquest (only advantageous on random neutral starting shipcount)
* Knows the state of the game (early/mid/late), and changes tactics based on it
* Knows when winning or losing, and changes tactics based on it
  * when winning hard, dumps extra ships on hostile planets
  * when losing hard, flee from all danger and try to prolong the loss
* Does combined win/game status tactics
  * if winning and lategame, dump anyways. avoids draws when not having a solid lead
* Evaluates the future state on conquests better. Allows delaying an attack for planet sniping

## Future plans

* Use a node package to handle all the websocket connection logic
* Clean up unnecessary things (like simulating games and rendering them to html)
* Rewrite this in TypeScript
