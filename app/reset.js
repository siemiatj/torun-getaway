import * as Util from 'util';
import { COLORS, SPRITES, ROAD } from 'constants';
import RWC from 'random-weighted-choice';

//=========================================================================
// game reset helpers
//=========================================================================

export default class Reset {
  constructor(game) {
    this.gameInstance = game;
  }

  lastY() {
    const segments = this.gameInstance.getValue('segments');

    return (segments.length === 0) ? 0 : segments[segments.length - 1].p2.world.y;
  }

  addSegment(curve, y) {
    const props = this.gameInstance.getValue;
    const segments = props('segments');
    const segmentLength = props('segmentLength');
    const rumbleLength = props('rumbleLength');
    const n = segments.length;

    segments.push({
        index: n,
           p1: { world: { y: this.lastY(), z:  n * segmentLength }, camera: {}, screen: {} },
           p2: { world: { y: y, z: (n + 1) * segmentLength }, camera: {}, screen: {} },
        curve: curve,
      sprites: [],
         cars: [],
        color: Math.floor(n / rumbleLength) % 2 ? COLORS.DARK : COLORS.LIGHT
    });
  }

  addSprite(n, sprite, offset) {
    const segments = this.gameInstance.getValue('segments');

    segments[n].sprites.push({ source: sprite, offset: offset });
  }

  addRoad(enter, hold, leave, curve, y) {
    const segmentLength = this.gameInstance.getValue('segmentLength');
    const startY = this.lastY();
    const endY = startY + (Util.toInt(y, 0) * segmentLength);
    const total = enter + hold + leave;
    let n;

    for (n = 0; n < enter; n +=1 ) {
      this.addSegment(Util.easeIn(0, curve, n / enter), Util.easeInOut(startY, endY, n/total));
    }

    for (n = 0; n < hold; n += 1) {
      this.addSegment(curve, Util.easeInOut(startY, endY, (enter+n)/total));
    }

    for (n = 0; n < leave; n += 1) {
      this.addSegment(Util.easeInOut(curve, 0, n / leave), Util.easeInOut(startY, endY, (enter+hold+n)/total));
    }
  }

  addStraight() {
    const lenChoices = [ ROAD.LENGTH.SHORT, ROAD.LENGTH.MEDIUM, 75, ROAD.LENGTH.LONG];
    const num = Util.randomChoice(lenChoices);

    this.addRoad(num, num, num, 0, 0);
  }

  addHill() {
    const lenChoices = [ ROAD.LENGTH.SHORT, ROAD.LENGTH.MEDIUM, 75, ROAD.LENGTH.LONG];
    const hillHeightChoices = [
      ROAD.HILL.LOW, -ROAD.HILL.LOW, ROAD.HILL.MEDIUM,
      -ROAD.HILL.MEDIUM, ROAD.HILL.LONG
    ];
    const num = Util.randomChoice(lenChoices);
    const height = Util.randomChoice(hillHeightChoices);

    this.addRoad(num, num, num, 0, height);
  }

  addCurve() {
    const lenChoices = [ ROAD.LENGTH.SHORT, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.SHORT, ROAD.LENGTH.MEDIUM];
    const hillHeightChoices = [
      ROAD.HILL.NONE, -ROAD.HILL.LOW / 2, ROAD.HILL.LOW / 2,
      ROAD.HILL.LOW, -ROAD.HILL.LOW,
      ROAD.HILL.MEDIUM, -ROAD.HILL.MEDIUM
    ];
    const curveOptions = [ROAD.CURVE.EASY, -ROAD.CURVE.EASY, ROAD.CURVE.MEDIUM, -ROAD.CURVE.MEDIUM];
    const num    = Util.randomChoice(lenChoices);
    const curve  = Util.randomChoice(curveOptions);
    const height = Util.randomChoice(hillHeightChoices);

    this.addRoad(num, num, num, curve, height);
  }
      
  addLowRollingHills() {
    const lenChoices = [ ROAD.LENGTH.SHORT, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.SHORT, ROAD.LENGTH.MEDIUM];
    const hillHeightChoices = [
      -ROAD.HILL.LOW / 2, ROAD.HILL.LOW / 2,
      ROAD.HILL.LOW, -ROAD.HILL.LOW,
      ROAD.HILL.MEDIUM, -ROAD.HILL.MEDIUM
    ];
    const curveOptions = [0, 0, ROAD.CURVE.EASY, 0, -ROAD.CURVE.EASY, 0, 0];
    const amountRand = Util.randomInt(3, 6);

    for (let i = 0; i < amountRand; i += 1) {
      let len = Util.randomChoice(lenChoices);
      let hillHeight = Util.randomChoice(hillHeightChoices);
      let curve = Util.randomChoice(curveOptions);

      this.addRoad(len, len, len, curve, hillHeight);
    }
  }

