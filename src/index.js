let config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade:{
            debug: false,
            gravity:{y:0}
        }
    },
    scene:{
        preload: preload,
        create: create,
        update: update
    }
};

let game = new Phaser.Game(config);

function preload(){
    this.load.image('ship','assets/spaceShips_001.png');
    this.load.image('otherPlayer','assets/enemyBlack5.png');
    this.load.image('dot','assets/dot.png');
    this.load.image('star','assets/star_gold.png');
    this.load.image('sky','assets/background/background.png');
    this.load.image('planets','assets/background/planets.png');
    this.load.image('bigPlanets','assets/background/big_planets.png');
    this.load.image('stars','assets/background/stars.png');
    this.load.image('rings','assets/background/rings.png');

    this.load.image('beam','assets/lasers.png');

}

function create(){
    this.add.image(400,300,'sky').setScale(4);
    this.add.image(400,300,'planets');
    this.add.image(400,300,'bigPlanets').setOrigin(0,0);
    this.add.image(400,300,'stars').setScale(3);
    this.add.image(30,300,'rings')


    let self = this;
    this.socket = io();
    this.otherPlayers = this.physics.add.group(); //new
    this.socket.on('currentPlayers',(players)=>{
        Object.keys(players).forEach((id)=>{
            if(players[id].playerId === self.socket.id){
                addPlayer(self,players[id]);
            }else{
                addOtherPlayers(self,players[id]);
            }
        });
    });

    this.socket.on('newPlayer',(playerInfo)=>{
        addOtherPlayers(self, playerInfo);
    });

    this.socket.on('disconnect',(playerId)=>{
        self.otherPlayers.getChildren().forEach((otherPlayer)=>{
            if(playerId === otherPlayer.playerId){
                otherPlayer.destroy();
            }
        })
    })

    // Handling player inputs
    this.cursors = this.input.keyboard.createCursorKeys();

    // Listening to player move
    this.socket.on('playerMoved',(playerInfo)=>{
        self.otherPlayers.getChildren().forEach((otherPlayer)=>{
            if(playerInfo.playerId === otherPlayer.playerId){
                otherPlayer.setRotation(playerInfo.rotation);
                otherPlayer.setPosition(playerInfo.x,playerInfo.y);
            }
        });
    })

    this.blueScoreText = this.add.text(100,550,'',{fontSize: '32px', fill: '#0000FF'});
    this.redScoreText = this.add.text(584, 550, '', { fontSize: '32px', fill: '#FF0000' });
  
    this.socket.on('scoreUpdate',(scores)=>{
        if(scores.red < 1000 && scores.blue < 1000){
            self.blueScoreText.setText('Blue: '+ scores.blue);
            self.redScoreText.setText('Red: '+ scores.red);
        }else{
            if(scores.red > 1000){
                self.redScoreText.setText('Red: Won! ');
            }else{
                self.blueScoreText.setText('Blue: Won!');
            }
        }
        
    }); 

    this.socket.on('starLocation',(starLocation)=>{
        if(self.star) self.star.destroy();
        self.star = self.physics.add.image(starLocation.x,starLocation.y,'star').setScale(0.5);
        self.physics.add.overlap(self.ship,self.star,()=>{
            this.socket.emit('starCollected');
        },null,self);
    });
   
   
    
}

function update(){
    if (this.ship) {
        if (this.cursors.left.isDown) {
          this.ship.setAngularVelocity(-150);
          this.dot.setAngularVelocity(-150);
        } else if (this.cursors.right.isDown) {
          this.ship.setAngularVelocity(150);
          this.dot.setAngularVelocity(150);
        } else {
          this.ship.setAngularVelocity(0);
          this.dot.setAngularVelocity(0);
        }
      
        if (this.cursors.up.isDown) {
          this.physics.velocityFromRotation(this.ship.rotation + 1.5, 100, this.ship.body.acceleration);
          this.physics.velocityFromRotation(this.dot.rotation + 1.5, 100, this.dot.body.acceleration);
        } else {
          this.ship.setAcceleration(0);
          this.dot.setAcceleration(0);
        }


        this.physics.world.wrap(this.ship, 5);
        this.physics.world.wrap(this.dot, 5);
    

        //emit player movements
        let x = this.ship.x;
        let y = this.ship.y;
        let r = this.ship.rotation;

        if(this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)){
            this.socket.emit('playerMovement',{x:this.ship.x,y: this.ship.y, rotation:this.ship.rotation});
        }

        //save old position data
        this.ship.oldPosition = {
            x: this.ship.x,
            y: this.ship.y,
            rotation: this.ship.rotation
        }

    }
   
}




function addPlayer(self,playerInfo){
    self.ship = self.physics.add.image(playerInfo.x,playerInfo.y, 'ship').setOrigin(0.5,0.5).setDisplaySize(53,40);
    self.dot = self.physics.add.image(playerInfo.x,playerInfo.y,'dot').setOrigin(0.5,0.5).setDisplaySize(10,10);
    if(playerInfo.team === 'blue'){
        self.dot.setTint(0x0000ff);
    }else{
        self.dot.setTint(0xff0000);
    }
    self.ship.setDrag(100);
    self.ship.setAngularDrag(100);
    self.ship.setMaxVelocity(200);


    self.dot.setDrag(100);
    self.dot.setAngularDrag(100);
    self.dot.setMaxVelocity(200);
}

function addOtherPlayers(self,playerInfo){
    const otherPlayer = self.add.sprite(playerInfo.x,playerInfo.y,'otherPlayer').setOrigin(0.5,0.5).setDisplaySize(53,40);
    if(playerInfo.team === 'blue'){
        otherPlayer.setTint(0x0000ff);
    }else{
        otherPlayer.setTint(0xff0000);
    }
    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer);
}