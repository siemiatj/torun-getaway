import Hammer from 'hammerjs';
import Dom from 'dom';
import Renderer from 'render';
import Resetter from 'reset';
import _set from 'lodash.set';
import _get from 'lodash.get';
import round from 'lodash.round';
import * as Util from 'util';
import { SPRITES } from 'constants';
import PNGFont from 'pngfont';
import Listener from 'orientation-listener';
import GN, { GyroNorm } from 'gyronorm';

export default class Game {
  constructor(opts) {
    this.internals = {
      ...opts,
      skyOffset: 0, // current sky scroll offset
      hillOffset: 0, // current hill scroll offset centrifugal
      treeOffset: 0, // current tree scroll offset
      segments: [], // array of road segments
      cars: [], // array of cars on the road
      assets: {},
      resolution: null, // scaling factor to provide resolution independence (computed)
      trackLength: null,  // z length of entire track (computed)
      cameraDepth: null, // z distance camera is from screen (computed)
      playerX: 0, // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
      playerZ: null, // player relative z distance from camera (computed)
      position: 0, // current camera Z position (add playerZ to get player's absolute Z position)
      speed: (opts.maxSpeed / 2), // current speed
      currentLapTime: 0, // current lap time
      driver: null,
      startCounter: 3,
      keyLeft: null,
      keyRight: null,
      keyFaster: { left: null, right: null },
      keySlower: { left: null, right: null },
    };

    this.ui_events = this.generateUIEvents();

    this.renderer = new Renderer(this, this.internals.canvas,
      this.internals.leftTouch, this.internals.rightTouch);
    this.resetter = new Resetter(this);

    this.getValue = this.getValue.bind(this);
    this.setValue = this.setValue.bind(this);
    this.update = this.update.bind(this);
    this.updateCountdown = this.updateCountdown.bind(this);
    this.browserOrientationChanged = this.browserOrientationChanged.bind(this);
    this.deviceOrientationChanged = this.deviceOrientationChanged.bind(this);

    this.handleLeftTouch = this.handleLeftTouch.bind(this);
    this.handleRightTouch = this.handleRightTouch.bind(this);
    this.setTouchListeners = this.setTouchListeners.bind(this);

    // mobile sorcery
    this.browserOrientation = new Listener(); //opts.browserOrientation;
    this.browserOrientation.on('change', this.orientationChanged);
    // console.log('ORIENT: ', opts.orientationListener);

    this.deviceOrientation = new GN(); //opts.orientationListener;
    this.deviceOrientation.init().then(() => {
        var isAvailable = this.deviceOrientation.isAvailable();
        if(!isAvailable.deviceOrientationAvailable) {
          console.log('Device orientation is not available.');
        }

        if(!isAvailable.accelerationAvailable) {
          console.log('Device acceleration is not available.');
        }

        if(!isAvailable.accelerationIncludingGravityAvailable) {
          console.log('Device acceleration incl. gravity is not available.');
        } 

        if(!isAvailable.rotationRateAvailable) {
          console.log('Device rotation rate is not available.');
        }

      this.deviceOrientation.start(this.deviceOrientationChanged);
    }).catch(function(e){
      console.log('SOMETHING NOT AVAILABLE: ', e);
      // Catch if the DeviceOrientation or DeviceMotion is not supported by the browser or device
    });
  }

  setValue(name, value) {
    _set(this.internals, name, value);
  }

  getValue(name) {
    return _get(this.internals, name);
  }

  deviceOrientationChanged(data) {
    console.log('ORIENTATION DATA: ', data);
  }

  browserOrientationChanged(orientation) {
    const view = Dom.get('racer');
    const canvas = this.internals.canvas;
    const leftTouch = this.internals.leftTouch;
    const rightTouch = this.internals.rightTouch;
    // const orientationValue = this.orientationChangeListener.orientationValue();

    // console.log('ORIENTATION: ', orientation);

    if (orientation === 'portrait') {
      Dom.addClassName(view, 'portrait');
      Dom.addClassName(canvas, 'portrait');
      Dom.addClassName(leftTouch, 'portrait');
      Dom.addClassName(rightTouch, 'portrait');

      this.internals.orientation = 'portrait';
      this.internalsCopy.orientation = 'portrait';
    } else {
      // const orientationValue = this.orientationChangeListener.orientationValue();
      Dom.removeClassName(view, 'portrait');
      Dom.removeClassName(canvas, 'portrait');
      Dom.removeClassName(leftTouch, 'portrait');
      Dom.removeClassName(rightTouch, 'portrait');

      this.internals.orientation = 'landscape';
      this.internalsCopy.orientation = 'landscape';

      // console.log('ORIENTATION: ', orientationValue);

      // this.internals.keyLeft = orientationValue 
    }
  }

