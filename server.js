const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const uuid = require('uuid/v4');

let users = [];

class User{
    constructor(nick, id){
        this.nick = nick;
        this.id = id;
    }
}

//Populate users array
function updateUsers(){
    io.emit('online', users);
}

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', socket => {
    let u = new User('anonymous-' + uuid().slice(0, 5), socket.id);
    users.push(u);
    socket.user = u;

    //Populate users array
    updateUsers();

    //Emits to everyone but the client
    socket.broadcast.emit('system', `${socket.user.nick} has connected`);

    //Welcome message
    io.to(socket.user.id).emit('system', `Welcome, ${socket.user.nick}!`);
    io.to(socket.user.id).emit('system',`Type [/nick] to change your nickname, [/msg] to send a private message and hold [ALT] to show the currently online users`);
    
    //#region Handlers
    //Chat messages handler
    socket.on('chat message', msg => {
        socket.broadcast.emit('chat message' , msg, socket.user.nick);
    });

    //Private messages handler
    socket.on('private message', (target, message) => {
        for (let i = 0; i < users.length; i++){
            if ((users[i].nick).toLowerCase() == target){
                io.to(users[i].id).emit('private message', socket.user.nick, message);
                break;
            }
        }
    });

    //Change nick
    socket.on('nick', user => {
        io.emit('system', `${socket.user.nick} has changed the name to ${user.nick}`);
        for (let i = 0; i < users.length; i++){
            if (users[i].id == user.id){
                users[i].nick = user.nick;
                break;
            }
        }
        updateUsers();
    });

    //When a user disconnects, remove him from the online users list
    socket.on('disconnect', () => {
        users.splice(users.indexOf(socket.user), 1);
        io.emit('system', `${socket.user.nick} has disconnected`);
        updateUsers();
    });

    //System Messages
    socket.on('system', msg => {
        io.to(socket.user.id).emit('system', msg);
    });
    //#endregion
});

http.listen(process.env.PORT || 3000);