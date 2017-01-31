import Dom from 'dom';
import { timestamp, findSegment } from 'util';

//=========================================================================
// GAME LOOP helpers
//=========================================================================

export default class Game {
  constructor(opts) {
    console.log('OPTS: ', opts);
    this.internals = { ...opts };
  }

  setGameState(state) {
    this.internals.gameState = state;
  }

  updateStart() {
    
  }

  update(dt) {
    const { segments } = this.internals;
    var n, car, carW, sprite, spriteW;
    var playerSegment = findSegment(segments, position+playerZ);
    var playerW       = SPRITES.PLAYER_STRAIGHT.w * SPRITES.SCALE;
    var speedPercent  = speed/maxSpeed;
    var dx            = dt * 2 * speedPercent; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second
    var startPosition = position;

    updateCars(dt, playerSegment, playerW);

    position = Util.increase(position, dt * speed, trackLength);

    if (keyLeft)
      playerX = playerX - dx;
    else if (keyRight)
      playerX = playerX + dx;

    playerX = playerX - (dx * speedPercent * playerSegment.curve * centrifugal);

    if (keyFaster)
      speed = Util.accelerate(speed, accel, dt);
    else if (keySlower)
      speed = Util.accelerate(speed, breaking, dt);
    else
      speed = Util.accelerate(speed, decel, dt);


    if ((playerX < -1) || (playerX > 1)) {

      if (speed > offRoadLimit)
        speed = Util.accelerate(speed, offRoadDecel, dt);

      for(n = 0 ; n < playerSegment.sprites.length ; n++) {
        sprite  = playerSegment.sprites[n];
        spriteW = sprite.source.w * SPRITES.SCALE;
        if (Util.overlap(playerX, playerW, sprite.offset + spriteW/2 * (sprite.offset > 0 ? 1 : -1), spriteW)) {
          speed = maxSpeed/5;
          position = Util.increase(playerSegment.p1.world.z, -playerZ, trackLength); // stop in front of sprite (at front of segment)
          break;
        }
      }
    }

    for(n = 0 ; n < playerSegment.cars.length ; n++) {
      car  = playerSegment.cars[n];
      carW = car.sprite.w * SPRITES.SCALE;
      if (speed > car.speed) {
        if (Util.overlap(playerX, playerW, car.offset, carW, 0.8)) {
          speed    = car.speed * (car.speed/speed);
          position = Util.increase(car.z, -playerZ, trackLength);
          break;
        }
      }
    }

    playerX = Util.limit(playerX, -3, 3);     // dont ever var it go too far out of bounds
    speed   = Util.limit(speed, 0, maxSpeed); // or exceed maxSpeed

    skyOffset  = Util.increase(skyOffset,  skySpeed  * playerSegment.curve * (position-startPosition)/segmentLength, 1);
    hillOffset = Util.increase(hillOffset, hillSpeed * playerSegment.curve * (position-startPosition)/segmentLength, 1);
    treeOffset = Util.increase(treeOffset, treeSpeed * playerSegment.curve * (position-startPosition)/segmentLength, 1);

    if (position > playerZ) {
      if (currentLapTime && (startPosition < playerZ)) {
        // lastLapTime    = currentLapTime;
        // currentLapTime = 0;
        // if (lastLapTime <= Util.toFloat(Dom.storage.fast_lap_time)) {
        //   Dom.storage.fast_lap_time = lastLapTime;
        //   updateHud('fast_lap_time', formatTime(lastLapTime));
        //   Dom.addClassName('fast_lap_time', 'fastest');
        //   Dom.addClassName('last_lap_time', 'fastest');
        // }
        // else {
        //   Dom.removeClassName('fast_lap_time', 'fastest');
        //   Dom.removeClassName('last_lap_time', 'fastest');
        // }
        // updateHud('last_lap_time', formatTime(lastLapTime));
        // Dom.show('last_lap_time');
      }
      else {
        currentLapTime += dt;
      }
    }

    updateHud('speed',            5 * Math.round(speed/500));
    updateHud('current_lap_time', formatTime(currentLapTime));
  }

