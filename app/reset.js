import * as Util from 'util';
import { KEY, COLORS, BACKGROUND, SPRITES, ROAD } from 'constants';

//=========================================================================
// game reset helpers
//=========================================================================

export default class Reset {
  constructor(opts) {
    console.log('GAME: ', opts);
    this.gameInstance = opts.game;
  }

  lastY() {
    const { segments } = this.gameInstance;

    return (segments.length == 0) ? 0 : segments[segments.length-1].p2.world.y;
  }

  addSegment(curve, y) {
    const { segments, segmentLength, rumbleLength } = this.gameInstance;
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
    const { segments } = this.gameInstance;

    segments[n].sprites.push({ source: sprite, offset: offset });
  }

  addRoad(enter, hold, leave, curve, y) {
    const { segmentLength } = this.gameInstance;
    const startY = this.lastY();
    const endY = startY + (Util.toInt(y, 0) * segmentLength);
    const total = enter + hold + leave;
    let n;

    for (n = 0; n < enter; n++) {
      this.addSegment(Util.easeIn(0, curve, n/enter), Util.easeInOut(startY, endY, n/total));
    }
    for (n = 0; n < hold; n++) {
      this.addSegment(curve, Util.easeInOut(startY, endY, (enter+n)/total));
    }
    for (n = 0; n < leave; n++) {
      this.addSegment(Util.easeInOut(curve, 0, n/leave), Util.easeInOut(startY, endY, (enter+hold+n)/total));
    }
  }

  addStraight(num) {
    num = num || ROAD.LENGTH.MEDIUM;
    this.addRoad(num, num, num, 0, 0);
  }

  addHill(num, height) {
    num    = num    || ROAD.LENGTH.MEDIUM;
    height = height || ROAD.HILL.MEDIUM;
    this.addRoad(num, num, num, 0, height);
  }

  addCurve(num, curve, height) {
    num    = num    || ROAD.LENGTH.MEDIUM;
    curve  = curve  || ROAD.CURVE.MEDIUM;
    height = height || ROAD.HILL.NONE;
    this.addRoad(num, num, num, curve, height);
  }
      
  addLowRollingHills(num, height) {
    num    = num    || ROAD.LENGTH.SHORT;
    height = height || ROAD.HILL.LOW;
    this.addRoad(num, num, num,  0,                height/2);
    this.addRoad(num, num, num,  0,               -height);
    this.addRoad(num, num, num,  ROAD.CURVE.EASY,  height);
    this.addRoad(num, num, num,  0,                0);
    this.addRoad(num, num, num, -ROAD.CURVE.EASY,  height/2);
    this.addRoad(num, num, num,  0,                0);
  }

