var nsg = require('node-sprite-generator');

nsg({
    src: [
        'static/images/sprites/*.png'
    ],
    spritePath: 'static/spritesheet.png',
    stylesheetPath: 'static/sprite.styl',
    layout: 'packed',
}, function (err) {
    console.log('Sprite generated!');
});