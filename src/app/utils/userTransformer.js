const userTransformer = (user) => {
    return {
        _id: user._id,
        avatar: user.avatar,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        email: user.email,
        bio: user.bio,
        phone: user.phone,
        status: user.status,
        role: user.role,
        balance: user.balance,
        databank: user.databank,
        address: user.address,
        bi_number: user.bi_number,
        state_code: user.state_code,
        is_checked: user.is_checked,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }
}

module.exports = userTransformer