  // get touch canvases height
  setTouchCanvasHeights(callback) {
    this.setValue('leftTouchHeight', this.getValue('leftTouch').getBoundingClientRect().height);
    this.setValue('rightTouchHeight', this.getValue('rightTouch').getBoundingClientRect().height);
    this.internalsCopy.leftTouchHeight = this.getValue('leftTouchHeight');
    this.internalsCopy.rightTouchHeight = this.getValue('rightTouchHeight');

    this.getValue('leftTouch').height = this.getValue('leftTouchHeight');
    this.getValue('rightTouch').height = this.getValue('rightTouchHeight');

    callback();
  }

  setTouchListeners() {
    const leftTouch = new Hammer(this.internals.leftTouch);
    leftTouch.on('press pressup pan', this.handleLeftTouch);
    leftTouch.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL, threshold: 10 });
    leftTouch.get('press').set({ time: 200 });

    const rightTouch = new Hammer(this.internals.rightTouch);
    rightTouch.on('press pressup pan', this.handleRightTouch); 
    rightTouch.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL, threshold: 10 });
    leftTouch.get('press').set({ time: 200 });
  }

  handleLeftTouch(event) {
    if (event.type === 'pressup') {
      this.setValue('keyFaster.left', null)
      this.setValue('keySlower.left', null);
      // this.internals.keyLeft = false;
    } else {
      const leftTouchHeight = this.internals.leftTouchHeight;

      if (event.center.y < leftTouchHeight / 2) {
        this.setValue('keyFaster.left', event.center.y)
        this.setValue('keySlower.left', null);
      } else {
        this.setValue('keyFaster.left', null);
        this.setValue('keySlower.left', event.center.y);
      }

      // this.internals.keyLeft = true;
    }
  }

  handleRightTouch(event) {
    if (event.type === 'pressup') {
      this.setValue('keyFaster.right', null)
      this.setValue('keySlower.right', null);
      // this.internals.keyRight = false;
    } else {
      const rightTouchHeight = this.internals.rightTouchHeight;

      if (event.center.y < rightTouchHeight / 2) {
        this.setValue('keyFaster.right', event.center.y)
        this.setValue('keySlower.right', null);
      } else {
        this.setValue('keyFaster.right', null);
        this.setValue('keySlower.right', event.center.y);
      }

      // this.internals.keyRight = true;
    }
  }

  generateUIEvents() {
    const shareOnFbHandler = (score) => {
      shareScore(score, () => {
        this.setValue('scoreShared', true);
      });
    }
    const driverSelectHandler = (num) => {
      this.setValue('driver', num);
      this.setValue('gameStep', 'start');
    };
    const eventsObject = {
      start_game_text: () => {
        this.setValue('gameStep', 'players');
      },
      driver_1: () => driverSelectHandler(1),
      driver_2: () => driverSelectHandler(2),
      driver_3: () => driverSelectHandler(3),
      start_overlay: () => {
        this.showHud();
        this.setValue('gameStep', 'game');
      },
      game_over_overlay: () => {
        this.resetter.resetGame();
        this.showHud();
        this.setValue('gameOver', false);
      },
      share_on_fb: () => {
        const time = this.getValue('currentLapTime');
        const rounded = round(time, 2);

        shareOnFbHandler(rounded);
      }
    };

    return eventsObject;
  }

