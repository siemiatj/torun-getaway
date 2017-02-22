import round from 'lodash.round';
import Hammer from 'hammerjs';
import * as Util from 'util';
import { COLORS, BACKGROUND, SPRITES } from 'constants';



//=========================================================================
// canvas rendering helpers
//=========================================================================
export default class Render {
  constructor(gameInstance, canvas, leftTouch, rightTouch) {
    this.game = gameInstance;
    this.canvas = canvas;
    this.leftTouch = leftTouch;
    this.rightTouch = rightTouch;
    this.ctx = canvas.getContext('2d');
    this.uiElements = {};

    this.handleTouch = this.handleTouch.bind(this);
    this.renderGame = this.renderGame.bind(this);

    const gameCanvasTouch = new Hammer(this.canvas);
    gameCanvasTouch.on('tap', this.handleTouch);
  }

  handleTouch(e) {
    const prop = this.game.getValue;
    const gameStep = prop('gameStep');
    const gameOver = prop('gameOver');

    if (gameStep !== 'game' || (gameStep === 'game' && gameOver)) {
      let x = e.pointers[0].clientX;
      let y = e.pointers[0].clientY;

      x -= this.canvas.offsetLeft;
      y -= this.canvas.offsetTop;

      for (const i of Object.values(this.uiElements)) {
        if (x >= i.posX && x < (i.posX + i.width) && y >= i.posY && y <= (i.posY + i.height)) {
          i.onClick && i.onClick();
          this.uiElements = {};

          break;
        }
      }
    }
  }

