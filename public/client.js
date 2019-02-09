import Popper from "/popper.js";

const client = io();
let logged = false;
let me, onlineUsers;
$('#input_nickname').focus();

//Listen for keypress
$(document).on('keypress', e => {
    //Enter keypress
    if (e.which == 13){
        //Send a message
        if (logged && $('#input').val() != ''){
            //Private Message, Syntax: /private nickname message
            if ($('#input').val().slice(0,9) == '/private '){
                let slicedInput = $('#input').val().substring(9);
                let target = slicedInput.substring(0, slicedInput.indexOf(" "));
                let message = slicedInput.substring(slicedInput.indexOf(" ") + 1);

                //Check if not sending private to himself
                if (target != me.nick){
                    //Check if the target exists
                    let targetExists = false;
                    for(let i = 0; i < onlineUsers.length; i++){
                        if(onlineUsers[i].nick == target){
                            targetExists = true;
                            break;
                        }
                    }

                    //Proceed sending the message
                    if (targetExists){
                        client.emit('private message', target, message);
                        $('#messages').append($('<li class=\"private\">').text(`(Private Message) ${me.nick}: ${message}`));
                    }

                    //Notify the user the target doesn't exist
                    else{
                        systemMessage(`The user \"${target}\" does not exist`);
                    }
                }

                //Notify the client he can't private message himself
                else{
                    systemMessage(`You cannot private message yourself`);
                }
            }

            //Regular Message
            else{
                client.emit('chat message', $('#input').val());
                $('#messages').append($('<li>').text(`${me.nick}: ${$('#input').val()}`));
            }

            //Clear the input field
            $('#input').val('');
        }

        //Join the chat
        else if (!logged){
            let desirdNick = $('#input_nickname').val();
            let taken = false;

            for(let i = 0; i < onlineUsers.length; i++){
                if (onlineUsers[i].nick == desirdNick){
                    taken = true;
                }
            }

            //Nickname is taken
            if (taken){
            alert(`${desirdNick} is taken`);
            }

            else if (desirdNick.length < 4){
                alert('Your nickname must be atleast 4 letters!');
            }

            //Nick isn't taken, log in
            else{
                
                //Hide login & Display chat
                $('#container_login').css('display', 'none');
                $('#container_chat').css('display', 'block'); 

                //Announce that you joined
                client.emit('join', desirdNick);
                logged = true;
                $('#input').focus();
            }
        }
    }
});

//Recieve a chat message
client.on('chat message', (msg, sender) => {
if (logged)
    $('#messages').append($('<li>').text(`${sender}: ${msg}`));
});

//Recieve a system message
client.on('system', msg => {
    if (logged)
        $('#messages').append($('<li class=\'system\'>').text(msg));
});

//Populate online users list
client.on('online', users => {
    onlineUsers = users;
    $('#online').empty();
    for (let i = 0; i < users.length; i++){
        $('#online').append($(`<li class="user" id="${i}">`).text(users[i].nick));
        if (users[i].id == client.id)
            me = users[i];
    }

    //Click on a user's name
    $('li.user').click(function(){
        $('#input').val(`/private ${users[this.id].nick} `);
        $('#input').focus();
    });
});

//Whisper system
client.on('private message', (sender, msg) => {
    $('#messages').append($('<li class=\'private\'>').text(`(Private Message) ${sender}: ${msg}`));
});

//Sends the client a message only he can see
function systemMessage(msg){
    client.emit('system', msg);
}