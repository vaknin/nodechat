//Variables
const client = io();
let logged = false;
let me, onlineUsers, textSubmitted;
let messages = [];
let currentMessage = 0;

//Focus the login input
$('#input_nickname').focus();

//Listen for keypress
$(document).on('keydown', e => {

    //Enter keypress
    if (e.which == 13){

        //Send a message (if it's not an empty string)
        if (logged && $('#input').val().replace(' ', '') != ''){

            //Assign the submitted text to a variable
            textSubmitted = $('#input').val();

            //Push the submitted text to an array of submitted texts, if it's unique
            if (messages.indexOf(textSubmitted) == -1)
                messages.unshift(textSubmitted);

            //If the entered message starts with a backslash(Special messages)
            if (textSubmitted.slice(0,1) == '/'){

                //Private Message (i.e. /private username message)
                if (textSubmitted.slice(0,9) == '/private '){

                    //Check for improper message formatting
                    let whitespaces = textSubmitted.match(/ /g).length;
                    if (whitespaces < 2){
                        systemMessage('To send a private message: /private username message');
                        $('#input').val('');
                        return;
                    }

                    //Remove the '/private' part
                    let slicedInput = textSubmitted.substring(9);
                    
                    //Extract the target's user name
                    let target = (slicedInput.substring(0, slicedInput.indexOf(" ")).toLowerCase());
                    let target_upper = slicedInput.substring(0, slicedInput.indexOf(" "));

                    //Extract the message
                    let message = slicedInput.substring(slicedInput.indexOf(" ") + 1);

                    //Check if not sending private to himself
                    if (target != (me.nick).toLowerCase()){
                        //Check if the target exists
                        let targetExists = false;
                        for(let i = 0; i < onlineUsers.length; i++){
                            if((onlineUsers[i].nick).toLowerCase() == target){
                                targetExists = true;
                                target_upper = onlineUsers[i].nick;
                                break;
                            }
                        }

                        //Proceed sending the message
                        if (targetExists && message.replace(' ', '') != ""){
                            client.emit('private message', target, message);
                            $('#messages').append($('<li class=\"private\">').text(`(Private Message) to ${target_upper}: ${message}`));
                        }

                        //Notify the user the target doesn't exist
                        else{
                            systemMessage(`The user \"${target_upper}\" does not exist`);
                        }
                    }

                    //Notify the client he can't private message himself
                    else{
                        systemMessage(`You cannot private message yourself`);
                    }
                }
            }

            //Regular Message
            else{
                client.emit('chat message', $('#input').val());
                $('#messages').append($('<li>').text(`You: ${$('#input').val()}`));
            }

            //Clear the input field
            $('#input').val('');
        }

        //Join the chat
        else if (!logged){
            textSubmitted = $('#input_nickname').val();
            let taken = false;

            for(let i = 0; i < onlineUsers.length; i++){
                if ((onlineUsers[i].nick).toLowerCase() == textSubmitted.toLowerCase()){
                    taken = true;
                    break;
                }
            }

            //Nickname is taken
            if (taken){
            alert(`${textSubmitted} is taken`);
            }

            else if (textSubmitted.length < 4 || textSubmitted.length > 14){
                alert('Nickname\'s length must be between 4~14 characters');
            }

            //Nick isn't taken, log in
            else{
                
                //Hide login & Display chat
                $('#container_login').css('display', 'none');
                $('#container_chat').css('display', 'block'); 

                //Announce that you joined
                client.emit('join', textSubmitted);
                logged = true;
                $('#input').focus();
            }
        }
    }

    //Up & Down arrow keys - Restore previous messages system
    else if (e.which == 38 || e.which == 40){

        //Arrow up
        if (e.which == 38){
            currentMessage++;
            $('#input').val(messages[currentMessage - 1]);
            
            if (currentMessage >= messages.length){
                currentMessage = 0;
            }
        }

        //Arrow down
        else{
            if (currentMessage == 0){
                currentMessage = messages.length - 1;
            }

            else{
                currentMessage--;
            }

            $('#input').val(messages[currentMessage]);
        }

        //Move caret position to end of line, ease of use
        setTimeout(() => {
            $('#input')[0].focus();
            $('#input')[0].setSelectionRange($('#input').val().length, $('#input').val().length);
        }, 0);
        
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