  drawPolygon(x1, y1, x2, y2, x3, y3, x4, y4, color) {
    const { ctx } = this;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  drawSegment(width, lanes, x1, y1, w1, x2, y2, w2, fog, color) {
    const { ctx } = this;

    var r1 = this.rumbleWidth(w1, lanes),
        r2 = this.rumbleWidth(w2, lanes),
        l1 = this.laneMarkerWidth(w1, lanes),
        l2 = this.laneMarkerWidth(w2, lanes),
        lanew1, lanew2, lanex1, lanex2, lane;
    
    ctx.fillStyle = color.grass;
    ctx.fillRect(0, y2, width, y1 - y2);
    
    this.drawPolygon(x1-w1-r1, y1, x1-w1, y1, x2-w2, y2, x2-w2-r2, y2, color.rumble);
    this.drawPolygon(x1+w1+r1, y1, x1+w1, y1, x2+w2, y2, x2+w2+r2, y2, color.rumble);
    this.drawPolygon(x1-w1, y1, x1+w1, y1, x2+w2, y2, x2-w2, y2, color.road);
    
    if (color.lane) {
      lanew1 = w1*2/lanes;
      lanew2 = w2*2/lanes;
      lanex1 = x1 - w1 + lanew1;
      lanex2 = x2 - w2 + lanew2;

      for (lane = 1; lane < lanes; lanex1 += lanew1, lanex2 += lanew2, lane++) {
        this.drawPolygon(lanex1 - l1/2, y1, lanex1 + l1/2, y1, lanex2 + l2/2, y2, lanex2 - l2/2, y2, color.lane);
      }
    }
    
    // this.drawFog(0, y1, width, y2-y1, fog);
  }

  drawBackground(background, width, height, layer, rotation, offset) {
    rotation = rotation || 0;
    offset   = offset   || 0;

    const imageW = layer.w / 2;
    const imageH = layer.h;

    const sourceX = layer.x + Math.floor(layer.w * rotation);
    const sourceY = layer.y
    const sourceW = Math.min(imageW, layer.x + layer.w - sourceX);
    const sourceH = imageH;
    
    const destX = 0;
    const destY = offset;
    const destW = Math.floor(width * (sourceW / imageW));
    const destH = height;

    this.ctx.drawImage(background, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH);
    if (sourceW < imageW) {
      this.ctx.drawImage(background, layer.x, sourceY, imageW-sourceW, sourceH, destW-1, destY, width-destW, destH);
    }
  }

  drawSprite(width, height, roadWidth, sprite, scale, destX, destY, offsetX, offsetY, clipY) {
    const sprites = this.game.getValue('assets.sprites');
    const destW  = (sprite.w * scale * width/2) * (SPRITES.SCALE * roadWidth);
    const destH  = (sprite.h * scale * width/2) * (SPRITES.SCALE * roadWidth);

    destX = destX + (destW * (offsetX || 0));
    destY = destY + (destH * (offsetY || 0));
    const clipH = clipY ? Math.max(0, destY+destH-clipY) : 0;

    if (clipH < destH) {
      this.ctx.drawImage(
        sprites,
        sprite.x,
        sprite.y,
        sprite.w,
        sprite.h - (sprite.h * clipH / destH),
        destX,
        destY,
        destW,
        destH - clipH
      );
    }
  }

  drawTitle() {
    const props = this.game.getValue;
    const image = props('assets.title');
    const width = props('width');

    this.ctx.drawImage(image, ((width / 2) - (435 / 2)), 50, 435, 52);
  }

  drawPlayer(width, height, resolution, roadWidth, speedPercent, scale, destX, destY, steer, updown) {
    const props = this.game.getValue;
    const player = props('driver');
    // const steer = speed * (keyLeft ? -1 : keyRight ? 1 : 0);
    const bounce = (1.5 * Math.random() * speedPercent * resolution) * Util.randomChoice([-1,1]);
    let sprite;

    if (steer < 0) {
      // sprite = (updown > 0) ? SPRITES.[`PLAYER_UPHILL_LEFT`] : SPRITES.PLAYER_LEFT;
      sprite = SPRITES[`PLAYER_${player}_LEFT`];
    } else if (steer > 0) {
      // sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_RIGHT : SPRITES.PLAYER_RIGHT;
      sprite = SPRITES[`PLAYER_${player}_RIGHT`];
    } else {
      // sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_STRAIGHT : SPRITES.PLAYER_STRAIGHT;
      sprite = SPRITES[`PLAYER_${player}_STRAIGHT`];
    }

    this.drawSprite(width, height, roadWidth, sprite, scale, destX, destY + bounce, -0.5, -1);
  }

  drawFog(x, y, width, height, fog) {
    const { ctx } = this;

    if (fog < 1) {
      ctx.globalAlpha = (1 - fog);
      ctx.fillStyle = COLORS.FOG;
      ctx.fillRect(x, y, width, height);
      ctx.globalAlpha = 1;
    }
  }

  rumbleWidth(projectedRoadWidth, lanes) {
    return projectedRoadWidth/Math.max(32, 8*lanes);
  }

  laneMarkerWidth(projectedRoadWidth, lanes) {
    return projectedRoadWidth/Math.max(32, 8*lanes);
  }

  //=========================================================================
  // RENDER THE GAME WORLD
  //=========================================================================
  renderGame() {
    const props = this.game.getValue;
    const keyLeft = props('keyLeft');
    const keyRight = props('keyRight');
    const segments = props('segments');
    const segmentLength = props('segmentLength');
    const position = props('position');
    const background = props('assets.background');
    const width = props('width');
    const height = props('height');
    const resolution = props('resolution');
    const speed = props('speed');
    const maxSpeed = props('maxSpeed');
    const skySpeed = props('skySpeed');
    const hillSpeed = props('hillSpeed');
    const treeSpeed = props('treeSpeed');
    const playerZ = props('playerZ');
    const skyOffset = props('skyOffset');
    const hillOffset = props('hillOffset');
    const treeOffset = props('treeOffset');
    const lanes = props('lanes');
    const playerX = props('playerX');
    const roadWidth = props('roadWidth');
    const cameraHeight = props('cameraHeight');
    const cameraDepth = props('cameraDepth');
    const trackLength = props('trackLength');
    const drawDistance = props('drawDistance');
    const fogDensity = props('fogDensity');
    const baseSegment   = Util.findSegment(segments, segmentLength, position);
    const basePercent   = Util.percentRemaining(position, segmentLength);
    const playerSegment = Util.findSegment(segments, segmentLength, position + playerZ);
    const playerPercent = Util.percentRemaining(position + playerZ, segmentLength);
    const playerY       = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
    let maxy = height;
    let x = 0;
    let dx = -(baseSegment.curve * basePercent);
    let n, i, segment, car, sprite, spriteScale, spriteX, spriteY;

    this.ctx.clearRect(0, 0, width, height);
    // this.canvas.width = width;

    this.drawBackground(background, width, height, BACKGROUND.SKY,   skyOffset,  resolution * skySpeed  * playerY);
    this.drawBackground(background, width, height, BACKGROUND.HILLS, hillOffset, resolution * hillSpeed * playerY);
    this.drawBackground(background, width, height, BACKGROUND.TREES, treeOffset, resolution * treeSpeed * playerY);

    for (n = 0; n < drawDistance; n += 1) {
      segment        = segments[(baseSegment.index + n) % segments.length];
      segment.looped = segment.index < baseSegment.index;
      segment.fog    = Util.exponentialFog(n/drawDistance, fogDensity);
      segment.clip   = maxy;

      Util.project(segment.p1, (playerX * roadWidth) - x, playerY + cameraHeight, position - (segment.looped ? trackLength : 0), cameraDepth, width, height, roadWidth);
      Util.project(segment.p2, (playerX * roadWidth) - x - dx, playerY + cameraHeight, position - (segment.looped ? trackLength : 0), cameraDepth, width, height, roadWidth);

      x  = x + dx;
      dx = dx + segment.curve;

      if ((segment.p1.camera.z <= cameraDepth)         || // behind us
          (segment.p2.screen.y >= segment.p1.screen.y) || // back face cull
          (segment.p2.screen.y >= maxy))                  // clip by (already thised) hill
        continue;

      this.drawSegment(
        width, lanes,
        segment.p1.screen.x,
        segment.p1.screen.y,
        segment.p1.screen.w,
        segment.p2.screen.x,
        segment.p2.screen.y,
        segment.p2.screen.w,
        segment.fog,
        segment.color
      );

      maxy = segment.p1.screen.y;
    }

    n = drawDistance - 1;
    for (; n > 0; n -= 1) {
      segment = segments[(baseSegment.index + n) % segments.length];

      for(i = 0; i < segment.cars.length; i++) {
        car         = segment.cars[i];
        sprite      = car.sprite;
        spriteScale = Util.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent);
        spriteX     = Util.interpolate(segment.p1.screen.x,     segment.p2.screen.x,     car.percent) + (spriteScale * car.offset * roadWidth * width/2);
        spriteY     = Util.interpolate(segment.p1.screen.y,     segment.p2.screen.y,     car.percent);
        this.drawSprite(width, height, roadWidth, car.sprite, spriteScale, spriteX, spriteY, -0.5, -1, segment.clip);
      }

      for(i = 0; i < segment.sprites.length; i += 1) {
        sprite      = segment.sprites[i];
        spriteScale = segment.p1.screen.scale;
        spriteX     = segment.p1.screen.x + (spriteScale * sprite.offset * roadWidth * width/2);
        spriteY     = segment.p1.screen.y;
        this.drawSprite(width, height, roadWidth, sprite.source, spriteScale, spriteX, spriteY, (sprite.offset < 0 ? -1 : 0), -1, segment.clip);
      }

      if (segment === playerSegment) {
        this.drawPlayer(
          width,
          height,
          resolution,
          roadWidth,
          speed / maxSpeed,
          cameraDepth / playerZ, width / 2,
          (height / 2) - (cameraDepth / playerZ * Util.interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * height / 2),
          speed * (keyLeft ? -1 : keyRight ? 1 : 0),
          // playerSegment.p2.world.y - playerSegment.p1.world.y
        );
      }
    }
  }

