class ClientManager{
    
    constructor(){
        this.clientMap = new Map();
        this.idx = 1;
    }

    add(socket, name, color){
        this.idx += 1
        this.clientMap.set(this.idx, {socket:socket, name:name, color:color})
    }

    update(socket, name, color) {
        for (const [id, client] of this.clientMap) {
            if (client.socket === socket) {
                client.name = name
                client.color = color
                break
            }
        }
    }

    remove(socket){
        for(const [id, client] of this.clientMap){
            if(client.socket === socket){
                this.clientMap.delete(id)
                break
            }
        }
    }

    getAll(){
        return this.clientMap
    }

    broadcast(message, excludeSocket){
        this.clientMap.forEach((client, id) => {
            if(client.socket !== excludeSocket){
                if (client.socket.readyState === 1)
                    client.socket.send(message)
            }
        });
    }

    broadcastClients(){
        const clientList = {}
        this.clientMap.forEach((client, id) => {
            clientList[id] = { name: client.name, color: client.color }
        })
        const message = JSON.stringify({ type: 'clients', clients: clientList })
        this.broadcast(message)

    }

    getCount(){
        return this.clientMap.size
    }
}

module.exports = ClientManager