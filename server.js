//Todo
//Underline usernames foreach message
//The user "" does not exist

const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const uuid = require('uuid/v4');

class User{
    constructor(nick, id){
        this.nick = nick;
        this.id = id;
    }
}

let users = [];

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', socket => {
    let u = new User('anonymous-' + uuid().slice(0, 5), socket.id);
    users.push(u);
    socket.user = u;
    io.emit('online', users);
    
    //Chat messages handler
    socket.on('chat message', msg => {
        socket.broadcast.emit('chat message' , msg, socket.user.nick);
    });

    //Private messages handler
    socket.on('private message', (target, message) => {
        users.forEach(user => {
            if (user.nick == target){
                io.to(user.id).emit('private message', socket.user.nick, message);
            }
        });
    });

    //On chat user joined(assign a nick, announce)
    socket.on('join', nick => {
        socket.user.logged = true;
        let noWhiteSpace = nick.replace(' ', '');

        //Valid nickname(not a whitespace)
        if (noWhiteSpace != ''){
            socket.user.nick = noWhiteSpace;
        }

        //Emit to everyone
        io.emit('online', users);

        //Emits to everyone but the client
        socket.broadcast.emit('system', `${socket.user.nick} has connected`);

        //Emits only to the client
        io.to(socket.user.id).emit('system', `Welcome, ${socket.user.nick}`);
    });

    //When a user disconnects, remove him from the online users list
    socket.on('disconnect', () => {
        users.splice(users.indexOf(socket.user), 1);
        io.emit('system', `${socket.user.nick} has disconnected`);
        io.emit('online', users);
    });

    //System Messages
    socket.on('system', msg => {
        io.to(socket.user.id).emit('system', msg);
    });
});

http.listen(process.env.PORT || 3000);