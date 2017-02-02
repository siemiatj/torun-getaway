import Render from 'render';
import Game from 'game';
import * as Util from 'util';
import Dom from 'dom';
import { KEY, COLORS, BACKGROUND, SPRITES } from 'constants';

//=========================================================================
// POLYFILL for requestAnimationFrame
//=========================================================================

if (!window.requestAnimationFrame) { // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  window.requestAnimationFrame = window.webkitRequestAnimationFrame || 
                                 window.mozRequestAnimationFrame    || 
                                 window.oRequestAnimationFrame      || 
                                 window.msRequestAnimationFrame     || 
                                 function(callback, element) {
                                   window.setTimeout(callback, 1000 / 60);
                                 }
}


//=========================================================================

var fps            = 60;                      // how many 'update' frames per second
var step           = 1/fps;                   // how long is each frame (in seconds)
var width          = 1024;                    // logical canvas width
var height         = 768;                     // logical canvas height
var centrifugal    = 0.3;                     // centrifugal force multiplier when going around curves
// var offRoadDecel   = 0.99;                    // speed multiplier when off road (e.g. you lose 2% speed each update frame)
var skySpeed       = 0.001;                   // background sky layer scroll speed when going around curve (or up hill)
var hillSpeed      = 0.002;                   // background hill layer scroll speed when going around curve (or up hill)
var treeSpeed      = 0.003;                   // background tree layer scroll speed when going around curve (or up hill)
var skyOffset      = 0;                       // current sky scroll offset
var hillOffset     = 0;                       // current hill scroll offset
var treeOffset     = 0;                       // current tree scroll offset
var segments       = [];                      // array of road segments
var cars           = [];                      // array of cars on the road
// var stats          = Game.stats('fps');       // mr.doobs FPS counter
var canvas         = Dom.get('canvas');       // our canvas...
var ctx            = canvas.getContext('2d'); // ...and its drawing context
var GAME_STATES    = ['intro', 'players', 'start', 'game', 'gameover'];
var gameState      = 'intro';
var background     = null;                    // our background image (loaded below)
var sprites        = null;                    // our spritesheet (loaded below)
var resolution     = null;                    // scaling factor to provide resolution independence (computed)
var roadWidth      = 2000;                    // actually half the roads width, easier math if the road spans from -roadWidth to +roadWidth
var segmentLength  = 200;                     // length of a single segment
var rumbleLength   = 3;                       // number of segments per red/white rumble strip
var trackLength    = null;                    // z length of entire track (computed)
var lanes          = 3;                       // number of lanes
var fieldOfView    = 100;                     // angle (degrees) for field of view
var cameraHeight   = 1000;                    // z height of camera
var cameraDepth    = null;                    // z distance camera is from screen (computed)
var drawDistance   = 150;                     // number of segments to draw
var playerX        = 0;                       // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
var playerZ        = null;                    // player relative z distance from camera (computed)
var fogDensity     = 4;                       // exponential fog density
var position       = 0;                       // current camera Z position (add playerZ to get player's absolute Z position)
var maxSpeed       = (segmentLength/step) * 1.5;      // top speed (ensure we can't move more than 1 segment in a single frame to make collision detection easier)
var speed          = 0;                       // current speed
var accel          = maxSpeed/5;             // acceleration rate - tuned until it 'felt' right
var breaking       = -maxSpeed;               // deceleration rate when braking
var decel          = -maxSpeed/5;             // 'natural' deceleration rate when neither accelerating, nor braking
var offRoadDecel   = -maxSpeed/2;             // off road deceleration is somewhere in between
var offRoadLimit   =  maxSpeed/4;             // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)
var totalCars      = 200;                     // total number of cars on the road
var currentLapTime = 0;                       // current lap time
var lastLapTime    = null;                    // last lap time

var keyLeft        = false;
var keyRight       = false;
var keyFaster      = false;
var keySlower      = false;

var hud = {
  speed:            { value: null, dom: Dom.get('speed_value')            },
  current_lap_time: { value: null, dom: Dom.get('current_lap_time_value') },
  // last_lap_time:    { value: null, dom: Dom.get('last_lap_time_value')    },
  // fast_lap_time:    { value: null, dom: Dom.get('fast_lap_time_value')    }
}

//=========================================================================
// RENDER THE GAME WORLD
//=========================================================================

