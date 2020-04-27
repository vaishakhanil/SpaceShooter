/*! For license information please see app.js.LICENSE.txt */
!function(e){var n={};function t(s){if(n[s])return n[s].exports;var i=n[s]={i:s,l:!1,exports:{}};return e[s].call(i.exports,i,i.exports,t),i.l=!0,i.exports}t.m=e,t.c=n,t.d=function(e,n,s){t.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:s})},t.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},t.t=function(e,n){if(1&n&&(e=t(e)),8&n)return e;if(4&n&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(t.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var i in e)t.d(s,i,function(n){return e[n]}.bind(null,i));return s},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},t.p="",t(t.s="./src/index.js")}({"./src/index.js":function(module,exports){eval("let config = {\n    type: Phaser.AUTO,\n    parent: 'phaser-example',\n    width: 800,\n    height: 600,\n    physics: {\n        default: 'arcade',\n        arcade:{\n            debug: false,\n            gravity:{y:0}\n        }\n    },\n    scene:{\n        preload: preload,\n        create: create,\n        update: update\n    }\n};\n\nlet game = new Phaser.Game(config);\n\nfunction preload(){\n    this.load.image('ship','assets/spaceShips_001.png');\n    this.load.image('otherPlayer','assets/enemyBlack5.png');\n    this.load.image('dot','assets/dot.png');\n    this.load.image('star','assets/star_gold.png');\n    this.load.image('sky','assets/background/background.png');\n    this.load.image('planets','assets/background/planets.png');\n    this.load.image('bigPlanets','assets/background/big_planets.png');\n    this.load.image('stars','assets/background/stars.png');\n    this.load.image('rings','assets/background/rings.png');\n\n    this.load.image('beam','assets/lasers.png');\n\n}\n\nfunction create(){\n    this.add.image(400,300,'sky').setScale(4);\n    this.add.image(400,300,'planets');\n    this.add.image(400,300,'bigPlanets').setOrigin(0,0);\n    this.add.image(400,300,'stars').setScale(3);\n    this.add.image(30,300,'rings')\n\n\n    let self = this;\n    this.socket = io();\n    this.otherPlayers = this.physics.add.group(); //new\n    this.socket.on('currentPlayers',(players)=>{\n        Object.keys(players).forEach((id)=>{\n            if(players[id].playerId === self.socket.id){\n                addPlayer(self,players[id]);\n            }else{\n                addOtherPlayers(self,players[id]);\n            }\n        });\n    });\n\n    this.socket.on('newPlayer',(playerInfo)=>{\n        addOtherPlayers(self, playerInfo);\n    });\n\n    this.socket.on('disconnect',(playerId)=>{\n        self.otherPlayers.getChildren().forEach((otherPlayer)=>{\n            if(playerId === otherPlayer.playerId){\n                otherPlayer.destroy();\n            }\n        })\n    })\n\n    // Handling player inputs\n    this.cursors = this.input.keyboard.createCursorKeys();\n\n    // Listening to player move\n    this.socket.on('playerMoved',(playerInfo)=>{\n        self.otherPlayers.getChildren().forEach((otherPlayer)=>{\n            if(playerInfo.playerId === otherPlayer.playerId){\n                otherPlayer.setRotation(playerInfo.rotation);\n                otherPlayer.setPosition(playerInfo.x,playerInfo.y);\n            }\n        });\n    })\n\n    this.blueScoreText = this.add.text(16,16,'',{fontSize: '32px', fill: '#0000FF'});\n    this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });\n  \n    this.socket.on('scoreUpdate',(scores)=>{\n        self.blueScoreText.setText('Blue: '+scores.blue);\n        self.redScoreText.setText('Red: '+scores.red);\n    });\n\n    this.socket.on('starLocation',(starLocation)=>{\n        if(self.star) self.star.destroy();\n        self.star = self.physics.add.image(starLocation.x,starLocation.y,'star');\n        self.physics.add.overlap(self.ship,self.star,()=>{\n            this.socket.emit('starCollected');\n        },null,self);\n    });\n   \n   \n    \n}\n\nfunction update(){\n    if (this.ship) {\n        if (this.cursors.left.isDown) {\n          this.ship.setAngularVelocity(-150);\n          this.dot.setAngularVelocity(-150);\n        } else if (this.cursors.right.isDown) {\n          this.ship.setAngularVelocity(150);\n          this.dot.setAngularVelocity(150);\n        } else {\n          this.ship.setAngularVelocity(0);\n          this.dot.setAngularVelocity(0);\n        }\n      \n        if (this.cursors.up.isDown) {\n          this.physics.velocityFromRotation(this.ship.rotation + 1.5, 100, this.ship.body.acceleration);\n          this.physics.velocityFromRotation(this.dot.rotation + 1.5, 100, this.dot.body.acceleration);\n        } else {\n          this.ship.setAcceleration(0);\n          this.dot.setAcceleration(0);\n        }\n\n\n        this.physics.world.wrap(this.ship, 5);\n        this.physics.world.wrap(this.dot, 5);\n    \n\n        //emit player movements\n        let x = this.ship.x;\n        let y = this.ship.y;\n        let r = this.ship.rotation;\n\n        if(this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)){\n            this.socket.emit('playerMovement',{x:this.ship.x,y: this.ship.y, rotation:this.ship.rotation});\n        }\n\n        //save old position data\n        this.ship.oldPosition = {\n            x: this.ship.x,\n            y: this.ship.y,\n            rotation: this.ship.rotation\n        }\n\n    }\n   \n}\n\n\n\n\nfunction addPlayer(self,playerInfo){\n    self.ship = self.physics.add.image(playerInfo.x,playerInfo.y, 'ship').setOrigin(0.5,0.5).setDisplaySize(53,40);\n    self.dot = self.physics.add.image(playerInfo.x,playerInfo.y-25,'dot').setOrigin(0.5,0.5).setDisplaySize(10,10);\n    if(playerInfo.team === 'blue'){\n        self.dot.setTint(0x0000ff);\n    }else{\n        self.dot.setTint(0xff0000);\n    }\n    self.ship.setDrag(100);\n    self.ship.setAngularDrag(100);\n    self.ship.setMaxVelocity(200);\n\n\n    self.dot.setDrag(100);\n    self.dot.setAngularDrag(100);\n    self.dot.setMaxVelocity(200);\n}\n\nfunction addOtherPlayers(self,playerInfo){\n    const otherPlayer = self.add.sprite(playerInfo.x,playerInfo.y,'otherPlayer').setOrigin(0.5,0.5).setDisplaySize(53,40);\n    if(playerInfo.team === 'blue'){\n        otherPlayer.setTint(0x0000ff);\n    }else{\n        otherPlayer.setTint(0xff0000);\n    }\n    otherPlayer.playerId = playerInfo.playerId;\n    self.otherPlayers.add(otherPlayer);\n}\n\n//# sourceURL=webpack:///./src/index.js?")}});