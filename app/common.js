import Render from 'render';
import Game from 'game';
import * as Util from 'util';
import Dom from 'dom';
import { KEY, COLORS, BACKGROUND, SPRITES, GAME_SETTINGS } from 'constants';

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

const canvas = Dom.get('canvas');
const ctx = canvas.getContext('2d'); // ...and its drawing context

let skyOffset      = 0;                       // current sky scroll offset
let hillOffset     = 0;                       // current hill scroll offset
let treeOffset     = 0;                       // current tree scroll offset
let segments       = [];                      // array of road segments
let cars           = [];                      // array of cars on the road
let gameState      = 'intro';
let background     = null;                    // our background image (loaded below)
let sprites        = null;                    // our spritesheet (loaded below)
let resolution     = null;                    // scaling factor to provide resolution independence (computed)
let trackLength    = null;                    // z length of entire track (computed)
let cameraDepth    = null;                    // z distance camera is from screen (computed)
let playerX        = 0;                       // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
let playerZ        = null;                    // player relative z distance from camera (computed)
let position       = 0;                       // current camera Z position (add playerZ to get player's absolute Z position)
let speed          = 0;                       // current speed
let currentLapTime = 0;                       // current lap time
let lastLapTime    = null;                    // last lap time
const hud = {
  speed:            { value: null, dom: Dom.get('speed_value')            },
  current_lap_time: { value: null, dom: Dom.get('current_lap_time_value') },
  // last_lap_time:    { value: null, dom: Dom.get('last_lap_time_value')    },
  // fast_lap_time:    { value: null, dom: Dom.get('fast_lap_time_value')    }
}

//=========================================================================
// THE GAME LOOP
//=========================================================================
const reset = function({ ...options }) {
  // console.log('options: ', options);
  // options       = options || {};
  options.canvas.width  = options.width;//  = Util.toInt(canvas.width, width);
  options.canvas.height = options.height;// = Util.toInt(canvas.height, height);
  // lanes                  = Util.toInt(lanes,lanes);
  // roadWidth              = Util.toInt(roadWidth, roadWidth);
  // cameraHeight           = Util.toInt(cameraHeight, cameraHeight);
  // drawDistance           = Util.toInt(drawDistance, drawDistance);
  // fogDensity             = Util.toInt(fogDensity, fogDensity);
  // fieldOfView            = Util.toInt(fieldOfView, fieldOfView);
  // segmentLength          = Util.toInt(segmentLength, segmentLength);
  // rumbleLength           = Util.toInt(rumbleLength, rumbleLength);
  options.cameraDepth            = 1 / Math.tan((options.fieldOfView/2) * Math.PI/180);
  options.playerZ                = (options.cameraHeight * options.cameraDepth);
  options.resolution             = options.height/480;
  // refreshTweakUI();

  if (options.gameState === 'game' && (options.segments.length==0) ||
    (options.segmentLength) || (options.rumbleLength)) {
    resetRoad();
  }
};

const newGame = new Game({
  ...GAME_SETTINGS,
  segments,
  canvas,
  render,
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
    reset({ ...GAME_SETTINGS, canvas, segments });
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
