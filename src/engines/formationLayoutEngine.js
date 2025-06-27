/**
 * \uC9C4\uD615 \uC704\uCE58 \uACC4\uC0B0 \uC804\uBB38 \uC5D4\uC9C4
 */
export class FormationLayoutEngine {
    constructor(config) {
        this.rows = config.rows;
        this.cols = config.cols;
        this.tileSize = config.tileSize;
        this.orientation = config.orientation;
        this.rotation = config.rotation;
    }

    getSlotPosition(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.rows * this.cols) return { x: 0, y: 0 };
        const row = Math.floor(slotIndex / this.cols);
        const col = slotIndex % this.cols;
        const centerRow = Math.floor(this.rows / 2);
        const centerCol = Math.floor(this.cols / 2);
        const orientedCol = this.orientation === 'RIGHT' ? (this.cols - 1 - col) : col;
        const relativeX = (orientedCol - centerCol) * this.tileSize;
        const relativeY = (row - centerRow) * this.tileSize;
        const cosR = Math.cos(this.rotation);
        const sinR = Math.sin(this.rotation);
        const rotatedX = relativeX * cosR - relativeY * sinR;
        const rotatedY = relativeX * sinR + relativeY * cosR;
        return { x: rotatedX, y: rotatedY };
    }
}
