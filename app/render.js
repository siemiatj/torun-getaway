import * as Util from 'util';
import { COLORS, BACKGROUND, SPRITES } from 'constants';
import png_font from 'pngfont';

//=========================================================================
// canvas rendering helpers
//=========================================================================
export default class Render {
  constructor(gameInstance, canvas) {
    this.game = gameInstance;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.uiElements = {};

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.renderGame = this.renderGame.bind(this);

    canvas.addEventListener('mousemove', this.handleMouseMove, false);
    canvas.addEventListener('click', this.handleClick, false);
  }

  handleMouseMove(e) {
    e.preventDefault();
    e.stopPropagation();

    const prop = this.game.getValue;
    const gameStep = prop('gameStep');

    if (gameStep !== 'game') {
      let hoveredLink = false;

      let x = 0;
      let y = 0;

      // Get the mouse position relative to the canvas element.
      if (e.layerX || e.layerX == 0) { //for firefox
        x = e.layerX;
        y = e.layerY;
      }
      x -= this.canvas.offsetLeft;
      y -= this.canvas.offsetTop;

      for (const i of Object.values(this.uiElements)) {
        if (x >= i.posX && x < (i.posX + i.width) && y >= i.posY && y <= (i.posY + i.height)) {
          i.hovered = true;
          hoveredLink = true;
        } else {
          i.hovered = false;
        }
      }

      if (hoveredLink) {
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = '';
      }
    }
  }

  handleClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const prop = this.game.getValue;
    const gameStep = prop('gameStep');