  addSCurves() {
    const curveAngleChoices = [
      ROAD.CURVE.EASY, -ROAD.CURVE.EASY,
      ROAD.CURVE.MEDIUM, -ROAD.CURVE.MEDIUM
    ];
    const hillHeightChoices = [
      ROAD.HILL.NONE, ROAD.HILL.LOW, -ROAD.HILL.LOW,
      ROAD.HILL.MEDIUM, -ROAD.HILL.MEDIUM
    ];
    const amountRand = Util.randomInt(2, 5);

    for (let i = 0; i < amountRand; i += 1) {
      let curveAngle = Util.randomChoice(curveAngleChoices);
      let hillHeight = Util.randomChoice(hillHeightChoices);

      this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, curveAngle, hillHeight);
    }
  }

  addBumps() {
    let sign, height;
    const amountRand = Util.randomInt(4, 10);

    for (let i = 0; i < amountRand; i += 1) {
      sign = Math.random() < 0.5 ? -1 : 1;
      height = sign * ~~(Math.random()*9);

      this.addRoad(10, 10, 10, 0,  height);
    }
  }

  addDownhill() {
    const segmentLength = this.gameInstance.getValue('segmentLength');
    const options = [ ROAD.LENGTH.SHORT, ROAD.LENGTH.MEDIUM, 75, ROAD.LENGTH.LONG];
    const curvatureOptions = [ROAD.CURVE.NONE, ROAD.CURVE.EASY, -ROAD.CURVE.EASY];
    const num = Util.randomChoice(options);
    const curve = Util.randomChoice(curvatureOptions);

    this.addRoad(num, num, num, curve, - this.lastY() / segmentLength);
  }

  randomRoad() {
    const props = this.gameInstance.getValue;
    const segments = props('segments');
    const segmentsLimit = props('segmentsLimit');
    const segmentLength = props('segmentLength');
    const roadTypes = [
      { weight: 10, id: 'straight' },
      { weight: 25, id: 's_curves' },
      { weight: 17, id: 'bumps' },
      { weight: 20, id: 'lr_hills' },
      { weight: 15, id: 'hill' },
      { weight: 10, id: 'curve' },
      { weight: 3, id: 'downhill' },
    ];

    let chosen = null;
    while (segments.length < segmentsLimit) {
      chosen = RWC(roadTypes);

      switch (chosen) {
        case 'straight':
          this.addStraight();
          break;
        case 's_curves':
          this.addSCurves();
          break;
        case 'bumps':
          this.addBumps();
          break;
        case 'lr_hills':
          this.addLowRollingHills();
          break;
        case 'hill':
          this.addHill();
          break;
        case 'curve':
          this.addCurve();
          break;
        case 'downhill':
          this.addDownhill();
          break;
      }
    }

    this.gameInstance.setValue('segments', [...segments]);
    this.gameInstance.setValue('trackLength', (segments.length * segmentLength));
  }

  resetRoad() {
    this.randomRoad();
    this.resetSprites();
    this.resetCars();
  }

  resetSprites() {
    // const props = this.gameInstance.getValue;
    // const segments = props('segments');
    // let n, i;

    // for (n = 200; n < segments.length; n += 5) {
    //   this.addSprite(n, Util.randomChoice(SPRITES.PLANTS), Util.randomChoice([1,-1]) * (2 + Math.random() * 5));
    // }
  }

  resetCars() {
    const props = this.gameInstance.getValue;
    const segments = props('segments');
    const maxSpeed = props('maxSpeed');
    const segmentLength = props('segmentLength');
    const totalCars = props('totalCars');
    const cars = [];

    let car, segment, offset, z, sprite, speed;
    for (let n = 0; n < totalCars; n += 1) {
      offset = Math.random() * Util.randomChoice([-0.8, 0.8]);
      z      = Math.floor(Math.random() * segments.length) * segmentLength;
      sprite = Util.randomChoice(SPRITES.CARS);
      speed  = maxSpeed / 4 + Math.random() * maxSpeed / (sprite == SPRITES.SEMI ? 4 : 2);
      car = { offset: offset, z: z, sprite: sprite, speed: speed };
      segment = Util.findSegment(segments, segmentLength, car.z);
      segment.cars.push(car);
      cars.push(car);
    }

    this.gameInstance.setValue('cars', [...cars]);
  }

  reset() {
    const gV = this.gameInstance.getValue;
    const sV = this.gameInstance.setValue

    sV('canvas.width', gV('width'));
    sV('canvas.height', gV('height'));
    sV('cameraDepth', 1 / Math.tan((gV('fieldOfView') / 2) * Math.PI / 180));
    sV('playerZ', gV('cameraHeight') * gV('cameraDepth'));
    sV('resolution', gV('height') / 480);

    if (gV('gameState') === 'game' && (gV('segments').length === 0) ||
      gV('segmentLength') || gV('rumbleLength')) {
      this.resetRoad();
    }
  }

  resetGame() {
    const game = this.gameInstance;

    game.internals = {
      ...game.internalsCopy,
      segments: [],
      cars: [],
      gameStep: 'game',
      gameOver: false,
      gameRunning: false,
      player: game.internals.player,
      driver: game.internals.driver,
      assets: { ...game.internals.assets },
      keyLeft: null,
      keyRight: null,
      keyFaster: { left: null, right: null },
      keySlower: { left: null, right: null },
    };

    this.reset();
  }
}
