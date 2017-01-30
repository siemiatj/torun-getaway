//=========================================================================
// general purpose helpers (mostly math)
//=========================================================================

const timestamp = function() { return new Date().getTime(); };
const toInt = function(obj, def) { 
  if (obj !== null) { let x = parseInt(obj, 10);
  if (!isNaN(x)) return x; } return toInt(def, 0);
};
const toFloat = function(obj, def) {
  if (obj !== null) { let x = parseFloat(obj);
  if (!isNaN(x)) return x; }
  return toFloat(def, 0.0);
};
const limit = function(value, min, max) { return Math.max(min, Math.min(value, max)); };
const randomInt = function(min, max) { return Math.round(interpolate(min, max, Math.random())); };
const randomChoice = function(options) { return options[randomInt(0, options.length-1)]; };
const percentRemaining = function(n, total) { return (n%total)/total; };
const accelerate = function(v, accel, dt) { return v + (accel * dt);                                        };
const interpolate = function(a,b,percent) { return a + (b-a)*percent                                        };
const easeIn = function(a,b,percent) { return a + (b-a)*Math.pow(percent,2);                           };
const easeOut = function(a,b,percent) { return a + (b-a)*(1-Math.pow(1-percent,2));                     };
const easeInOut = function(a,b,percent) { return a + (b-a)*((-Math.cos(percent*Math.PI)/2) + 0.5);        };
const exponentialFog = function(distance, density) { return 1 / (Math.pow(Math.E, (distance * distance * density))); };

const increase = function(start, increment, max) { // with looping
  let result = start + increment;
  while (result >= max)
    result -= max;
  while (result < 0)
    result += max;
  return result;
};

const project = function(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) {
  p.camera.x     = (p.world.x || 0) - cameraX;
  p.camera.y     = (p.world.y || 0) - cameraY;
  p.camera.z     = (p.world.z || 0) - cameraZ;
  p.screen.scale = cameraDepth/p.camera.z;
  p.screen.x     = Math.round((width/2)  + (p.screen.scale * p.camera.x  * width/2));
  p.screen.y     = Math.round((height/2) - (p.screen.scale * p.camera.y  * height/2));
  p.screen.w     = Math.round(             (p.screen.scale * roadWidth   * width/2));
};

const overlap = function(x1, w1, x2, w2, percent) {
  let half = (percent || 1)/2;
  let min1 = x1 - (w1*half);
  let max1 = x1 + (w1*half);
  let min2 = x2 - (w2*half);
  let max2 = x2 + (w2*half);
  return ! ((max1 < min2) || (min1 > max2));
};

export { timestamp, toInt, toFloat, limit, randomInt, randomChoice,
  percentRemaining, accelerate, interpolate, easeIn, easeOut, easeInOut,
  exponentialFog, increase, project, overlap };
