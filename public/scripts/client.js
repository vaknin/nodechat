//Variables
const client = io();
let me, onlineUsers, textSubmitted;
let messages = [];
let currentMessage = 0;

//Focus the text area
$('#input').focus();

//Keydown
$(document).on('keydown', e => {

    //Enter keypress
    if (e.which == 13){

        //Message input isn't empty
        if ($('#input').val().replace(' ', '') != ''){

            //Assign the submitted text to a variable
            textSubmitted = $('#input').val();
            currentMessage = 0;

            //If the message is already in the array, move it to the beginning of the array
            if (messages.indexOf(textSubmitted) != -1){
                messages.splice(messages.indexOf(textSubmitted), 1);
            }

            //Push the submitted text to the beginning of the array
            messages.unshift(textSubmitted);

            //If the messages array is too big, trim it
            if (messages.length == 7){
                messages.pop();
            }

            //If the entered message starts with a backslash(Special messages)
            if (textSubmitted.slice(0,1) == '/'){

                //Private Message (i.e. /msg username message)
                if (textSubmitted.slice(0,4) == '/msg'){

                    //Check for improper message formatting
                    if (textSubmitted.match(/ /g) == null || textSubmitted.match(/ /g).length < 2){
                        systemMessage('To send a private message: /msg username message');
                        $('#input').val('');
                        return;
                    }

                    //Remove the '/msg' part
                    let slicedInput = textSubmitted.substring(5);
                    
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
                            $('#messages li')[$('#messages li').length - 1].style.backgroundColor = 'rgb(191, 135, 255)';

                            scrollBottom();
                            
                        }

                        //Notify the user the target doesn't exist
                        else{
                            systemMessage(`The user \"${target_upper}\" does not exist!`);
                        }
                    }

                    //Notify the client he can't private message himself
                    else{
                        systemMessage(`You cannot private message yourself!`);
                    }
                }

                //Change Nickname (i.e. /nick nickname)
                else if (textSubmitted.slice(0,5) == '/nick'){

                    //Check for improper formatting
                    if (textSubmitted.match(/ /g) == null || textSubmitted.match(/ /g).length != 1){
                        systemMessage('To change your nickname type \'/nick nickname');
                        $('#input').val('');
                        return;
                    }

                    else{

                        let nick = textSubmitted.substring(6);

                        //Check if the desire nickname is taken
                        for(let i = 0; i < onlineUsers.length; i++){
                            if ((onlineUsers[i].nick).toLowerCase() == nick.toLowerCase()){
                                systemMessage(`${nick} is already taken!`);
                                $('#input').val('');
                                return;
                            }
                        }

                        if (nick.length < 4 || nick.length > 8){
                            systemMessage('Nickname\'s length must be 4~8 characters!');
                        }

                        //Change nickname
                        else{
                            me.nick = nick;
                            client.emit('nick', me);
                            $('#input').focus();
                        }
                    }
                }
            }

            //Regular Message
            else{
                client.emit('chat message', $('#input').val());
                $('#messages').append($('<li>').text(`You: ${$('#input').val()}`));
                scrollBottom();
            }

            //Clear the input field
            $('#input').val('');
        }
    }

    //Arrow keys to restore previous messages
    else if (e.which == 38 || e.which == 40){

        //Arrow up
        if (e.which == 38){
            currentMessage++;
        }

        //Arrow down
        else{
            currentMessage--;
        }

        if(currentMessage > messages.length){
            currentMessage = 0;
        }

        if (currentMessage == 0){
            $('#input').val('');
        }

        else{
            if(currentMessage < 0){
                currentMessage = messages.length;
            }
    
            $('#input').val(messages[currentMessage - 1]);
        }


        //Move caret position to end of line, ease of use
        setTimeout(() => {
            $('#input')[0].focus();
            $('#input')[0].setSelectionRange($('#input').val().length, $('#input').val().length);
        }, 0);
        
    }

    //Hold Alt to see online users
    else if (e.which == 18){
        $('.users').css('display', 'block');
    }
});

//Key release
$(document).on('keyup', e => {

    //Alt keyup hides online users list
    if (e.which == 18){
        $('.users').css('display', 'none');        

    }
});


//Recieve a message
client.on('chat message', (msg, sender) => {
    $('#messages').append($('<li>').text(`${sender}: ${msg}`));
    scrollBottom();
});

//Recieve a private message
client.on('private message', (sender, msg) => {
    $('#messages').append($('<li class=\'private\'>').text(`(Private Message) ${sender}: ${msg}`));
    $('#messages li')[$('#messages li').length - 1].style.backgroundColor = 'rgb(191, 135, 255)';
    scrollBottom();
});

//Recieve a system message
client.on('system', msg => {
    $('#messages').append($('<li class=\'system\'>').text(msg));
    $('#messages li')[$('#messages li').length - 1].style.backgroundColor = 'rgb(163, 153, 119)';
    scrollBottom();
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
        $('#input').val(`/msg ${users[this.id].nick} `);
        $('#input').focus();
    });
});

//Sends the client a message only he can see
function systemMessage(msg){
    client.emit('system', msg);
}

//Upon recieveing a message, scroll to the bottom of the page
function scrollBottom(){
    $('#messages').scrollTop($(document).height() * 1000);
}