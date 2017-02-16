let fs = require('fs');
let nsg = require('node-sprite-generator');
let utils = require('../../node_modules/node-sprite-generator/lib/utils/stylesheet');
let _ = require('underscore');

const template = `
const SPRITES = {
  <% layout.images.forEach(function (image) { %>
    <%= image.className %>: { x: <%= image.x %>, y: <%= image.y %>, w: <%= image.width %>, h: <%= image.height %> },
  <% }); %>
}

export default SPRITES;
`;

nsg({
  src: [
    'static/images/sprites/*.png'
  ],
  spritePath: 'static/images/sprites.png',
  stylesheetPath: 'static/images/spritesheet.js',
  stylesheet: function(layout, stylesheetPath, spritePath, options, callback) {
    const stylesheetTpl = _.template(template);
    const defaults = {
      prefix: '',
      nameMapping: utils.nameToClass,
      spritePath: utils.getRelativeSpriteDir(spritePath, spritePath),
      pixelRatio: 1
    };

    options = _.extend({}, defaults, options);
    const scaledLayout = utils.getScaledLayoutForPixelRatio(layout, 1);

    scaledLayout.images = scaledLayout.images.map(function (image) {
      let imageName = options.nameMapping(image.path),
        className = utils.prefixString(imageName, options).toUpperCase();

      return _.extend(image, { className: className });
    });

    fs.writeFile(stylesheetPath, stylesheetTpl({
      getCSSValue: utils.getCSSValue,
      options: options,
      layout: scaledLayout,
    }), callback);
  },
  layout: 'packed',
}, function (err) {
  console.log('Sprite generated!');
});
