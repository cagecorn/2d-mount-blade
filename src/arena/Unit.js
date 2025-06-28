class Unit {
    constructor(id, team, mbti, position = { x: 0, y: 0 }) {
        this.id = id;
        this.team = team;
        this.mbti = mbti;
        this.x = position.x;
        this.y = position.y;
        this.hp = 100;
    }

    isAlive() {
        return this.hp > 0;
    }
}

export { Unit };
