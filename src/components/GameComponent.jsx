import React, { useRef, useEffect } from 'react';

const GameComponent = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const CANVAS_WIDTH = canvas.width = 800;
    const CANVAS_HEIGHT = canvas.height = 700;

    // Game state variables
    let gameOver = false;
    let soundEnabled = true;
    let highScore = localStorage.getItem('highScore') || 0;
    let totalCoinsCollected = 0;
    let numberOfRolls = 10;
    let gameSpeed = 0;
    let score = 0;
    let defaultSpeed = 2;
    gameSpeed = defaultSpeed;
    let playerState = 'run';
    let gameFrame = 0;
    const staggerFrames = 5;

    // Sound manager
    const soundManager = {
      sounds: {
        roll: new Audio('../assets/sounds/hit.mp3'),
        coin: new Audio('../assets/sounds/coin.mp3'),
        hit: new Audio('../assets/sounds/death.mp3'),
        check: new Audio('../assets/sounds/check.mp3'),
      },
      play: function(soundName) {
        if (!soundEnabled) return;
        const sound = this.sounds[soundName].cloneNode();
        sound.volume = 0.5;
        sound.play().catch(e => console.log(`Failed to play ${soundName} sound:`, e));
      },
      stopAll: function() {
        Object.values(this.sounds).forEach(sound => {
          sound.pause();
          sound.currentTime = 0;
        });
      },
      toggle: function() {
        soundEnabled = !soundEnabled;
        if (!soundEnabled) this.stopAll();
        return soundEnabled;
      }
    };

    // Image assets
    const playerImage = new Image();
    playerImage.src = '../assets/images/shadow-dog.png';
    const backgroundLayer1 = new Image();
    backgroundLayer1.src = '../assets/images/layer-1.png';
    const backgroundLayer2 = new Image();
    backgroundLayer2.src = '../assets/images/layer-2.png';
    const backgroundLayer3 = new Image();
    backgroundLayer3.src = '../assets/images/layer-3.png';
    const backgroundLayer4 = new Image();
    backgroundLayer4.src = '../assets/images/layer-4.png';
    const backgroundLayer5 = new Image();
    backgroundLayer5.src = '../assets/images/layer-5.png';
    const coinImage = new Image();
    coinImage.src = '../assets/images/coin.png';
    const pain = new Image();
    pain.src = '../assets/images/pain-meme.jpg';

    // Sprite animation setup
    const spriteWidth = 575;
    const spriteHeight = 523;
    const spriteAnimations = {};
    const animationStates = [
      { name: 'idle', frames: 7 },
      { name: 'jump', frames: 7 },
      { name: 'fall', frames: 7 },
      { name: 'run', frames: 9 },
      { name: 'dizzy', frames: 11 },
      { name: 'sit', frames: 5 },
      { name: 'roll', frames: 7 }
    ];

    animationStates.forEach((state, index) => {
      let frames = { loc: [] };
      for (let i = 0; i < state.frames; i++) {
        let positionX = i * spriteWidth;
        let positionY = index * spriteHeight;
        frames.loc.push({ x: positionX, y: positionY });
      }
      spriteAnimations[state.name] = frames;
    });

    // Game object classes
    class Layer {
      constructor(image, speedModifier) {
        this.x = 0;
        this.y = 0;
        this.width = 2400;
        this.height = 700;
        this.image = image;
        this.speedModifier = speedModifier;
        this.speed = gameSpeed * this.speedModifier;
      }
      update() {
        this.speed = gameSpeed * this.speedModifier;
        if (this.x <= -this.width) {
          this.x = 0;
        }
        this.x -= this.speed;
      }
      draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        ctx.drawImage(this.image, this.x + this.width, this.y, this.width, this.height);
      }
    }

    class Enemy {
      constructor(index) {
        this.image = new Image();
        this.image.src = '../assets/images/enemy2.png';
        this.spriteWidth = 266;
        this.spriteHeight = 188;
        this.width = this.spriteWidth / 3;
        this.height = this.spriteHeight / 3;
        this.index = index;
        this.enemySpacing = 4000;
        this.x = CANVAS_WIDTH + (this.index * this.enemySpacing);
        this.y = Math.random() * (300 - 120) + 120;
        this.speed = Math.random() * 1 + 2;
        this.angle = 0;
        this.angleSpeed = Math.random() * 0.1 + 0.05;
        this.curve = Math.random() * 2 + 2;
        this.frame = 0;
        this.flapSpeed = Math.floor(Math.random() * 3 + 1);
        this.remove = false;
        this.state = 'normal';
        this.disappearFrame = 0;
        this.disappearFrameEffect = 10;
      }
      update() {
        if (this.state === 'normal') {
          this.x -= this.speed;
          if (gameSpeed >= 7) {
            this.y += Math.sin(this.angle) * this.curve;
          }
          this.angle += this.angleSpeed;
          if (this.x + this.width < 0) {
            let rightmostX = 0;
            enemiesArray.forEach(enemy => {
              if (enemy !== this && enemy.x > rightmostX) {
                rightmostX = enemy.x;
              }
            });
            if (rightmostX > 0) {
              let minSpacing = CANVAS_WIDTH * 1.5;
              let randomVariance = Math.random() * (CANVAS_WIDTH * 0.8);
              this.x = rightmostX + minSpacing + randomVariance;
            } else {
              this.x = CANVAS_WIDTH + Math.random() * 1000 + 1000;
            }
            this.y = Math.random() * (300 - 120) + 120;
          }
          if (gameFrame % this.flapSpeed === 0) {
            this.frame = this.frame > 4 ? 0 : this.frame + 1;
          }
        } else if (this.state === 'disappear') {
          this.disappearFrame++;
          if (this.disappearFrame >= this.disappearFrameEffect) {
            this.remove = true;
          }
        }
      }
      draw() {
        if (this.state === 'normal') {
          ctx.globalAlpha = 1 - (this.disappearFrame / this.disappearFrameEffect);
          ctx.drawImage(
            this.image,
            this.frame * this.spriteWidth, 0,
            this.spriteWidth, this.spriteHeight,
            this.x, this.y,
            this.width, this.height
          );
          ctx.globalAlpha = 1;
        }
      }
    }

    class Ghost {
      constructor(index) {
        this.image = new Image();
        this.image.src = '../assets/images/enemy-ghost.png';
        this.ghostWidth = 261;
        this.ghostHeight = 209;
        this.width = this.ghostWidth / 3;
        this.height = this.ghostHeight / 3;
        this.index = index || 0;
        const baseSpacing = 600;
        const randomSpacing = Math.random() * 1200;
        this.x = CANVAS_WIDTH + (index * baseSpacing) + randomSpacing;
        this.y = 510;
        this.speed = gameSpeed;
        this.timer = 0;
        this.frame = 2;
        this.remove = false;
        this.state = 'normal';
        this.disappearFrame = 0;
        this.disappearFrameEffect = 10;
      }
      update() {
        if (this.state === 'normal') {
          this.speed = gameSpeed + Math.floor(Math.random() * 2);
          this.x -= this.speed;
          if (this.x + this.width < 0) {
            let rightmostX = 0;
            ghostArray.forEach(ghost => {
              if (ghost !== this && ghost.x > rightmostX) {
                rightmostX = ghost.x;
              }
            });
            if (rightmostX > 0) {
              const minSpacing = 800;
              const randomVariance = Math.random() * (400 - 200) + 200;
              this.x = rightmostX + minSpacing + randomVariance;
            } else {
              this.x = CANVAS_WIDTH + Math.random() * 800 + 800;
            }
          }
        } else if (this.state === 'disappear') {
          this.disappearFrame++;
          if (this.disappearFrame >= this.disappearFrameEffect) {
            this.remove = true;
          }
        }
      }
      draw() {
        if (this.state === 'normal') {
          ctx.globalAlpha = 1 - (this.disappearFrame / this.disappearFrameEffect);
          ctx.drawImage(
            this.image, 0, 0,
            this.ghostWidth, this.ghostHeight,
            this.x, this.y,
            this.width, this.height
          );
          ctx.globalAlpha = 1;
        }
      }
    }

    class Coin {
      constructor() {
        this.image = coinImage;
        this.radius = 15;
        this.x = CANVAS_WIDTH + Math.random() * 300;
        this.y = Math.random() * (480 - 50) + 50;
        this.speed = Math.random() * 1 + 2;
        this.collected = false;
      }
      update() {
        this.x -= this.speed;
        if (this.x + this.radius * 2 < 0) {
          this.x = CANVAS_WIDTH + Math.random() * (600 - 200) + 200;
          this.y = Math.random() * (480 - 50) + 50;
        }
      }
      draw() {
        ctx.drawImage(this.image, this.x, this.y, this.radius * 2, this.radius * 2);
      }
    }

    class Player {
      constructor() {
        this.width = spriteWidth / 5;
        this.height = spriteHeight / 5;
        this.x = 0;
        this.y = 480;
        this.jumpCount = 0;
        this.maxJumps = 2;
        this.velocityY = 0;
        this.gravity = 1;
        this.jumpStrength = 22;
        this.grounded = false;
        this.isRolling = false;
        this.rollTarget = this.x;
        this.rollCount = 0;
        this.rollMax = 10;
        this.velocityX = 0;
        this.maxSpeed = 10;
        this.acceleration = 0.5;
        this.friction = 0.3;
      }
      draw() {
        let position = Math.floor(gameFrame / staggerFrames) % spriteAnimations[playerState].loc.length;
        let frameX = spriteAnimations[playerState].loc[position].x;
        let frameY = spriteAnimations[playerState].loc[position].y;
        ctx.drawImage(
          playerImage,
          frameX, frameY,
          spriteWidth, spriteHeight,
          this.x, this.y,
          this.width, this.height
        );
      }
      update() {
        this.velocityY += this.gravity;
        this.y += this.velocityY;
        if (this.y >= 480) {
          this.y = 480;
          this.jumpCount = 0;
          this.velocityY = 0;
          this.grounded = true;
          if (playerState === 'jump' || playerState === 'fall') {
            playerState = 'run';
          }
        } else {
          this.grounded = false;
          if (this.velocityY < 0) playerState = 'jump';
          else if (this.velocityY > 0) playerState = 'fall';
        }
        if (!this.grounded && keys['ArrowRight']) {
          this.velocityX = Math.min(this.velocityX + this.acceleration, this.maxSpeed);
        } else {
          if (this.velocityX > 0) {
            this.velocityX = Math.max(this.velocityX - this.friction, 0);
          }
        }
        this.x += this.velocityX;
        if (this.isRolling) {
          if (this.x < this.rollTarget) {
            this.x += 5;
            if (this.x > this.rollTarget) this.x = this.rollTarget;
          }
        } else {
          if (this.x > 0) {
            this.x -= 5;
            if (this.x < 0) this.x = 0;
          }
        }
      }
      jump() {
        if ((this.grounded || this.jumpCount < this.maxJumps) && !this.isRolling) {
          this.velocityY = -this.jumpStrength;
          this.grounded = false;
          playerState = 'jump';
          this.jumpCount++;
        }
      }
      roll() {
        if (!this.isRolling && this.rollMax > this.rollCount) {
          this.rollCount++;
          numberOfRolls--;
          this.isRolling = true;
          playerState = 'roll';
          gameSpeed = defaultSpeed + 2;
          this.rollTarget = Math.min(this.x + 100, 200);
          setTimeout(() => {
            gameSpeed = defaultSpeed;
            playerState = 'run';
            this.isRolling = false;
          }, 1000);
        }
      }
    }

    // Instantiate game objects
    const player = new Player();
    const background1 = new Layer(backgroundLayer1, 10);
    const background2 = new Layer(backgroundLayer2, 20);
    const background3 = new Layer(backgroundLayer3, 0.5);
    const background4 = new Layer(backgroundLayer4, 0.5);
    const background5 = new Layer(backgroundLayer5, 0.1);
    const gameObjects = [background1, background2, background3, background4, background5];

    let numberOfEnemies = 10;
    let enemiesArray = [];
    for (let i = 0; i < numberOfEnemies; i++) {
      enemiesArray.push(new Enemy(i));
    }

    let numberOfGhost = 10;
    let ghostArray = [];
    for (let i = 0; i < numberOfGhost; i++) {
      ghostArray.push(new Ghost(i));
    }

    const numberOfCoins = 4;
    let coinsArray = [];
    for (let i = 0; i < numberOfCoins; i++) {
      coinsArray.push(new Coin());
    }

    // Input handling
    const keys = {};

    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && gameOver) {
        resetGame();
      }
      keys[event.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
      }
      if (event.code === 'ArrowUp') {
        player.jump();
      } else if (event.code === 'ArrowDown') {
        player.roll();
      }
    };

    const handleKeyUp = (event) => {
      keys[event.code] = false;
    };

    const handleClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const buttonX = CANVAS_WIDTH - 50;
      const buttonY = 30;
      const distance = Math.sqrt(Math.pow(mouseX - buttonX, 2) + Math.pow(mouseY - buttonY, 2));
      if (distance <= 20) {
        soundManager.toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('click', handleClick);

    // Utility functions
    const checkCollision = (rect1, rect2) => {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      );
    };

    const drawSoundButton = () => {
      const x = CANVAS_WIDTH - 50;
      const y = 30;
      const radius = 20;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      if (soundEnabled) {
        ctx.moveTo(x - 10, y - 5);
        ctx.lineTo(x - 5, y - 5);
        ctx.lineTo(x, y - 10);
        ctx.lineTo(x, y + 10);
        ctx.lineTo(x - 5, y + 5);
        ctx.lineTo(x - 10, y + 5);
        ctx.lineTo(x - 10, y - 5);
        ctx.moveTo(x + 4, y - 5);
        ctx.arc(x, y, 8, -Math.PI / 4, Math.PI / 4);
        ctx.moveTo(x + 8, y - 8);
        ctx.arc(x, y, 12, -Math.PI / 4, Math.PI / 4);
      } else {
        ctx.moveTo(x - 10, y - 5);
        ctx.lineTo(x - 5, y - 5);
        ctx.lineTo(x, y - 10);
        ctx.lineTo(x, y + 10);
        ctx.lineTo(x - 5, y + 5);
        ctx.lineTo(x - 10, y + 5);
        ctx.lineTo(x - 10, y - 5);
        ctx.moveTo(x - 12, y - 12);
        ctx.lineTo(x + 12, y + 12);
      }
      ctx.stroke();
    };

    // Game loop
    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (gameOver) {
        playerState = 'dizzy';
        ctx.drawImage(pain, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Your Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
        ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 140);
        ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 50);
        ctx.fillText('Press Enter to RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 100);
        return;
      }

      gameObjects.forEach((layer) => {
        layer.update();
        layer.draw();
      });

      player.update();
      player.draw();

      enemiesArray.forEach((enemy) => {
        enemy.update();
        enemy.draw();
        if (checkCollision(
          { x: player.x, y: player.y, width: player.width, height: player.height },
          { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
        )) {
          if (playerState !== 'roll') {
            soundManager.play('hit');
            soundManager.stopAll();
            console.log('Game Over!');
            gameOver = true;
          } else {
            enemy.state = 'disappear';
            score += 5;
          }
        }
      });
      enemiesArray = enemiesArray.filter(enemy => !enemy.remove);
      const maxEnemies = Math.min(numberOfEnemies, 20);
      while (enemiesArray.length < maxEnemies) {
        let rightmostX = 0;
        enemiesArray.forEach(enemy => {
          if (enemy.x > rightmostX) {
            rightmostX = enemy.x;
          }
        });
        let newX = rightmostX > 0 ?
          rightmostX + 1200 + Math.random() * 600 :
          CANVAS_WIDTH + Math.random() * 1000 + 1000;
        let enemy = new Enemy(enemiesArray.length);
        enemy.x = newX;
        enemiesArray.push(enemy);
      }

      ghostArray.forEach((ghost) => {
        ghost.update();
        ghost.draw();
        if (checkCollision(
          { x: player.x, y: player.y, width: player.width, height: player.height },
          { x: ghost.x, y: ghost.y, width: ghost.width, height: ghost.height }
        )) {
          if (playerState === 'roll' && ghost.state === 'normal') {
            ghost.state = 'disappear';
            score += 5;
          } else if (ghost.state === 'normal') {
            soundManager.play('hit');
            console.log('Game Over!');
            gameOver = true;
          }
        }
      });
      ghostArray = ghostArray.filter(ghost => !ghost.remove);
      const maxGhosts = Math.min(numberOfGhost, 15);
      while (ghostArray.length < maxGhosts) {
        let rightmostX = 0;
        ghostArray.forEach(ghost => {
          if (ghost.x > rightmostX) {
            rightmostX = ghost.x;
          }
        });
        let newX = rightmostX > 0 ?
          rightmostX + 800 + Math.random() * 400 :
          CANVAS_WIDTH + Math.random() * 800;
        let ghost = new Ghost(ghostArray.length);
        ghost.x = newX;
        ghostArray.push(ghost);
      }

      coinsArray.forEach((coin) => {
        coin.update();
        coin.draw();
        if (checkCollision(
          { x: player.x, y: player.y, width: player.width, height: player.height },
          { x: coin.x, y: coin.y, width: coin.radius * 2, height: coin.radius * 2 }
        )) {
          soundManager.play('coin');
          coin.collected = true;
          score += 10;
          totalCoinsCollected++;
          if (totalCoinsCollected >= 10) {
            numberOfRolls++;
            totalCoinsCollected = 0;
            soundManager.play('check');
          }
          if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
          }
          if (defaultSpeed < 6) {
            defaultSpeed += 0.1;
          }
          if (numberOfEnemies < 20) {
            numberOfEnemies += 1;
          }
          if (numberOfGhost < 15) {
            numberOfGhost += 1;
          }
        }
      });
      coinsArray = coinsArray.filter(coin => !coin.collected);
      while (coinsArray.length < numberOfCoins) {
        coinsArray.push(new Coin());
      }

      drawSoundButton();
      ctx.fillStyle = 'black';
      ctx.font = '24px Arial';
      ctx.fillText('Score: ' + score, 20, 30);
      ctx.fillText('Roll: ' + numberOfRolls, 20, 60);

      gameFrame++;
      animationFrameId = window.requestAnimationFrame(render);
    };

    // Reset game function
    const resetGame = () => {
      ctx.textAlign = 'start';
      ctx.fillStyle = 'black';
      ctx.font = '24px Arial';
      soundManager.stopAll();
      soundManager.play('roll');
      gameOver = false;
      score = 0;
      numberOfRolls = 10;
      player.x = 0;
      player.y = 480;
      player.rollCount = 0;
      player.jumpCount = 0;
      enemiesArray = [];
      ghostArray = [];
      coinsArray = [];
      totalCoinsCollected = 0;
      numberOfEnemies = 5;
      numberOfGhost = 3;
      defaultSpeed = 2;
      gameSpeed = defaultSpeed;
      playerState = 'run';
      render();
    };

    // Start the game loop
    render();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('click', handleClick);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []); // Empty dependency array means this runs once on mount

  return <canvas ref={canvasRef} />;
};

export default GameComponent;