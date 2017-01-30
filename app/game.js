import Dom from 'dom';
import { timestamp } from 'util';

//=========================================================================
// GAME LOOP helpers
//=========================================================================

export default class Game {
  constructor() {
    this.gameState = null;
  }

  setGameState(state) {
    this.gameState = state;
  }

  run(options) {
    this.loadImages(options.images, (images) => {

      options.ready(images); // tell caller to initialize itself because images are loaded and we're ready to rumble

      this.setKeyListener(options.keys);

      var canvas = options.canvas,    // canvas render target is provided by caller
          update = options.update,    // method to update game logic is provided by caller
          render = options.render,    // method to render the game is provided by caller
          step   = options.step,      // fixed frame step (1/fps) is specified by caller
          now    = null,
          last   = timestamp(),
          dt     = 0,
          gdt    = 0;

      const self = this;

      function frame() {
        now = timestamp();

        if (self.gameState !== 'intro') {
          dt  = Math.min(1, (now - last) / 1000); // using requestAnimationFrame have to be able to handle large delta's caused when it 'hibernates' in a background or non-visible tab
          gdt = gdt + dt;
          while (gdt > step) {
            gdt = gdt - step;
            update(step);
          }  
        }
        render();
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

    console.log('names: ', names);

    Promise.all(names.map(url => {
      const imgUrl = `../static/images/${url}.png`;
      return preloadImage(imgUrl);
    }))
    .then(arr => {
      callback(arr);
    })
    // .catch(err => {
    //   callback(err);
    // });
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
