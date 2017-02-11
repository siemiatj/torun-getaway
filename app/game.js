import Dom from 'dom';
import Renderer from 'render';
import Resetter from 'reset';
import _set from 'lodash.set';
import _get from 'lodash.get';
import { timestamp, findSegment } from 'util';
import { KEY, SPRITES } from 'constants';

export default class Game {
  constructor(opts) {
    this.internals = {
      ...opts,
      skyOffset: 0, // current sky scroll offset
      hillOffset: 0, // current hill scroll offset
      treeOffset: 0, // current tree scroll offset
      segments: [], // array of road segments
      cars: [], // array of cars on the road
      assets: {},
      // background: null, // our background image (loaded below)
      // sprites: null, // our spritesheet (loaded below)
      resolution: null, // scaling factor to provide resolution independence (computed)
      trackLength: null,  // z length of entire track (computed)
      cameraDepth: null, // z distance camera is from screen (computed)
      playerX: 0, // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
      playerZ: null, // player relative z distance from camera (computed)
      position: 0, // current camera Z position (add playerZ to get player's absolute Z position)
      speed: 0, // current speed
      currentLapTime: 0, // current lap time
      lastLapTime: null, // last lap time
    };

    this.keys = [
      { keys: [KEY.LEFT,  KEY.A], mode: 'down', action: () => { this.keyLeft   = true;  } },
      { keys: [KEY.RIGHT, KEY.D], mode: 'down', action: () => { this.keyRight  = true;  } },
      { keys: [KEY.UP,    KEY.W], mode: 'down', action: () => { this.keyFaster = true;  } },
      { keys: [KEY.DOWN,  KEY.S], mode: 'down', action: () => { this.keySlower = true;  } },
      { keys: [KEY.LEFT,  KEY.A], mode: 'up',   action: () => { this.keyLeft   = false; } },
      { keys: [KEY.RIGHT, KEY.D], mode: 'up',   action: () => { this.keyRight  = false; } },
      { keys: [KEY.UP,    KEY.W], mode: 'up',   action: () => { this.keyFaster = false; } },
      { keys: [KEY.DOWN,  KEY.S], mode: 'up',   action: () => { this.keySlower = false; } }
    ];

    this.renderer = new Renderer(this, this.internals.canvas.getContext('2d'));
    this.resetter = new Resetter(this);

    this.getValue = this.getValue.bind(this);
    this.setValue = this.setValue.bind(this);
  }

  setValue(name, value) {
    _set(this.internals, name, value);
  }

  getValue(name) {
    return _get(this.internals, name);
  }

  setKeyListener() {
    const onkey = (keyCode, mode) => {
      const { keys } = this;
      var n, k;
      for(n = 0; n < keys.length; n++) {
        k = keys[n];
        k.mode = k.mode || 'up';
        if ((k.key == keyCode) || (k.keys && (k.keys.indexOf(keyCode) >= 0))) {
          if (k.mode == mode) {
            k.action.call();
          }
        }
      }
    };

    Dom.on(document, 'keydown', function(ev) { onkey(ev.keyCode, 'down'); });
    Dom.on(document, 'keyup', function(ev) { onkey(ev.keyCode, 'up'); });
  }

  // playMusic: function() {
  //   var music = Dom.get('music');
  //   music.loop = true;
  //   music.volume = 0.05; // shhhh! annoying music!
  //   music.muted = (Dom.storage.muted === "true");
  //   music.play();
  //   Dom.toggleClassName('mute', 'on', music.muted);
  //   Dom.on('mute', 'click', function() {
  //     Dom.storage.muted = music.muted = !music.muted;
  //     Dom.toggleClassName('mute', 'on', music.muted);
  //   });
  // }

//=========================================================================
// UPDATE THE GAME WORLD
//=========================================================================

  updateStart() {
    // console.log('update start');
  }