  updateCars(dt, playerSegment, playerW) {
    var n, car, oldSegment, newSegment;
    for (n = 0 ; n < cars.length ; n++) {
      car         = cars[n];
      oldSegment  = findSegment(car.z);
      car.offset  = car.offset + updateCarOffset(car, oldSegment, playerSegment, playerW);
      car.z       = Util.increase(car.z, dt * car.speed, trackLength);
      car.percent = Util.percentRemaining(car.z, segmentLength); // useful for interpolation during rendering phase
      newSegment  = findSegment(car.z);
      if (oldSegment != newSegment) {
        index = oldSegment.cars.indexOf(car);
        oldSegment.cars.splice(index, 1);
        newSegment.cars.push(car);
      }
    }
  }

  updateCarOffset(car, carSegment, playerSegment, playerW) {
    var i, j, dir, segment, otherCar, otherCarW, lookahead = 20, carW = car.sprite.w * SPRITES.SCALE;

    // optimization, dont bother steering around other cars when 'out of sight' of the player
    if ((carSegment.index - playerSegment.index) > drawDistance) { return 0; }

    for(i = 1 ; i < lookahead ; i++) {
      segment = segments[(carSegment.index+i)%segments.length];

      if ((segment === playerSegment) && (car.speed > speed) && (Util.overlap(playerX, playerW, car.offset, carW, 1.2))) {
        if (playerX > 0.5) {
          dir = -1;
        } else if (playerX < -0.5) {
          dir = 1;
        } else {
          dir = (car.offset > playerX) ? 1 : -1;
        }

        return dir * 1/i * (car.speed-speed)/maxSpeed; // the closer the cars (smaller i) and the greated the speed ratio, the larger the offset
      }

      for(j = 0 ; j < segment.cars.length ; j++) {
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

          return dir * 1/i * (car.speed-otherCar.speed)/maxSpeed;
        }
      }
    }

    // if no cars ahead, but I have somehow ended up off road, then steer back on
    if (car.offset < -0.9) {
      return 0.1;
    } else if (car.offset > 0.9) {
      return -0.1;
    } else {
      return 0;
    }
  }

  updateHud(key, value) { // accessing DOM can be slow, so only do it if value has changed
    if (hud[key].value !== value) {
      hud[key].value = value;
      Dom.set(hud[key].dom, value);
    }
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

  run() {
    const { ready, images, canvas, render, step } = this.internals;
    const { update, updateStart } = this;

    this.loadImages(images, (images) => {

      ready(images);
      this.setKeyListener(keys);

      var now    = null,
          last   = timestamp(),
          dt     = 0,
          gdt    = 0;

      const self = this;

      function frame() {
        now = timestamp();

        if (self.gameState === 'game') {
          dt  = Math.min(1, (now - last) / 1000); // using requestAnimationFrame have to be able to handle large delta's caused when it 'hibernates' in a background or non-visible tab
          gdt = gdt + dt;
          while (gdt > step) {
            gdt = gdt - step;
            update(step);
          }
          render();
        } else {
          updateStart();
          renderStart();
        }
        
        last = now;
        requestAnimationFrame(frame, canvas);
      }
      frame(); // lets get this party started
      
      // Game.playMusic();
    });
  }

  loadImages(names, callback) { // load multiple images and callback when ALL images have loaded
    const preloadImage = function (path) {
      return new Promise(function (resolve, reject) {
        var image = new Image();
        image.onload = resolve(image);
        image.onerror = resolve();
        image.src = path;
      });
    };

    Promise.all(names.map(url => {
      const imgUrl = `../static/images/${url}.png`;
      return preloadImage(imgUrl);
    }))
    .then(arr => {
      callback(arr);
    });
  }

  setKeyListener(keys) {
    var onkey = function(keyCode, mode) {
      var n, k;
      for(n = 0 ; n < keys.length ; n++) {
        k = keys[n];
        k.mode = k.mode || 'up';
        if ((k.key == keyCode) || (k.keys && (k.keys.indexOf(keyCode) >= 0))) {
          if (k.mode == mode) {
            k.action.call();
          }
        }
      }
    };
    Dom.on(document, 'keydown', function(ev) { onkey(ev.keyCode, 'down'); } );
    Dom.on(document, 'keyup',   function(ev) { onkey(ev.keyCode, 'up');   } );
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
};
