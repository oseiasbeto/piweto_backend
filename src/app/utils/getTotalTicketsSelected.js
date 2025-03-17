const getTotalTicketsSelected = (batches) => {
    return batches.reduce((total, batch) => total + batch.quantitySelected, 0);
};

module.exports = getTotalTicketsSelected