  update(dt) {
    // const { segments, playerZ, speed, maxSpeed } = this.internals;
    // let { position } = this.internals;
    // let n, car, carW, sprite, spriteW;
    // let playerSegment = this.findSegment(segments, position+playerZ);
    // let playerW       = SPRITES.PLAYER_STRAIGHT.w * SPRITES.SCALE;
    // let speedPercent  = speed/maxSpeed;
    // let dx            = dt * 2 * speedPercent; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second
    // let startPosition = position;

    // updateCars(dt, playerSegment, playerW);

    // position = Util.increase(position, dt * speed, trackLength);

    // if (keyLeft)
    //   playerX = playerX - dx;
    // else if (keyRight)
    //   playerX = playerX + dx;

    // playerX = playerX - (dx * speedPercent * playerSegment.curve * centrifugal);

    // if (keyFaster) {
    //   speed = Util.accelerate(speed, accel, dt);
    // }
    // else if (keySlower) {
    //   speed = Util.accelerate(speed, breaking, dt);
    // }
    // else {
    //   speed = Util.accelerate(speed, decel, dt);
    // }


    // if ((playerX < -1) || (playerX > 1)) {

    //   if (speed > offRoadLimit) {
    //     speed = Util.accelerate(speed, offRoadDecel, dt);
    //   }

    //   for(n = 0 ; n < playerSegment.sprites.length ; n++) {
    //     sprite  = playerSegment.sprites[n];
    //     spriteW = sprite.source.w * SPRITES.SCALE;
    //     if (Util.overlap(playerX, playerW, sprite.offset + spriteW/2 * (sprite.offset > 0 ? 1 : -1), spriteW)) {
    //       speed = maxSpeed/5;
    //       position = Util.increase(playerSegment.p1.world.z, -playerZ, trackLength); // stop in front of sprite (at front of segment)
    //       break;
    //     }
    //   }
    // }

    // for(n = 0 ; n < playerSegment.cars.length ; n++) {
    //   car  = playerSegment.cars[n];
    //   carW = car.sprite.w * SPRITES.SCALE;
    //   if (speed > car.speed) {
    //     if (Util.overlap(playerX, playerW, car.offset, carW, 0.8)) {
    //       speed    = car.speed * (car.speed/speed);
    //       position = Util.increase(car.z, -playerZ, trackLength);
    //       break;
    //     }
    //   }
    // }

    // playerX = Util.limit(playerX, -3, 3);     // dont ever var it go too far out of bounds
    // speed   = Util.limit(speed, 0, maxSpeed); // or exceed maxSpeed

    // skyOffset  = Util.increase(skyOffset,  skySpeed  * playerSegment.curve * (position-startPosition)/segmentLength, 1);
    // hillOffset = Util.increase(hillOffset, hillSpeed * playerSegment.curve * (position-startPosition)/segmentLength, 1);
    // treeOffset = Util.increase(treeOffset, treeSpeed * playerSegment.curve * (position-startPosition)/segmentLength, 1);

    // if (position > playerZ) {
    //   if (currentLapTime && (startPosition < playerZ)) {
    //     // lastLapTime    = currentLapTime;
    //     // currentLapTime = 0;
    //     // if (lastLapTime <= Util.toFloat(Dom.storage.fast_lap_time)) {
    //     //   Dom.storage.fast_lap_time = lastLapTime;
    //     //   updateHud('fast_lap_time', formatTime(lastLapTime));
    //     //   Dom.addClassName('fast_lap_time', 'fastest');
    //     //   Dom.addClassName('last_lap_time', 'fastest');
    //     // }
    //     // else {
    //     //   Dom.removeClassName('fast_lap_time', 'fastest');
    //     //   Dom.removeClassName('last_lap_time', 'fastest');
    //     // }
    //     // updateHud('last_lap_time', formatTime(lastLapTime));
    //     // Dom.show('last_lap_time');
    //   }
    //   else {
    //     currentLapTime += dt;
    //   }
    // }

    // updateHud('speed', 5 * Math.round(speed/500));
    // updateHud('current_lap_time', formatTime(currentLapTime));
  }

  // updateCars(dt, playerSegment, playerW) {
  //   const { cars } = this.internals;
  //   let car, oldSegment, newSegment;

  //   for (let n = 0; n < cars.length; n++) {
  //     car         = cars[n];
  //     oldSegment  = findSegment(car.z);
  //     car.offset  = car.offset + updateCarOffset(car, oldSegment, playerSegment, playerW);
  //     car.z       = Util.increase(car.z, dt * car.speed, trackLength);
  //     car.percent = Util.percentRemaining(car.z, segmentLength); // useful for interpolation during rendering phase
  //     newSegment  = findSegment(car.z);

  //     if (oldSegment != newSegment) {
  //       index = oldSegment.cars.indexOf(car);
  //       oldSegment.cars.splice(index, 1);
  //       newSegment.cars.push(car);
  //     }
  //   }
  // }

  // updateCarOffset(car, carSegment, playerSegment, playerW) {
  //   var i, j, dir, segment, otherCar, otherCarW, lookahead = 20, carW = car.sprite.w * SPRITES.SCALE;