  renderFBShareIcon() {
    const sprites = this.game.getValue('assets.sprites');

    this.ctx.drawImage(
      sprites,
      SPRITES.ICONFB.x,
      SPRITES.ICONFB.y,
      SPRITES.ICONFB.w,
      SPRITES.ICONFB.h,
      400,
      410,
      40,
      40,
    );
  }

  renderGameOver(uiEvents) {
    const props = this.game.getValue;
    const localePL = props('player.locale') === 'pl_PL';
    const { ctx } = this;
    const width = props('width');
    const height = props('height');
    const score = round(props('currentLapTime'), 2);
    const TEXTS = {
      gameOver: (localePL ? 'KONIEC GRY' : 'GAME OVER'),
      score: (localePL ? 'Twoj czas (s):' : 'Your time (s):'),
      restart: (localePL ? 'KLIKNIJ ABY ZRESTARTOWAC' : 'CLICK ANYWHERE TO RESTART'),
      share: (localePL ? 'PODZIEL SIE NA' : 'SHARE ON YOUR'),
    };

    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = COLORS.OVERLAY;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    this.game.gameFont.drawText(TEXTS.gameOver, [170, 90], 'red', 4, 'white');
    this.game.gameFont.drawText(TEXTS.score, [200, 190], 'white', 2, 'black');
    this.game.gameFont.drawText(`${score}`, [275, 230], 'white', 2, 'black');
    this.game.gameFont.drawText(TEXTS.restart, [210, 310], 'yellow', 1, 'black');

    let color = 'white';
    if (this.uiElements.fb_share_icon) {
      // if (this.uiElements.fb_share_icon.hovered || this.uiElements.fb_share_text.hovered) {
      //   color = 'yellow';
      // }

      this.game.gameFont.drawText(TEXTS.share, [160, 410], color, 2, 'black');
    } else {
      this.game.gameFont.drawText(TEXTS.share, [160, 410], color, 2, 'black');
      const measuredText = this.ctx.measureText(TEXTS.share);

      this.uiElements.game_over_overlay = {
        // hovered: false,
        posX: 0,
        posY: 0,
        width,
        height: height - 90,
        onClick: uiEvents.game_over_overlay,
      };

      this.uiElements.fb_share_text = {
        // hovered: false,
        posX: 160,
        posY: 410,
        width: measuredText.width * 2,
        height: 15 * 2,
        onClick: uiEvents.share_on_fb,
      };

      this.uiElements.fb_share_icon = {
        // hovered: false,
        posX: 400,
        posY: 410,
        width: 40,
        height: 40,
        onClick: uiEvents.share_on_fb,
      }; 
    }

    this.renderFBShareIcon()
  }

