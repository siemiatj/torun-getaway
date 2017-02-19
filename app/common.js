import 'babel-polyfill';
import Game from 'game';
import Dom from 'dom';
import Listener from 'orientation-listener';
import { GAME_SETTINGS } from 'constants';

//=========================================================================
// POLYFILL for requestAnimationFrame
//=========================================================================

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = window.webkitRequestAnimationFrame || 
                                 window.mozRequestAnimationFrame    || 
                                 window.oRequestAnimationFrame      || 
                                 window.msRequestAnimationFrame     || 
                                 function(callback) {
                                   window.setTimeout(callback, 1000 / 60);
                                 }
}

// Fuck you Apple
document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});
//=========================================================================

const canvas = Dom.get('canvas');
const leftTouch = Dom.get('left-touch');
const rightTouch = Dom.get('right-touch');
const hud = {
  speed:            { value: null, dom: Dom.get('speed_value')            },
  current_lap_time: { value: null, dom: Dom.get('current_lap_time_value') },
  // last_lap_time:    { value: null, dom: Dom.get('last_lap_time_value')    },
  // fast_lap_time:    { value: null, dom: Dom.get('fast_lap_time_value')    }
}
const orientationListener = Listener;


//=========================================================================
// THE GAME LOOP
//=========================================================================

const newGame = new Game({
  ...GAME_SETTINGS,
  // canvases: {
  //   game: canvas,
  //   left: leftTouch,
  //   right: rightTouch,
  // },
  canvas,
  leftTouch,
  rightTouch,
  orientationListener, 
  hud,
  gameStep: 'intro',
  gameRunning: false,
  gameOver: false,
  player: facebookUser,
  images: ['intro', 'title', 'background', 'sprites', 'unifont'],
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

// function refreshTweakUI() {
//   Dom.get('lanes').selectedIndex = lanes-1;
// }
