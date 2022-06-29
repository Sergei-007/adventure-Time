const http = require('http');
const fs = require('fs');

const { Player } = require('./game/class/player');
const { World } = require('./game/class/world');

const worldData = require('./game/data/basic-world-data');

let player;
let world = new World();
world.loadWorld(worldData);

const server = http.createServer((req, res) => {
  const redirect = url => {
    res.statusCode = 302;
    res.setHeader('Location', url);
    return res.end();
  }

  /* ============== ASSEMBLE THE REQUEST BODY AS A STRING =============== */
  let reqBody = '';
  req.on('data', (data) => {
    reqBody += data;
  });

  req.on('end', () => { // After the assembly of the request body is finished
    /* ==================== PARSE THE REQUEST BODY ====================== */
    if (reqBody) {
      req.body = reqBody
        .split("&")
        .map((keyValuePair) => keyValuePair.split("="))
        .map(([key, value]) => [key, value.replace(/\+/g, " ")])
        .map(([key, value]) => [key, decodeURIComponent(value)])
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    }

    /* ======================== ROUTE HANDLERS ========================== */
    // Phase 1: GET /
    if(req.method === 'GET' && req.url === '/') {
      const resBody = fs.readFileSync('./views/new-player.html', 'utf-8')
        .replace(/#{availableRooms}/g, world.availableRoomsToString());
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html");
      return res.end(resBody);
    }

    // Phase 2: POST /player
    if(req.method === 'POST' && req.url === '/player') {
      const {roomId, name} = req.body;
      player = new Player(name, world.rooms[roomId]);
      return redirect(`/rooms/${player.currentRoom.id}`);
    }
    if(!player) return redirect(`/`);

    // Phase 3: GET /rooms/:roomId
    if(req.method === 'GET' && req.url === '/rooms'){
      const routes = req.url.split('/');
      const roomId = routes[2];
      if(routes.length === 3 && roomId) {
        if(roomId == player.currentRoom.id){
          const room = player.currentRoom;

          const reqBody = fs.readFileSync('./views/room.html', 'utf-8')
          .replace(/#{roomName}/g, room.name)
          .replace(/#{roomId}/g, room.id)
          .replace(/#{roomItems}/g, room.itemsToString())
          .replace(/#{inventory}/g, player.inventoryToString())
          .replace(/#{exits}/g, room.exitsToString());

          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html");
          return res.end(reqBody);
        }
        else return redirect(`/rooms/${player.currentRoom.id}`);
      }
    }

    // Phase 4: GET /rooms/:roomId/:direction

    // Phase 5: POST /items/:itemId/:action

    // Phase 6: Redirect if no matching route handlers
  })
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));