  renderOverlay(uiEvents) {
    const { ctx } = this;
    const width = this.game.getValue('width');
    const height = this.game.getValue('height');

    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = COLORS.OVERLAY;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    if (!this.uiElements.start_overlay) {
      this.uiElements.start_overlay = {
        // fullScreenClick: true,
        posX: 0,
        posY: 0,
        width,
        height,
        onClick: uiEvents.start_overlay,
      };
    }
  }

  renderCountdown() {
    const tick = this.game.getValue('startCounter') || 'GO !';

    this.game.gameFont.drawText(`${tick}`, [290, 250], 'white', 3, 'black'); 
  }

  renderStartScreen() {
    const props = this.game.getValue;
    const localePL = props('player.locale') === 'pl_PL';
    const TEXTS = {
      first: (localePL ? ' JAK DALEKO DOWIEZIESZ VIPA ?' : 'HOW FAR CAN YOU DRIVE A VIP ?'),
      second: (localePL ? 'BEZ POSTOJU !' : 'NO STOPPING !'),
      third: (localePL ? 'BEZ KARAMBOLU !' : ' NO CRASHING !'),
      start: (localePL ? 'KLIKNIJ ABY ROZPOCZAC GRE' : ' CLICK TO START THE GAME')
    };

    this.game.gameFont.drawText(TEXTS.first, [100, 180], 'white', 2, 'black');
    this.game.gameFont.drawText(TEXTS.second, [200, 220], 'white', 2, 'black');
    this.game.gameFont.drawText(TEXTS.third, [185, 260], 'white', 2, 'black');
    this.game.gameFont.drawText(TEXTS.start, [205, 320], 'yellow', 1, 'black');
  }

  renderPlayerIcon(playerData, spriteData) {
    const sprites = this.game.getValue('assets.sprites');

    this.ctx.drawImage(
      sprites,
      spriteData.x,
      spriteData.y,
      spriteData.w,
      spriteData.h,
      playerData.iconPosition[0],
      playerData.iconPosition[1],
      80,
      80,
    );
   }

  renderPlayerSelection(uiEvents) {
    const props = this.game.getValue;
    const localePL = props('player.locale') === 'pl_PL';
    const text = localePL ? 'WYBIERZ VIPA' : 'SELECT YOUR VIP';
    const players = [{
      name: 'MONISTER',
      displayName: 'MONISTER',
      textPosition: [250, 200],
      iconPosition: [150, 180],
      event: uiEvents.driver_1
    },
    {
      name: 'APTEKARZ',
      displayName: (localePL ? 'APTEKARZ' : 'PHARMACOLOGIST'),
      textPosition: [250, 300],
      iconPosition: [150, 280],
      event: uiEvents.driver_2
    },
    {
      name: 'CIOCIA',
      displayName: (localePL ? 'CIOCIA' : 'BETTY'),
      textPosition: [250, 400],
      iconPosition: [150, 380],
      event: uiEvents.driver_3
    }];
    const textSize = 2;
    let color = 'white';

    for (let i = 0; i < players.length; i += 1) {
      const it = i + 1;
      const player = players[i];
      const sprite = SPRITES[player.name];
      // let color = 'white';

      if (this.uiElements[`player_${it}_icon`]) {
        // if (this.uiElements[`player_${it}_icon`].hovered || this.uiElements[`player_${it}_text`].hovered) {
        //   color = 'yellow';
        // }

        this.renderPlayerIcon(player, sprite);
        this.game.gameFont.drawText(player.displayName, player.textPosition, color, 2, 'black');
      } else {
        this.game.gameFont.drawText(player.displayName, player.textPosition, color, 2, 'black');
        const measuredText = this.ctx.measureText(player.displayName);

        this.uiElements[`player_${it}_text`] = {
          // hovered: false,
          posX: player.textPosition[0],
          posY: player.textPosition[1],
          width: measuredText.width * textSize,
          height: 15 * textSize,
          onClick: uiEvents[`driver_${it}`],
        }

        this.uiElements[`player_${it}_icon`] = {
          // hovered: false,
          posX: player.iconPosition[0],
          posY: player.iconPosition[1],
          width: 80,
          height: 80,
          onClick: uiEvents[`driver_${it}`],
        }
      }
    }

    this.game.gameFont.drawText(text, [180, 110], 'black', 2, 'white');
  }

