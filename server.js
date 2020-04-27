let express = require('express');
let app = express();
let server = require('http').Server(app);
//Port
let port = process.env.PORT || 8080;

// Adding socket.io for bidirectional communication
let io = require('socket.io').listen(server);
let players = {};
let star = {
    x: Math.floor(Math.random()*700)+50,
    y: Math.floor(Math.random()*500)+50
};


let scores = {
    blue: 0,
    red:0
};

app.use(express.static(__dirname+'/dist'));

app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/index.html');
});


//socketio code for connection on 
io.on('connection',(socket)=>{
    console.log('a user has been connected');

    //create a new player and at it to Players object
    players[socket.id] ={
        rotation: 0,
        x: Math.floor(Math.random()*700)+50,
        y: Math.floor(Math.random()*500)+50,
        playerId: socket.id,
        team: (Math.floor(Math.random()*2)==0)?'red':'blue'
    };

    //Sending the players object to the new player
    socket.emit('currentPlayers',players);

    //send the Start object to new Player
    socket.emit('starLocation',star);

    //send the current scores
    socket.emit('scoreUpdate',scores);

    //update all other players of the new player
    socket.broadcast.emit('newPlayer',players[socket.id]);


    socket.on('disconnect',()=>{
        console.log('User has been disconnected');
        scores = {
            blue: 0,
            red:0
        };
        // To Remove a player from our players object
        delete players[socket.id];

        // emit a message to all players about removing a player
        io.emit('disconnect',socket.id);
    });


    socket.on('playerMovement',(movementData)=>{
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        players[socket.id].rotation = movementData.rotation;
    
        //emit a message to all players about the player that moved
        socket.broadcast.emit('playerMoved',players[socket.id]);
    
    });

    socket.on('starCollected',()=>{
       
            if(players[socket.id].team === 'red'){
                scores.red += 10;
            }else{
                scores.blue += 10;
                
            }
        io.emit('scoreUpdate',scores);
        star.x = Math.floor(Math.random()*700);
        star.y = Math.floor(Math.random()*500);
        io.emit('starLocation',star);
       
    });
    
});





server.listen(port,()=>{
    console.log(`Listening on ${server.address().port}`);
});