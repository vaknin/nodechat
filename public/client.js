$('#input_nickname').focus();
let logged = false;
let me;

$(function(){

    const client = io();

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
                client.emit('private message', target, message);
                $('#messages').append($('<li class=\"private\">').text(`${me.nick}: ${message}`));
            }

            //Regular Message
            else{
                client.emit('chat message', $('#input').val());
            }

            //Clear the input field
            $('#input').val('');
        }

        //Join the chat
        else if (!logged){
            //Hide login & Display chat
            $('#container_login').css('display', 'none');
            $('#container_chat').css('display', 'block'); 

            //Announce that you joined
            client.emit('join', $('#input_nickname').val());
            logged = true;
            $('#input').focus();
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
});