  renderIntro(uiEvents) {
    const props = this.game.getValue;
    const text = props('player.locale') === 'pl_PL' ? 'START GRY' : 'START GAME';

    const textPosition = [250, 300];
    const textSize = 2;
    let color = 'white';

    // if (this.uiElements.start_game_text) {
    //   if (this.uiElements.start_game_text.hovered) {
    //     color = 'yellow';
    //   }
    //   this.game.gameFont.drawText(text, textPosition, color, 2, 'black');
    // } else {
    //   this.game.gameFont.drawText(text, textPosition, color, 2, 'black');
    //   const measuredText = this.ctx.measureText(text);

    //   this.uiElements.start_game_text = {
    //     hovered: false,
    //     posX: textPosition[0],
    //     posY: textPosition[1],
    //     width: measuredText.width * textSize,
    //     height: 15 * textSize,
    //     onClick: uiEvents.start_game_text,
    //   }
    // }
    if (!this.uiElements.start_game_text) {
      this.game.gameFont.drawText(text, textPosition, color, 2, 'black');
      const measuredText = this.ctx.measureText(text);

      this.uiElements.start_game_text = {
        // hovered: false,
        posX: textPosition[0],
        posY: textPosition[1],
        width: measuredText.width * textSize,
        height: 15 * textSize,
        onClick: uiEvents.start_game_text,
      }
    } else {
      this.game.gameFont.drawText(text, textPosition, color, 2, 'black');
    }

    const localePL = props('player.locale') === 'pl_PL';
    const TEXTS = {
      accelerate: localePL ? 'PRZYSPIESZ' : 'ACCELERATE',
      brake: localePL ? 'HAMUJ' : 'BRAKE',
      turnL: localePL ? 'LEWO' : 'LEFT',
      turnR: localePL ? 'PRAWO' : 'RIGHT',
    }

    this.game.lTouchFont.drawText(TEXTS.accelerate, [30, 20], 'white', 2);
    this.game.lTouchFont.drawText(TEXTS.turnL, [30, 210], 'white', 2);
    this.game.lTouchFont.drawText(TEXTS.brake, [30, 400], 'white', 2);

    if (!props('leftTouchHeight')) {
      this.game.setTouchCanvasHeights();
    }
  }

  renderScreens(uiEvents) {
    const prop = this.game.getValue;
    const gameStep = prop('gameStep');

    this.drawBackground(prop('assets.intro'), 640, 480, BACKGROUND.MENU);
    this.drawTitle();

    if (gameStep === 'intro') {
      this.renderIntro(uiEvents);
    } else if (gameStep === 'players') {
      this.renderPlayerSelection(uiEvents);
    }
  }

  renderRotate() {
    const { ctx } = this;
    const props = this.game.getValue;
    const width = props('width');
    const height = props('height');
    const localePol = props('player.locale') === 'pl_PL';
    const text = localePol ? 'MUSISZ OBROCIC TELEFON' : 'ROTATE YOUR PHONE';
    const textPos = localePol ? [50, 200] : [100, 200];

    ctx.fillStyle = COLORS.OVERLAY;
    ctx.fillRect(0, 0, width, height);

    this.game.gameFont.drawText(text, textPos, 'white', 3, 'black');
  }

  render(uiEvents) {
    const prop = this.game.getValue;
    const gameStep = prop('gameStep');
    const gameRunning = prop('gameRunning');
    const gameOver = prop('gameOver');
    const orientation = prop('orientation');

    this.ctx.clearRect(0, 0, prop('width'), prop('height'));

    if (orientation === 'portrait') {
      this.renderRotate();
    } else if (gameStep !== 'game' && gameStep !== 'start') {
      this.renderScreens(uiEvents);
    } else {
      this.renderGame();

      if (gameStep === 'start') {
        this.renderOverlay(uiEvents);
        this.renderStartScreen();
      } else if (!gameRunning && !gameOver) {
        this.renderCountdown();
      } else if (gameOver) {
        this.renderGameOver(uiEvents);
      }
    }
  }
}
