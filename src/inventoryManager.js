export const playerInventory = {
    items: [],

    addItem(item) {
        this.items.push(item);
    },

    hasItem(itemName) {
        return this.items.includes(itemName);
    }
};