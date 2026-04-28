const { WebSocketServer } = require('ws')
const Operation  = require('../core/operations');
const transformFunc = require('../core/transform');
const Apply = require('../core/apply');
const GoogleDocument = require('../core/document');
const ClientManager = require('./client_manager');

const doc = new GoogleDocument("Hello is this is a new google document. We are working on live code editor");
const apply = new Apply();
let version = 0;
const history = []
const clientManager = new ClientManager()

const WebSocket = new WebSocketServer({port: 3001})

WebSocket.on('connection', (socket) => {
    
    // 1. add to clients
    clientManager.add(socket, 'anonymous', null)
    clientManager.broadcastClients()

    // 2. send init message to this new client
    socket.send(JSON.stringify({ type: "init", doc: doc.doc_text, clientVersion: 0 }));

    // 3. listen for messages from this client
    socket.on('message', (data) => {
        // core logic goes here
        const obj = JSON.parse(data)

        if (obj.type === 'join') {
            clientManager.update(socket, obj.name, obj.color)
            clientManager.broadcastClients()
            return
        }

        let clientOp = new Operation({actionType: obj.actionType, pos:obj.pos, char:obj.char, clientVersion:obj.clientVersion})
        const missedOps = history.filter(h => h.clientVersion > obj.clientVersion)
        missedOps.forEach(missedOp => {
                clientOp = transformFunc(missedOp, clientOp)
            }) 
        apply.apply(doc, clientOp)
        version += 1
        history.push(new Operation({actionType:clientOp.actionType, pos:clientOp.pos, char:clientOp.char, clientVersion:version}))

        socket.send(JSON.stringify({ type: "ack", doc: doc.doc_text, clientVersion: version}))

        // Broadcast to all clients except sender 
        clientManager.broadcast(JSON.stringify({
            type: 'op',
            actionType: clientOp.actionType,
            pos: clientOp.pos,
            char: clientOp.char,
            clientVersion: version,
            senderName: obj.senderName
        }), socket)
    })

    // 4. listen for disconnect
    socket.on('close', () => {
        // remove from clients array
        clientManager.remove(socket)
        clientManager.broadcastClients()
    })

})