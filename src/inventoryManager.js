export class Inventory {
    constructor() {
        this.items = [];
    }

    addItem(item) {
        this.items.push(item);
    }

    removeItem(item) {
        const itemIndex = this.items.indexOf(item);
        if (itemIndex > -1) {
            this.items.splice(itemIndex, 1);
        }
    }
}

export const playerInventory = new Inventory();