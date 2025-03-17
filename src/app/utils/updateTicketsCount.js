const updateTicketsCount = function (total_count, prev_count, new_count) {
    let total = total_count

    if (new_count > prev_count) {
        let diference = new_count - prev_count
        total += diference

    } else if (new_count < prev_count) {
        let diference = prev_count - new_count
        total -= diference
    }

    return total
}

module.exports = updateTicketsCount