//=========================================================================
// UPDATE THE GAME WORLD
//=========================================================================
  updateCountdown() {
    if (this.internals.startCounter === 0) {
      this.internals.startCounter = 3;
      this.internals.gameRunning = true;
    } else {
      this.internals.startCounter -= 1;
    }
  }

  update(dt) {
    const { segments, playerZ, maxSpeed, trackLength, keyLeft,
      keyRight, keyFaster, keySlower, centrifugal, accel, breaking,
      decel, segmentLength, offRoadLimit, offRoadDecel, skyOffset,
      hillOffset, treeOffset, skySpeed, hillSpeed, treeSpeed,
      currentLapTime, segmentsLowerLimit } = this.internals;
    let { position, speed, playerX } = this.internals;
    let n, car, carW, sprite, spriteW;
    let playerSegment = Util.findSegment(segments, segmentLength, position + playerZ);

    //TODO Should we alter this ?
    let playerW       = SPRITES.PLAYER_1_STRAIGHT.w * SPRITES.SCALE;
    let speedPercent  = speed / maxSpeed;
    let dx            = dt * 2 * speedPercent; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second
    let startPosition = position;

    this.updateCars(dt, playerSegment, playerW);

    position = Util.increase(position, dt * speed, trackLength);

    if (keyLeft && keyRight) {
    } else if (keyLeft && !keyRight) {
      playerX = playerX - dx;
    } else if (keyRight && !keyLeft) {
      playerX = playerX + dx;
    }

    playerX = playerX - (dx * speedPercent * playerSegment.curve * centrifugal);

    if (keyFaster.left || keyFaster.right) {
      speed = Util.accelerate(speed, accel, dt);
    } else if (keySlower.left || keySlower.right) {
      speed = Util.accelerate(speed, breaking, dt);
    } else {
      speed = Util.accelerate(speed, decel, dt);
    }

    if ((playerX < -1) || (playerX > 1)) {
      if (speed > offRoadLimit) {
        speed = Util.accelerate(speed, offRoadDecel, dt);
      }

      for (n = 0; n < playerSegment.sprites.length; n += 1) {
        sprite  = playerSegment.sprites[n];
        spriteW = sprite.source.w * SPRITES.SCALE;

        if (Util.overlap(playerX, playerW, sprite.offset + spriteW / 2 * (sprite.offset > 0 ? 1 : -1), spriteW)) {
          speed = maxSpeed / 5;
          position = Util.increase(playerSegment.p1.world.z, -playerZ, trackLength); // stop in front of sprite (at front of segment)
          break;
        }
      }
    }

    for (n = 0; n < playerSegment.cars.length; n += 1) {
      car  = playerSegment.cars[n];
      carW = car.sprite.w * SPRITES.SCALE;
      if (speed > car.speed) {
        if (Util.overlap(playerX, playerW, car.offset, carW, 0.8)) {
          speed    = car.speed * (car.speed/speed);
          position = Util.increase(car.z, -playerZ, trackLength);
          // this.internals.gameRunning = false;
          // this.internals.gameOver = true;

          // break;
        }
      }
    }

    if (speed <= 0) {
      this.internals.gameRunning = false;
      this.internals.gameOver = true;

      return;
    }

    this.setValue('position', position);
    this.setValue('playerX', Util.limit(playerX, -3, 3));     // dont ever var it go too far out of bounds
    this.setValue('speed', Util.limit(speed, 0, maxSpeed)); // or exceed maxSpeed

    this.setValue('skyOffset', Util.increase(skyOffset, skySpeed  * playerSegment.curve * (position-startPosition) / segmentLength, 1));
    this.setValue('hillOffset', Util.increase(hillOffset, hillSpeed * playerSegment.curve * (position-startPosition) / segmentLength, 1));
    this.setValue('treeOffset', Util.increase(treeOffset, treeSpeed * playerSegment.curve * (position-startPosition) / segmentLength, 1));

    if (position > playerZ) {
      this.setValue('currentLapTime',  currentLapTime + dt);
    }

    this.updateHud('speed', 5 * Math.round(speed/500));
    this.updateHud('current_lap_time', this.formatTime(currentLapTime));

    console.log('playerZ: ', playerZ, segments[0].p2.world.z);
    let currSegment;
    for (let i = 0; i < segments.length; i += 1) {
      currSegment = segments[i];

      // console.log('BLA: ', playerZ, currSegment.p1.world.z )
      if (currSegment.p2.world.z + 3*segmentLength < playerZ) {
        console.log('remove');
        segments.shift();
      } else {
        break;
      }
    }

    if (segments.length <= segmentsLowerLimit) {
      this.resetter.randomRoad();
    }
  }

  updateCars(dt, playerSegment, playerW) {
    const { cars, segments, segmentLength, trackLength } = this.internals;
    let car, oldSegment, newSegment;

    for (let n = 0; n < cars.length; n++) {
      car         = cars[n];
      oldSegment  = Util.findSegment(segments, segmentLength, car.z);
      car.offset  = car.offset + this.updateCarOffset(car, oldSegment, playerSegment, playerW);
      car.z       = Util.increase(car.z, dt * car.speed, trackLength);
      car.percent = Util.percentRemaining(car.z, segmentLength); // useful for interpolation during rendering phase
      newSegment  = Util.findSegment(segments, segmentLength, car.z);

      if (oldSegment != newSegment) {
        const index = oldSegment.cars.indexOf(car);
        oldSegment.cars.splice(index, 1);
        newSegment.cars.push(car);
      }
    }
  }

  updateCarOffset(car, carSegment, playerSegment, playerW) {
    const { segments, playerX, speed, maxSpeed, drawDistance } = this.internals;
    const lookahead = 20;
    const carW = car.sprite.w * SPRITES.SCALE;
    let segment, i, j, dir, otherCar, otherCarW;

    // optimization, dont bother steering around other cars when 'out of sight' of the player
    if ((carSegment.index - playerSegment.index) > drawDistance) {
      return 0;
    }

    for (i = 1; i < lookahead; i += 1) {
      segment = segments[(carSegment.index+i) % segments.length];

      if ((segment === playerSegment) && (car.speed > speed) && (Util.overlap(playerX, playerW, car.offset, carW, 1.2))) {
        if (playerX > 0.5) {
          dir = -1;
        } else if (playerX < -0.5) {
          dir = 1;
        } else {
          dir = (car.offset > playerX) ? 1 : -1;
        }

        return dir * 1 / i * (car.speed - speed) / maxSpeed; // the closer the cars (smaller i) and the greated the speed ratio, the larger the offset
      }

      for (j = 0; j < segment.cars.length; j += 1) {
        otherCar  = segment.cars[j];
        otherCarW = otherCar.sprite.w * SPRITES.SCALE;

        if ((car.speed > otherCar.speed) && Util.overlap(car.offset, carW, otherCar.offset, otherCarW, 1.2)) {
          if (otherCar.offset > 0.5) {
            dir = -1;
          } else if (otherCar.offset < -0.5) {
            dir = 1;
          } else {
            dir = (car.offset > otherCar.offset) ? 1 : -1;
          }

          return dir * 1 / i * (car.speed - otherCar.speed) / maxSpeed;
        }
      }
    }

    // if no cars ahead, but I have somehow ended up off road, then steer back on
    if (car.offset < -0.9) {
      return 0.1;
    } else if (car.offset > 0.9) {
      return -0.1;
    }
    
    return 0;
  }

  updateHud(key, value) { // accessing DOM can be slow, so only do it if value has changed
    const { hud, gameRunning } = this.internals;

    if (gameRunning) {
      if (hud[key].value !== value) {
        hud[key].value = value;
        Dom.set(hud[key].dom, value);
      }
    }
  }

  hideHud() {
    const hud = Dom.get('hud');
    Dom.addClassName(hud, 'hidden');
  }

  showHud() {
    const hud = Dom.get('hud');

    if (this.internals.player.locale !== 'pl_PL' && !this.internalsCopy.hudUpdated) {
      const speedElement = Dom.get('current_lap_time').firstElementChild;
      const textContent = speedElement.textContent;
      
      speedElement.textContent = textContent.replace('Czas', 'Time');
      this.internalsCopy.hudUpdated = true;
    }

    Dom.removeClassName(hud, 'hidden');
  }

  formatTime(dt) {
    const minutes = Math.floor(dt/60);
    const seconds = Math.floor(dt - (minutes * 60));
    const tenths  = Math.floor(10 * (dt - Math.floor(dt)));

    if (minutes > 0) {
      return `${minutes}.${(seconds < 10 ? '0' : '')}${seconds}.${tenths}`;
    }
    
    return `${seconds}.${tenths}`;
  }

  ready(images) {
    const assetsObject = {};

    images.forEach(image => {
      assetsObject[image.name] = image.image;
    });
    this.setValue('assets', { ...assetsObject });
    this.internalsCopy = { ...this.internals };
    this.orientationChanged(this.orientationChangeListener.orientation());

    this.gameFont = new PNGFont();
    this.gameFont.setup(this.getValue('canvas').getContext('2d'), this.getValue('assets.unifont'));
      
    // console.log('SETUP: ', this.getValue('leftTouch').getContext('2d'));
    this.lTouchFont = new PNGFont();
    this.lTouchFont.setup(this.getValue('leftTouch').getContext('2d'), this.getValue('assets.unifont'));

    this.rTouchFont = new PNGFont();
    this.rTouchFont.setup(this.getValue('rightTouch').getContext('2d'), this.getValue('assets.unifont'));

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
      const imgUrl = `public/images/${url}.png`;
      return preloadImage(url, imgUrl);
    }))
    .then(images => {
      callback(images);
    });
  }

  run() {
    const { images, canvas, step } = this.internals;
    const { update, updateCountdown, ui_events } = this;

    this.loadImages(images, (loadedImages) => {
      this.ready(loadedImages);
      this.setTouchListeners();

      let now = null;
      let last = Util.timestamp();
      let dt = 0;
      let gdt = 0;
      let counterTimestamp = Util.timestamp();

      const frame = () => {
        const { gameStep, gameRunning, gameOver } = this.internals;
        now = Util.timestamp();

        if (gameStep === 'game') {
          if (!gameRunning && !gameOver) {
            const timeDifference = now - counterTimestamp;

            if (timeDifference > 1000) {
              updateCountdown();

              counterTimestamp = now;
            }
          } else if (gameOver) {
            this.hideHud();
          } else {
            dt  = Math.min(1, (now - last) / 1000); // using requestAnimationFrame have to be able to handle large delta's caused when it 'hibernates' in a background or non-visible tab
            gdt = gdt + dt;

            while (gdt > step) {
              gdt = gdt - step;
              update(step);
            }
          }
        }

        this.renderer.render(ui_events);
        
        last = now;
        window.requestAnimationFrame(frame, canvas);
      }
      frame(); // lets get this party started
      
      // Game.playMusic();
    });
  }
}
