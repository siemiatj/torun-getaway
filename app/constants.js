import SPRITES from '../static/images/spritesheet'

//=============================================================================
// RACING GAME CONSTANTS
//=============================================================================

const GAME_SETTINGS = {
  GAME_STATES: ['intro', 'players', 'start', 'game'],
  fps: 60,                      // how many 'update' frames per second
  step: 1/60,                   // how long is each frame (in seconds)
  width: 640,                    // logical canvas width
  height: 480,                     // logical canvas height
  centrifugal: 0.3,                     // centrifugal force multiplier when going around curves
  skySpeed: 0.001,                   // background sky layer scroll speed when going around curve (or up hill)
  hillSpeed: 0.002,                   // background hill layer scroll speed when going around curve (or up hill)
  treeSpeed: 0.003,                   // background tree layer scroll speed when going around curve (or up hill)
  roadWidth   : 2000,                    // actually half the roads width, easier math if the road spans from -roadWidth to +roadWidth
  segmentLength: 200,                     // length of a single segment
  rumbleLength: 3,                       // number of segments per red/white rumble strip
  drawDistance: 150,                     // number of segments to draw
  lanes       : 3,                       // number of lanes
  fieldOfView : 100,                     // angle (degrees) for field of view
  cameraHeight: 1000,                    // z height of camera
  fogDensity  : 4,                       // exponential fog density
  maxSpeed    : null,      // top speed (ensure we can't move more than 1 segment in a single frame to make collision detection easier)
  accel       : null,            // acceleration rate - tuned until it 'felt' right
  breaking    : null,               // deceleration rate when braking
  decel       : null,            // 'natural' deceleration rate when neither accelerating, nor braking
  offRoadDecel: null,             // off road deceleration is somewhere in between
  offRoadLimit:  null,             // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)
  totalCars: 200,                     // total number of cars on the road
};

GAME_SETTINGS.maxSpeed = (GAME_SETTINGS.segmentLength / GAME_SETTINGS.step) * 1.5;
GAME_SETTINGS.accel = GAME_SETTINGS.maxSpeed/5;
GAME_SETTINGS.accel = GAME_SETTINGS.maxSpeed/5;
GAME_SETTINGS.breaking = -GAME_SETTINGS.maxSpeed;
GAME_SETTINGS.decel = -GAME_SETTINGS.maxSpeed/5;
GAME_SETTINGS.offRoadDecel = -GAME_SETTINGS.maxSpeed/2;
GAME_SETTINGS.offRoadLimit =  GAME_SETTINGS.maxSpeed/4;

const ROAD = {
  LENGTH: { NONE: 0, SHORT:  25, MEDIUM:   50, LONG:  100 },
  HILL:   { NONE: 0, LOW:    20, MEDIUM:   40, HIGH:   60 },
  CURVE:  { NONE: 0, EASY:    2, MEDIUM:    4, HARD:    6 }
};

const KEY = {
  LEFT:  37,
  UP:    38,
  RIGHT: 39,
  DOWN:  40,
  A:     65,
  D:     68,
  S:     83,
  W:     87
};

const COLORS = {
  SKY:  '#72D7EE',
  TREE: '#005108',
  FOG:  '#005108',
  OVERLAY: '#343D54',
  LIGHT:  { road: '#6B6B6B', grass: '#10AA10', rumble: '#555555', lane: '#CCCCCC'  },
  DARK:   { road: '#696969', grass: '#009A00', rumble: '#BBBBBB'                   },
  START:  { road: 'white',   grass: 'white',   rumble: 'white'                     },
  FINISH: { road: 'black',   grass: 'black',   rumble: 'black'                     }
};

const BACKGROUND = {
  HILLS: { x:   5, y:   5, w: 1280, h: 480 },
  SKY:   { x:   5, y: 495, w: 1280, h: 480 },
  TREES: { x:   5, y: 985, w: 1280, h: 480 },
  MENU:  { x:   0, y:   0, w: 1280, h: 480 },
  TITLE: { x:   0, y:   0, w: 870,  h: 52 },
};

// const SPRITES = {
//   SEMI: { x: 0, y: 0, w: 122, h: 144 },
//   TRUCK: { x: 122, y:  0, w: 100, h: 78 },
//   BECIA: { x: 222, y:  0, w: 80, h: 80 },
//   APTEKARZ: { x: 0, y: 144, w: 80, h: 80 },
//   MACIARENKO: { x: 80, y: 144, w: 80, h: 80 },
//   CAR03: { x: 122, y: 78, w: 88, h: 55 },
//   CAR02: { x: 222, y: 80, w: 80, h: 59 },
//   CAR04: { x: 160, y: 144, w: 80, h: 57 },
//   CAR01: { x: 0, y: 224, w: 80, h: 56 },
//   PLAYER_UPHILL_LEFT: { x: 80, y: 224, w: 80, h: 45 },
//   PLAYER_UPHILL_RIGHT: { x: 160, y: 224, w: 80, h: 45 },
//   PLAYER_UPHILL_STRAIGHT: { x: 302, y: 0, w: 80, h: 45 },
//   PLAYER_RIGHT: { x: 302, y: 45, w: 80, h: 41 },
//   PLAYER_STRAIGHT: { x: 302, y: 86, w: 80, h: 41 },
//   PLAYER_LEFT: { x: 302, y: 127, w: 80, h: 41 },
// };

SPRITES.SCALE = 0.3 * (1/SPRITES.PLAYER_STRAIGHT.w) // the reference sprite width should be 1/3rd the (half-)roadWidth
SPRITES.BILLBOARDS = [SPRITES.BILLBOARD01, SPRITES.BILLBOARD02, SPRITES.BILLBOARD03, SPRITES.BILLBOARD04, SPRITES.BILLBOARD05, SPRITES.BILLBOARD06, SPRITES.BILLBOARD07, SPRITES.BILLBOARD08, SPRITES.BILLBOARD09];
SPRITES.PLANTS     = [SPRITES.TREE1, SPRITES.TREE2, SPRITES.DEAD_TREE1, SPRITES.DEAD_TREE2, SPRITES.PALM_TREE, SPRITES.BUSH1, SPRITES.BUSH2, SPRITES.CACTUS, SPRITES.STUMP, SPRITES.BOULDER1, SPRITES.BOULDER2, SPRITES.BOULDER3];
SPRITES.CARS       = [SPRITES.CAR01, SPRITES.CAR02, SPRITES.CAR03, SPRITES.CAR04, SPRITES.SEMI, SPRITES.TRUCK];

export { KEY, COLORS, BACKGROUND, SPRITES, GAME_SETTINGS, ROAD };