function render() {
  let baseSegment   = Util.findSegment(segments, position);
  let basePercent   = Util.percentRemaining(position, segmentLength);
  let playerSegment = Util.findSegment(segments, position+playerZ);
  let playerPercent = Util.percentRemaining(position+playerZ, segmentLength);
  let playerY       = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
  let maxy          = height;
  let x  = 0;
  let dx = - (baseSegment.curve * basePercent);

  ctx.clearRect(0, 0, width, height);

  if (gameState === 'intro') {
    Render.background(ctx, background, 640, 480);
  } else {
    Render.background(ctx, background, width, height, BACKGROUND.SKY,   skyOffset,  resolution * skySpeed  * playerY);
    Render.background(ctx, background, width, height, BACKGROUND.HILLS, hillOffset, resolution * hillSpeed * playerY);
    Render.background(ctx, background, width, height, BACKGROUND.TREES, treeOffset, resolution * treeSpeed * playerY);

    let n, i, segment, car, sprite, spriteScale, spriteX, spriteY;

    for (n = 0 ; n < drawDistance ; n++) {
      segment        = segments[(baseSegment.index + n) % segments.length];
      segment.looped = segment.index < baseSegment.index;
      segment.fog    = Util.exponentialFog(n/drawDistance, fogDensity);
      segment.clip   = maxy;

      Util.project(segment.p1, (playerX * roadWidth) - x,      playerY + cameraHeight, position - (segment.looped ? trackLength : 0), cameraDepth, width, height, roadWidth);
      Util.project(segment.p2, (playerX * roadWidth) - x - dx, playerY + cameraHeight, position - (segment.looped ? trackLength : 0), cameraDepth, width, height, roadWidth);

      x  = x + dx;
      dx = dx + segment.curve;

      if ((segment.p1.camera.z <= cameraDepth)         || // behind us
          (segment.p2.screen.y >= segment.p1.screen.y) || // back face cull
          (segment.p2.screen.y >= maxy))                  // clip by (already rendered) hill
        continue;

      Render.segment(ctx, width, lanes,
                     segment.p1.screen.x,
                     segment.p1.screen.y,
                     segment.p1.screen.w,
                     segment.p2.screen.x,
                     segment.p2.screen.y,
                     segment.p2.screen.w,
                     segment.fog,
                     segment.color);

      maxy = segment.p1.screen.y;
    }

    for (n = (drawDistance-1) ; n > 0 ; n--) {
      segment = segments[(baseSegment.index + n) % segments.length];

      for(i = 0 ; i < segment.cars.length ; i++) {
        car         = segment.cars[i];
        sprite      = car.sprite;
        spriteScale = Util.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent);
        spriteX     = Util.interpolate(segment.p1.screen.x,     segment.p2.screen.x,     car.percent) + (spriteScale * car.offset * roadWidth * width/2);
        spriteY     = Util.interpolate(segment.p1.screen.y,     segment.p2.screen.y,     car.percent);
        Render.sprite(ctx, width, height, resolution, roadWidth, sprites, car.sprite, spriteScale, spriteX, spriteY, -0.5, -1, segment.clip);
      }

      for(i = 0 ; i < segment.sprites.length ; i++) {
        sprite      = segment.sprites[i];
        spriteScale = segment.p1.screen.scale;
        spriteX     = segment.p1.screen.x + (spriteScale * sprite.offset * roadWidth * width/2);
        spriteY     = segment.p1.screen.y;
        Render.sprite(ctx, width, height, resolution, roadWidth, sprites, sprite.source, spriteScale, spriteX, spriteY, (sprite.offset < 0 ? -1 : 0), -1, segment.clip);
      }

      if (segment == playerSegment) {
        Render.player(ctx, width, height, resolution, roadWidth, sprites, speed/maxSpeed,
          cameraDepth/playerZ, width/2,
          (height/2) - (cameraDepth/playerZ * Util.interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * height/2),
          speed * (keyLeft ? -1 : keyRight ? 1 : 0),
          playerSegment.p2.world.y - playerSegment.p1.world.y);
      }
    }
  }
}

//=========================================================================
// BUILD ROAD GEOMETRY
//=========================================================================

function lastY() { return (segments.length == 0) ? 0 : segments[segments.length-1].p2.world.y; }

