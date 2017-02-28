import 'babel-polyfill';
import Game from 'game';
import Dom from 'dom';
// import Listener from 'orientation-listener';
import GN, { GyroNorm } from 'gyronorm';
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
}
// const orientationListener = Listener;
// console.log('GYRONORM ?: ', GN, GyroNorm, new GN());
const orientationListener = new GN();


//=========================================================================
// THE GAME LOOP
//=========================================================================

const newGame = new Game({
  ...GAME_SETTINGS,
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