  //   // optimization, dont bother steering around other cars when 'out of sight' of the player
  //   if ((carSegment.index - playerSegment.index) > drawDistance) { return 0; }

  //   for(i = 1 ; i < lookahead ; i++) {
  //     segment = this.internals.segments[(carSegment.index+i)%this.internals.segments.length];

  //     if ((segment === playerSegment) && (car.speed > speed) && (Util.overlap(playerX, playerW, car.offset, carW, 1.2))) {
  //       if (playerX > 0.5) {
  //         dir = -1;
  //       } else if (playerX < -0.5) {
  //         dir = 1;
  //       } else {
  //         dir = (car.offset > playerX) ? 1 : -1;
  //       }

  //       return dir * 1/i * (car.speed-speed)/maxSpeed; // the closer the cars (smaller i) and the greated the speed ratio, the larger the offset
  //     }

  //     for(j = 0 ; j < segment.cars.length ; j++) {
  //       otherCar  = segment.cars[j];
  //       otherCarW = otherCar.sprite.w * SPRITES.SCALE;
  //       if ((car.speed > otherCar.speed) && Util.overlap(car.offset, carW, otherCar.offset, otherCarW, 1.2)) {
  //         if (otherCar.offset > 0.5) {
  //           dir = -1;
  //         } else if (otherCar.offset < -0.5) {
  //           dir = 1;
  //         } else {
  //           dir = (car.offset > otherCar.offset) ? 1 : -1;
  //         }

  //         return dir * 1/i * (car.speed-otherCar.speed)/maxSpeed;
  //       }
  //     }
  //   }

  //   // if no cars ahead, but I have somehow ended up off road, then steer back on
  //   if (car.offset < -0.9) {
  //     return 0.1;
  //   } else if (car.offset > 0.9) {
  //     return -0.1;
  //   } else {
  //     return 0;
  //   }
  // }

  updateHud(key, value) { // accessing DOM can be slow, so only do it if value has changed
    const { hud } = this;

    if (hud[key].value !== value) {
      hud[key].value = value;
      Dom.set(hud[key].dom, value);
    }
  }

  hideHud() {
    const hud = Dom.get('hud');
    Dom.addClassName(hud, 'hidden');
  }

  showHud() {
    const hud = Dom.get('hud');
    Dom.removeClassName(hud, 'hidden');
  }

  formatTime(dt) {
    let minutes = Math.floor(dt/60);
    let seconds = Math.floor(dt - (minutes * 60));
    let tenths  = Math.floor(10 * (dt - Math.floor(dt)));
    if (minutes > 0) {
      return minutes + "." + (seconds < 10 ? "0" : "") + seconds + "." + tenths;
    } else {
      return seconds + "." + tenths;
    }
  }

  ready(images) {
    const { gameState } = this.internals;
    const assetsObject = {};

    images.forEach(image => {
      assetsObject[image.name] = image.image;
    });

    if (gameState !== 'game') {
      this.hideHud();
    } else {
      this.showHud();
    }
    this.setValue('assets', { ...assetsObject });

    this.resetter.reset();
  }

  loadImages(names, callback) { // load multiple images and callback when ALL images have loaded
    const preloadImage = function (name, path) {
      return new Promise(function (resolve, reject) {
        const image = new Image();
        image.onload = resolve({ name, image });
        image.onerror = reject();
        image.src = path;
      });
    };

    Promise.all(names.map(url => {
      const imgUrl = `../static/images/${url}.png`;
      return preloadImage(url, imgUrl);
    }))
    .then(images => {
      callback(images);
    });
  }

  run() {
    const { images, canvas, step } = this.internals;
    const { update, updateStart } = this;

    this.loadImages(images, (loadedImages) => {
      this.ready(loadedImages);
      this.setKeyListener();

      let now = null;
      let last = timestamp();
      let dt = 0;
      let gdt = 0;

      const frame = () => {
        now = timestamp();

        if (this.gameState === 'game') {
          dt  = Math.min(1, (now - last) / 1000); // using requestAnimationFrame have to be able to handle large delta's caused when it 'hibernates' in a background or non-visible tab
          gdt = gdt + dt;

          while (gdt > step) {
            gdt = gdt - step;
            update(step);
          }
        } else {
          updateStart();
        }

        this.renderer.render();
        
        last = now;
        window.requestAnimationFrame(frame, canvas);
      }
      frame(); // lets get this party started
      
      // Game.playMusic();
    });
  }
}