function addSegment(curve, y) {
  var n = segments.length;
  segments.push({
      index: n,
         p1: { world: { y: lastY(), z:  n   *segmentLength }, camera: {}, screen: {} },
         p2: { world: { y: y,       z: (n+1)*segmentLength }, camera: {}, screen: {} },
      curve: curve,
    sprites: [],
       cars: [],
      color: Math.floor(n/rumbleLength)%2 ? COLORS.DARK : COLORS.LIGHT
  });
}

function addSprite(n, sprite, offset) {
  segments[n].sprites.push({ source: sprite, offset: offset });
}

function addRoad(enter, hold, leave, curve, y) {
  var startY   = lastY();
  var endY     = startY + (Util.toInt(y, 0) * segmentLength);
  var n, total = enter + hold + leave;
  for(n = 0 ; n < enter ; n++)
    addSegment(Util.easeIn(0, curve, n/enter), Util.easeInOut(startY, endY, n/total));
  for(n = 0 ; n < hold  ; n++)
    addSegment(curve, Util.easeInOut(startY, endY, (enter+n)/total));
  for(n = 0 ; n < leave ; n++)
    addSegment(Util.easeInOut(curve, 0, n/leave), Util.easeInOut(startY, endY, (enter+hold+n)/total));
}

var ROAD = {
  LENGTH: { NONE: 0, SHORT:  25, MEDIUM:   50, LONG:  100 },
  HILL:   { NONE: 0, LOW:    20, MEDIUM:   40, HIGH:   60 },
  CURVE:  { NONE: 0, EASY:    2, MEDIUM:    4, HARD:    6 }
};

function addStraight(num) {
  num = num || ROAD.LENGTH.MEDIUM;
  addRoad(num, num, num, 0, 0);
}

function addHill(num, height) {
  num    = num    || ROAD.LENGTH.MEDIUM;
  height = height || ROAD.HILL.MEDIUM;
  addRoad(num, num, num, 0, height);
}

function addCurve(num, curve, height) {
  num    = num    || ROAD.LENGTH.MEDIUM;
  curve  = curve  || ROAD.CURVE.MEDIUM;
  height = height || ROAD.HILL.NONE;
  addRoad(num, num, num, curve, height);
}
    
function addLowRollingHills(num, height) {
  num    = num    || ROAD.LENGTH.SHORT;
  height = height || ROAD.HILL.LOW;
  addRoad(num, num, num,  0,                height/2);
  addRoad(num, num, num,  0,               -height);
  addRoad(num, num, num,  ROAD.CURVE.EASY,  height);
  addRoad(num, num, num,  0,                0);
  addRoad(num, num, num, -ROAD.CURVE.EASY,  height/2);
  addRoad(num, num, num,  0,                0);
}

function addSCurves() {
  addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.NONE);
  addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.MEDIUM,  ROAD.HILL.MEDIUM);
  addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.EASY,   -ROAD.HILL.LOW);
  addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.MEDIUM);
  addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.MEDIUM, -ROAD.HILL.MEDIUM);
}

function addBumps() {
  addRoad(10, 10, 10, 0,  5);
  addRoad(10, 10, 10, 0, -2);
  addRoad(10, 10, 10, 0, -5);
  addRoad(10, 10, 10, 0,  8);
  addRoad(10, 10, 10, 0,  5);
  addRoad(10, 10, 10, 0, -7);
  addRoad(10, 10, 10, 0,  5);
  addRoad(10, 10, 10, 0, -2);
}

function addDownhillToEnd(num) {
  num = num || 200;
  addRoad(num, num, num, -ROAD.CURVE.EASY, -lastY()/segmentLength);
}