    if (gameStep !== 'game') {
      for (const i of Object.values(this.uiElements)) {
        if (i.hovered) {
          i.onClick && i.onClick();
          this.uiElements = {};
          document.body.style.cursor = '';

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
    this.drawPolygon(x1-w1,    y1, x1+w1, y1, x2+w2, y2, x2-w2,    y2, color.road);
    
    if (color.lane) {
      lanew1 = w1*2/lanes;
      lanew2 = w2*2/lanes;
      lanex1 = x1 - w1 + lanew1;
      lanex2 = x2 - w2 + lanew2;
      for (lane = 1; lane < lanes; lanex1 += lanew1, lanex2 += lanew2, lane++) {
        this.drawPolygon(lanex1 - l1/2, y1, lanex1 + l1/2, y1, lanex2 + l2/2, y2, lanex2 - l2/2, y2, color.lane);
      }
    }
    
    this.drawFog(0, y1, width, y2-y1, fog);
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

  drawPlayer(width, height, resolution, roadWidth, sprites, speedPercent, scale, destX, destY, steer, updown) {
    const bounce = (1.5 * Math.random() * speedPercent * resolution) * Util.randomChoice([-1,1]);
    let sprite;

    if (steer < 0) {
      sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_LEFT : SPRITES.PLAYER_LEFT;
    } else if (steer > 0) {
      sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_RIGHT : SPRITES.PLAYER_RIGHT;
    } else {
      sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_STRAIGHT : SPRITES.PLAYER_STRAIGHT;
    }

    this.drawSprite(width, height, roadWidth, sprites, sprite, scale, destX, destY + bounce, -0.5, -1);
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
    return projectedRoadWidth/Math.max(6,  2*lanes);
  }

  laneMarkerWidth(projectedRoadWidth, lanes) {
    return projectedRoadWidth/Math.max(32, 8*lanes);
  }

  //=========================================================================
  // RENDER THE GAME WORLD
  //=========================================================================
  renderGame() {
    const props = this.game.getValue;
    const segments = props('segments');
    const segmentLength = props('segmentLength');
    const position = props('position');
    const background = props('background');
    const width = props('width');
    const height = props('height');
    const resolution = props('resolution');
    const skySpeed = props('skySpeed');
    const hillSpeed = props('hillSpeed');
    const treeSpeed = props('treeSpeed');
    const playerZ = props('playerZ');
    const skyOffset = props('skyOffset');
    const hillOffset = props('hillOffset');
    const treeOffset = props('treeOffset');

    let baseSegment   = Util.findSegment(segments, segmentLength, position);
    let basePercent   = Util.percentRemaining(position, segmentLength);
    let playerSegment = Util.findSegment(segments, segmentLength, position + playerZ);

    let playerPercent = Util.percentRemaining(position + playerZ, segmentLength);
    let playerY       = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
    let maxy          = height;
    let x  = 0;
    let dx = - (baseSegment.curve * basePercent);

    this.ctx.clearRect(0, 0, width, height);

    this.drawBackground(background, width, height, BACKGROUND.SKY,   skyOffset,  resolution * skySpeed  * playerY);
    this.drawBackground(background, width, height, BACKGROUND.HILLS, hillOffset, resolution * hillSpeed * playerY);
    this.drawBackground(background, width, height, BACKGROUND.TREES, treeOffset, resolution * treeSpeed * playerY);

    // let n, i, segment, car, sprite, spriteScale, spriteX, spriteY;

    // for (n = 0 ; n < drawDistance ; n++) {
    //   segment        = segments[(baseSegment.index + n) % segments.length];
    //   segment.looped = segment.index < baseSegment.index;
    //   segment.fog    = Util.exponentialFog(n/drawDistance, fogDensity);
    //   segment.clip   = maxy;

    //   Util.project(segment.p1, (playerX * roadWidth) - x, playerY + cameraHeight, position - (segment.looped ? trackLength : 0), cameraDepth, width, height, roadWidth);
    //   Util.project(segment.p2, (playerX * roadWidth) - x - dx, playerY + cameraHeight, position - (segment.looped ? trackLength : 0), cameraDepth, width, height, roadWidth);

    //   x  = x + dx;
    //   dx = dx + segment.curve;

    //   if ((segment.p1.camera.z <= cameraDepth)         || // behind us
    //       (segment.p2.screen.y >= segment.p1.screen.y) || // back face cull
    //       (segment.p2.screen.y >= maxy))                  // clip by (already thised) hill
    //     continue;

    //   this.drawSegment(width, lanes,
    //                  segment.p1.screen.x,
    //                  segment.p1.screen.y,
    //                  segment.p1.screen.w,
    //                  segment.p2.screen.x,
    //                  segment.p2.screen.y,
    //                  segment.p2.screen.w,
    //                  segment.fog,
    //                  segment.color);

    //   maxy = segment.p1.screen.y;
    // }

    // for (n = (drawDistance-1) ; n > 0 ; n--) {
    //   segment = segments[(baseSegment.index + n) % segments.length];

    //   for(i = 0 ; i < segment.cars.length ; i++) {
    //     car         = segment.cars[i];
    //     sprite      = car.sprite;
    //     spriteScale = Util.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent);
    //     spriteX     = Util.interpolate(segment.p1.screen.x,     segment.p2.screen.x,     car.percent) + (spriteScale * car.offset * roadWidth * width/2);
    //     spriteY     = Util.interpolate(segment.p1.screen.y,     segment.p2.screen.y,     car.percent);
    //     this.drawSprite(width, height, resolution, roadWidth, sprites, car.sprite, spriteScale, spriteX, spriteY, -0.5, -1, segment.clip);
    //   }

    //   for(i = 0 ; i < segment.sprites.length ; i++) {
    //     sprite      = segment.sprites[i];
    //     spriteScale = segment.p1.screen.scale;
    //     spriteX     = segment.p1.screen.x + (spriteScale * sprite.offset * roadWidth * width/2);
    //     spriteY     = segment.p1.screen.y;
    //     this.drawSprite(width, height, resolution, roadWidth, sprites, sprite.source, spriteScale, spriteX, spriteY, (sprite.offset < 0 ? -1 : 0), -1, segment.clip);
    //   }

    //   if (segment == playerSegment) {
    //     this.renderPlayer(ctx, width, height, resolution, roadWidth, sprites, speed/maxSpeed,
    //       cameraDepth/playerZ, width/2,
    //       (height/2) - (cameraDepth/playerZ * Util.interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * height/2),
    //       speed * (keyLeft ? -1 : keyRight ? 1 : 0),
    //       playerSegment.p2.world.y - playerSegment.p1.world.y);
    //   }
    // }
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
    const players = [{
      name: 'MACIARENKO',
      textPosition: [250, 200],
      iconPosition: [150, 180],
      event: uiEvents.driver_1
    },
    {
      name: 'APTEKARZ',
      textPosition: [250, 300],
      iconPosition: [150, 280],
      event: uiEvents.driver_2
    },
    {
      name: 'BECIA',
      textPosition: [250, 400],
      iconPosition: [150, 380],
      event: uiEvents.driver_3
    }];
    const textSize = 2;

    for (let i = 0; i < players.length; i += 1) {
      const it = i + 1;
      const player = players[i];
      const sprite = SPRITES[player.name];
      let color = 'white';

      if (this.uiElements[`player_${it}_icon`]) {
        if (this.uiElements[`player_${it}_icon`].hovered || this.uiElements[`player_${it}_text`].hovered) {
          color = 'yellow';
        }

        this.renderPlayerIcon(player, sprite);
        png_font.drawText(player.name, player.textPosition, color, 2, 'black');
      } else {
        png_font.drawText(player.name, player.textPosition, color, 2, 'black');
        const measuredText = this.ctx.measureText(player.name);

        this.uiElements[`player_${it}_text`] = {
          hovered: false,
          posX: player.textPosition[0],
          posY: player.textPosition[1],
          width: measuredText.width * textSize,
          height: 15 * textSize,
          onClick: uiEvents[`driver_${it}`],
        }

        this.uiElements[`player_${it}_icon`] = {
          hovered: false,
          posX: player.iconPosition[0],
          posY: player.iconPosition[1],
          width: 80,
          height: 80,
          onClick: uiEvents[`driver_${it}`],
        }
      }
    }

    png_font.drawText('SELECT YOUR DRIVER', [170, 110], 'black', 2, 'white');
  }

  renderIntro(uiEvents) {
    const text = 'START GAME';
    const textPosition = [250, 300];
    const textSize = 2;
    let color = 'white';

    if (this.uiElements.start_game_text) {
      if (this.uiElements.start_game_text.hovered) {
        color = 'yellow';
      }
      png_font.drawText(text, textPosition, color, 2, 'black');
    } else {
      png_font.drawText(text, textPosition, color, 2, 'black');
      const measuredText = this.ctx.measureText(text);

      this.uiElements.start_game_text = {
        hovered: false,
        posX: textPosition[0],
        posY: textPosition[1],
        width: measuredText.width * textSize,
        height: 15 * textSize,
        onClick: uiEvents.start_game_text,
      }
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

  render(uiEvents) {
    const prop = this.game.getValue;
    this.ctx.clearRect(0, 0, prop('width'), prop('height'));

    if (prop('gameStep') !== 'game') {
      this.renderScreens(uiEvents);
    } else {
      this.renderGame();
    }
  }
}
