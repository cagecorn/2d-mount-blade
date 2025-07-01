export class Tile {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
    }
}

export class Wall extends Tile {
    constructor(x, y) {
        super(x, y, 1);
        this.type = 'wall';
    }
}

export class Floor extends Tile {
    constructor(x, y) {
        super(x, y, 0);
        this.type = 'floor';
    }
}

export class Water extends Tile {
    constructor(x, y) {
        super(x, y, 2);
        this.type = 'water';
    }
}

export class VBridge extends Tile {
    constructor(x, y) {
        super(x, y, 3);
        this.type = 'vbridge';
    }
}

export class HBridge extends Tile {
    constructor(x, y) {
        super(x, y, 4);
        this.type = 'hbridge';
    }
}