function resetRoad() {
  segments = [];

  addStraight(ROAD.LENGTH.SHORT);
  addLowRollingHills();
  addSCurves();
  addCurve(ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.LOW);
  addBumps();
  addLowRollingHills();
  addCurve(ROAD.LENGTH.LONG*2, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
  addStraight();
  addHill(ROAD.LENGTH.MEDIUM, ROAD.HILL.HIGH);
  addSCurves();
  addCurve(ROAD.LENGTH.LONG, -ROAD.CURVE.MEDIUM, ROAD.HILL.NONE);
  addHill(ROAD.LENGTH.LONG, ROAD.HILL.HIGH);
  addCurve(ROAD.LENGTH.LONG, ROAD.CURVE.MEDIUM, -ROAD.HILL.LOW);
  addBumps();
  addHill(ROAD.LENGTH.LONG, -ROAD.HILL.MEDIUM);
  addStraight();
  addSCurves();
  addDownhillToEnd();

  resetSprites();
  resetCars();

  segments[Util.findSegment(segments, playerZ).index + 2].color = COLORS.START;
  segments[Util.findSegment(segments, playerZ).index + 3].color = COLORS.START;
  for(var n = 0 ; n < rumbleLength ; n++)
    segments[segments.length-1-n].color = COLORS.FINISH;

  trackLength = segments.length * segmentLength;
}

function resetSprites() {
  var n, i;

  // addSprite(20,  SPRITES.BILLBOARD07, -1);
  // addSprite(40,  SPRITES.BILLBOARD06, -1);
  // addSprite(60,  SPRITES.BILLBOARD08, -1);
  // addSprite(80,  SPRITES.BILLBOARD09, -1);
  // addSprite(100, SPRITES.BILLBOARD01, -1);
  // addSprite(120, SPRITES.BILLBOARD02, -1);
  // addSprite(140, SPRITES.BILLBOARD03, -1);
  // addSprite(160, SPRITES.BILLBOARD04, -1);
  // addSprite(180, SPRITES.BILLBOARD05, -1);

  // addSprite(240,                  SPRITES.BILLBOARD07, -1.2);
  // addSprite(240,                  SPRITES.BILLBOARD06,  1.2);
  // addSprite(segments.length - 25, SPRITES.BILLBOARD07, -1.2);
  // addSprite(segments.length - 25, SPRITES.BILLBOARD06,  1.2);

  // for(n = 10 ; n < 200 ; n += 4 + Math.floor(n/100)) {
  //   addSprite(n, SPRITES.PALM_TREE, 0.5 + Math.random()*0.5);
  //   addSprite(n, SPRITES.PALM_TREE,   1 + Math.random()*2);
  // }

  // for(n = 250 ; n < 1000 ; n += 5) {
  //   addSprite(n,     SPRITES.COLUMN, 1.1);
  //   addSprite(n + Util.randomInt(0,5), SPRITES.TREE1, -1 - (Math.random() * 2));
  //   addSprite(n + Util.randomInt(0,5), SPRITES.TREE2, -1 - (Math.random() * 2));
  // }

  // for(n = 200 ; n < segments.length ; n += 3) {
  //   addSprite(n, Util.randomChoice(SPRITES.PLANTS), Util.randomChoice([1,-1]) * (2 + Math.random() * 5));
  // }

  // var side, sprite, offset;
  // for(n = 1000 ; n < (segments.length-50) ; n += 100) {
  //   side      = Util.randomChoice([1, -1]);
  //   addSprite(n + Util.randomInt(0, 50), Util.randomChoice(SPRITES.BILLBOARDS), -side);
  //   for(i = 0 ; i < 20 ; i++) {
  //     sprite = Util.randomChoice(SPRITES.PLANTS);
  //     offset = side * (1.5 + Math.random());
  //     addSprite(n + Util.randomInt(0, 50), sprite, offset);
  //   }
      
  // }

}

function resetCars() {
  cars = [];
  var n, car, segment, offset, z, sprite, speed;
  for (var n = 0 ; n < totalCars ; n++) {
    offset = Math.random() * Util.randomChoice([-0.8, 0.8]);
    z      = Math.floor(Math.random() * segments.length) * segmentLength;
    sprite = Util.randomChoice(SPRITES.CARS);
    speed  = maxSpeed/4 + Math.random() * maxSpeed/(sprite == SPRITES.SEMI ? 4 : 2);
    car = { offset: offset, z: z, sprite: sprite, speed: speed };
    segment = Util.findSegment(segments, car.z);
    segment.cars.push(car);
    cars.push(car);
  }
}

//=========================================================================
// THE GAME LOOP
//=========================================================================
const reset = function(options) {
  options       = options || {};
  canvas.width  = width  = Util.toInt(options.width,          width);
  canvas.height = height = Util.toInt(options.height,         height);
  lanes                  = Util.toInt(options.lanes,          lanes);
  roadWidth              = Util.toInt(options.roadWidth,      roadWidth);
  cameraHeight           = Util.toInt(options.cameraHeight,   cameraHeight);
  drawDistance           = Util.toInt(options.drawDistance,   drawDistance);
  fogDensity             = Util.toInt(options.fogDensity,     fogDensity);
  fieldOfView            = Util.toInt(options.fieldOfView,    fieldOfView);
  segmentLength          = Util.toInt(options.segmentLength,  segmentLength);
  rumbleLength           = Util.toInt(options.rumbleLength,   rumbleLength);
  cameraDepth            = 1 / Math.tan((fieldOfView/2) * Math.PI/180);
  playerZ                = (cameraHeight * cameraDepth);
  resolution             = height/480;
  // refreshTweakUI();

  if (gameState === 'game' && (segments.length==0) || (options.segmentLength) || (options.rumbleLength))
    resetRoad();
};

let newGame = new Game({ segments, canvas, render, step,
  gameStep: 'intro',
  images: ["intro", "background", "sprites"],
  keys: [
    { keys: [KEY.LEFT,  KEY.A], mode: 'down', action: function() { keyLeft   = true;  } },
    { keys: [KEY.RIGHT, KEY.D], mode: 'down', action: function() { keyRight  = true;  } },
    { keys: [KEY.UP,    KEY.W], mode: 'down', action: function() { keyFaster = true;  } },
    { keys: [KEY.DOWN,  KEY.S], mode: 'down', action: function() { keySlower = true;  } },
    { keys: [KEY.LEFT,  KEY.A], mode: 'up',   action: function() { keyLeft   = false; } },
    { keys: [KEY.RIGHT, KEY.D], mode: 'up',   action: function() { keyRight  = false; } },
    { keys: [KEY.UP,    KEY.W], mode: 'up',   action: function() { keyFaster = false; } },
    { keys: [KEY.DOWN,  KEY.S], mode: 'up',   action: function() { keySlower = false; } }
  ],
  ready: function(images) {
    if (gameState === 'intro' || gameState === 'select_player') {
      background = images[0];
    } else {
      background = images[1];
      sprites    = images[2];
    }
    reset();
  }
});

newGame.run();

//=========================================================================
// TWEAK UI HANDLERS
//=========================================================================

// Dom.on('resolution', 'change', function(ev) {
//   var w, h, ratio;
//   switch(ev.target.options[ev.target.selectedIndex].value) {
//     case 'fine':   w = 1280; h = 960;  ratio=w/width; break;
//     case 'high':   w = 1024; h = 768;  ratio=w/width; break;
//     case 'medium': w = 640;  h = 480;  ratio=w/width; break;
//     case 'low':    w = 480;  h = 360;  ratio=w/width; break;
//   }
//   reset({ width: w, height: h })
//   Dom.blur(ev);
// });

// Dom.on('lanes',          'change', function(ev) { Dom.blur(ev); reset({ lanes:         ev.target.options[ev.target.selectedIndex].value }); });
// Dom.on('roadWidth',      'change', function(ev) { Dom.blur(ev); reset({ roadWidth:     Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max'))) }); });
// Dom.on('cameraHeight',   'change', function(ev) { Dom.blur(ev); reset({ cameraHeight:  Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max'))) }); });
// Dom.on('drawDistance',   'change', function(ev) { Dom.blur(ev); reset({ drawDistance:  Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max'))) }); });
// Dom.on('fieldOfView',    'change', function(ev) { Dom.blur(ev); reset({ fieldOfView:   Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max'))) }); });
// Dom.on('fogDensity',     'change', function(ev) { Dom.blur(ev); reset({ fogDensity:    Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max'))) }); });

// function refreshTweakUI() {
//   Dom.get('lanes').selectedIndex = lanes-1;
//   Dom.get('currentRoadWidth').innerHTML      = Dom.get('roadWidth').value      = roadWidth;
//   Dom.get('currentCameraHeight').innerHTML   = Dom.get('cameraHeight').value   = cameraHeight;
//   Dom.get('currentDrawDistance').innerHTML   = Dom.get('drawDistance').value   = drawDistance;
//   Dom.get('currentFieldOfView').innerHTML    = Dom.get('fieldOfView').value    = fieldOfView;
//   Dom.get('currentFogDensity').innerHTML     = Dom.get('fogDensity').value     = fogDensity;
// }
