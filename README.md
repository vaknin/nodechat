# Node.js Chat

The web app was built using Javascript, jQuery, express and socket.io
It is hosted on Heroku: https://kivanchat.herokuapp.com/


## Useful commands:

Hold ALT - Show the currently online users 

type /msg [target] [message] - Send [message] privately to [target]

type /nick [nickname] - change your current nickname to [nickname]

## HTTP requests:
**GET** - send a GET request to https://kivanchat.herokuapp.com/gethistory in order to receive a history of all messages
**POST** - send a POST request to https://kivanchat.herokuapp.com/ in order to post a message to the history
