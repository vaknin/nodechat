const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const uuid = require('uuid/v4');
const Database = require('nedb');
const path = require('path');
const fs = require('fs');
const db = new Database({filename: 'database.db', autoload: true});

//User class
class User{
    constructor(nick, id){
        this.nick = nick;
        this.id = id;
    }
}
let users = [];

//Populate users array
function updateUsers(){
    io.emit('online', users);
}

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

app.get('/gethistory', (req, res) => {
    db.find({}, (err, data) => {
        if (err){
            res.end('Error!');
        }
        res.json(data);
    });
});

//Receive msgs from a post request
app.post('/', (req, res) => {
    if(Object.keys(req.body)[0] == 'msg'){
        let chatMessage = {
            sender: "POST",
            message: Object.values(req.body)[0],
            time: getTime()
        };

        db.insert(chatMessage);
        res.end('Message saved to the database.');
        return;
    }

    res.end('In order to post to the database, send a JSON format with the key of \'msg\'.');
});

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
    io.to(socket.user.id).emit('system',`Type [/nick] to change your nickname, [/msg] to send a private message, [/clear] to clear the screen and hold [ALT] to show the current online users`);
    
    //#region Handlers

    //Chat messages handler
    socket.on('chat message', msg => {
        socket.broadcast.emit('chat message' , msg, socket.user.nick);
        let chatMessage = {
            sender: socket.user.nick,
            message: msg,
            time: getTime()
        };

        db.insert(chatMessage);
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

//Format time
function getTime(){

    function addZero(n){
        if (n < 10){
            n = "0" + n;
        }

        return n;
    }

    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let time = `${addZero(date.getHours())}:${addZero(date.getMinutes())}`;
    return `${day}/${month}/${year} ${time}`;
}

//Listen on port 3000 / Heroku port
http.listen(process.env.PORT || 3000);