  addSCurves() {
    this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.NONE);
    this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.MEDIUM,  ROAD.HILL.MEDIUM);
    this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.EASY,   -ROAD.HILL.LOW);
    this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.MEDIUM);
    this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.MEDIUM, -ROAD.HILL.MEDIUM);
  }

  addBumps() {
    this.addRoad(10, 10, 10, 0,  5);
    this.addRoad(10, 10, 10, 0, -2);
    this.addRoad(10, 10, 10, 0, -5);
    this.addRoad(10, 10, 10, 0,  8);
    this.addRoad(10, 10, 10, 0,  5);
    this.addRoad(10, 10, 10, 0, -7);
    this.addRoad(10, 10, 10, 0,  5);
    this.addRoad(10, 10, 10, 0, -2);
  }

  addDownhillToEnd(num) {
    const { segmentLength, lastY } = this.gameInstance;

    num = num || 200;
    this.addRoad(num, num, num, -ROAD.CURVE.EASY, - lastY() / segmentLength);
  }

  resetRoad() {
    const { playerZ, rumbleLength, segments, segmentLength } = this.gameInstance;
    // const segments = [];

    this.addStraight(ROAD.LENGTH.SHORT);
    this.addLowRollingHills();
    this.addSCurves();
    this.addCurve(ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.LOW);
    this.addBumps();
    this.addLowRollingHills();
    this.addCurve(ROAD.LENGTH.LONG * 2, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
    this.addStraight();
    this.addHill(ROAD.LENGTH.MEDIUM, ROAD.HILL.HIGH);
    this.addSCurves();
    this.addCurve(ROAD.LENGTH.LONG, -ROAD.CURVE.MEDIUM, ROAD.HILL.NONE);
    this.addHill(ROAD.LENGTH.LONG, ROAD.HILL.HIGH);
    this.addCurve(ROAD.LENGTH.LONG, ROAD.CURVE.MEDIUM, -ROAD.HILL.LOW);
    this.addBumps();
    this.addHill(ROAD.LENGTH.LONG, -ROAD.HILL.MEDIUM);
    this.addStraight();
    this.addSCurves();
    this.addDownhillToEnd();

    this.resetSprites();
    this.resetCars();

    segments[Util.findSegment(segments, playerZ).index + 2].color = COLORS.START;
    segments[Util.findSegment(segments, playerZ).index + 3].color = COLORS.START;
    
    for (var n = 0; n < rumbleLength; n++) {
      segments[segments.length-1-n].color = COLORS.FINISH;
    }

    this.gameInstance.trackLength = segments.length * segmentLength;
  }

  resetSprites() {
    var n, i;

    // addSprite(20,  SPRITES.BILLBOARD07, -1);
    // addSprite(40,  SPRITES.BILLBOARD06, -1);
    // addSprite(60,  SPRITES.BILLBOARD08, -1);
    // addSprite(80,  SPRITES.BILLBOARD09, -1);
    // addSprite(100, SPRITES.BILLBOARD01, -1);
    // addSprite(120, SPRITES.BILLBOARD02, -1);
    // addSprite(140, SPRITES.BILLBOARD03, -1);
    // addSprite(160, SPRITES.BILLBOARD04, -1);
    // addSprite(180, SPRITES.BILLBOARD05, -1);

    // addSprite(240,                  SPRITES.BILLBOARD07, -1.2);
    // addSprite(240,                  SPRITES.BILLBOARD06,  1.2);
    // addSprite(segments.length - 25, SPRITES.BILLBOARD07, -1.2);
    // addSprite(segments.length - 25, SPRITES.BILLBOARD06,  1.2);

    // for(n = 10 ; n < 200 ; n += 4 + Math.floor(n/100)) {
    //   addSprite(n, SPRITES.PALM_TREE, 0.5 + Math.random()*0.5);
    //   addSprite(n, SPRITES.PALM_TREE,   1 + Math.random()*2);
    // }

    // for(n = 250 ; n < 1000 ; n += 5) {
    //   addSprite(n,     SPRITES.COLUMN, 1.1);
    //   addSprite(n + Util.randomInt(0,5), SPRITES.TREE1, -1 - (Math.random() * 2));
    //   addSprite(n + Util.randomInt(0,5), SPRITES.TREE2, -1 - (Math.random() * 2));
    // }

    // for(n = 200 ; n < segments.length ; n += 3) {
    //   addSprite(n, Util.randomChoice(SPRITES.PLANTS), Util.randomChoice([1,-1]) * (2 + Math.random() * 5));
    // }

    // var side, sprite, offset;
    // for(n = 1000 ; n < (segments.length-50) ; n += 100) {
    //   side      = Util.randomChoice([1, -1]);
    //   addSprite(n + Util.randomInt(0, 50), Util.randomChoice(SPRITES.BILLBOARDS), -side);
    //   for(i = 0 ; i < 20 ; i++) {
    //     sprite = Util.randomChoice(SPRITES.PLANTS);
    //     offset = side * (1.5 + Math.random());
    //     addSprite(n + Util.randomInt(0, 50), sprite, offset);
    //   }
        
    // }

  }

  resetCars() {
    const { segments, maxSpeed, segmentLength, totalCars } = this.gameInstance;
    const cars = [];

    let car, segment, offset, z, sprite, speed;
    for (let n = 0; n < totalCars; n += 1) {
      offset = Math.random() * Util.randomChoice([-0.8, 0.8]);
      z      = Math.floor(Math.random() * segments.length) * segmentLength;
      sprite = Util.randomChoice(SPRITES.CARS);
      speed  = maxSpeed/4 + Math.random() * maxSpeed/(sprite == SPRITES.SEMI ? 4 : 2);
      car = { offset: offset, z: z, sprite: sprite, speed: speed };
      segment = Util.findSegment(segments, car.z);
      segment.cars.push(car);
      cars.push(car);
    }

    this.gameInstance.cars = [...cars];
  }

  reset() {
    const { gameInstance } = this;
    // console.log('options: ', options);
    // options       = options || {};
    gameInstance.internals.canvas.width  = gameInstance.width;//  = Util.toInt(canvas.width, width);
    gameInstance.canvas.height = gameInstance.height;// = Util.toInt(canvas.height, height);
    // lanes                  = Util.toInt(lanes,lanes);
    // roadWidth              = Util.toInt(roadWidth, roadWidth);
    // cameraHeight           = Util.toInt(cameraHeight, cameraHeight);
    // drawDistance           = Util.toInt(drawDistance, drawDistance);
    // fogDensity             = Util.toInt(fogDensity, fogDensity);
    // fieldOfView            = Util.toInt(fieldOfView, fieldOfView);
    // segmentLength          = Util.toInt(segmentLength, segmentLength);
    // rumbleLength           = Util.toInt(rumbleLength, rumbleLength);
    gameInstance.cameraDepth = 1 / Math.tan((gameInstance.fieldOfView/2) * Math.PI/180);
    gameInstance.playerZ = (gameInstance.cameraHeight * gameInstance.cameraDepth);
    gameInstance.resolution = gameInstance.height/480;
    // refreshTweakUI();

    if (gameInstance.gameState === 'game' && (gameInstance.segments.length==0) ||
      (gameInstance.segmentLength) || (gameInstance.rumbleLength)) {
      this.resetRoad();
    }
  }
}
