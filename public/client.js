const client = io();
let logged = false;
let me, onlineUsers;
let popup = $('#popup');
popup.hide();
$('#input_nickname').focus();

//Listen for keypress
$(document).on('keypress', e => {
    //If keypress is Enter
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
        let taken = false;

        for(let i = 0; i < onlineUsers.length; i++){
            if (onlineUsers[i].nick == $('#input_nickname').val()){
                taken = true;
            }
        }

        //Nick isn't taken, log in
        if (!taken){
            //Hide login & Display chat
            $('#container_login').css('display', 'none');
            $('#container_chat').css('display', 'block'); 

            //Announce that you joined
            client.emit('join', $('#input_nickname').val());
            logged = true;
            $('#input').focus();
        }


        else{
            //showPopup();
        }
    }
}
});

client.on('chat message', (msg, sender) => {
if (logged)
    $('#messages').append($('<li>').text(`${sender}: ${msg}`));
});

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

//Display a popup on incorrect login
function showPopup(){
    popup.show();
    new Popper($('#container_login'), popup);
}