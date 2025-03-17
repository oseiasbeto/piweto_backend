const User = require("../model/User")

module.exports = {
    async deleteUser(check_email_token) {
        try {
            const user = await User.findOne({
                check_otp_code
            })
            if (user) {
                await user.deleteOne()
                console.log(`✅ A conta do usuario: ${user.first_name} foi removida com sucesso!`)
            }
        } catch (err) {
            console.log(err.message)
        }
    }
}