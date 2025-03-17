const express = require("express");
const router = express.Router();

// importando os middlewares
const protectedRoute = require("../../middlewares/protectedRoute")
//const validObjectId = require("../../middlewares/validObjectId")

// importando os controllers
const { registerUser } = require("./controllers/registerUser")
const { authUser } = require("./controllers/authUser")
const { refreshToken } = require("./controllers/refreshToken")
const { forgotPassword } = require("./controllers/forgotPassword")
const { updateUser } = require("./controllers/updateUser")
const { checkOTPPhone } = require("./controllers/checkOTPPhone")
const { checkOTPPassword } = require("./controllers/checkOTPPassword")
const { checkEmail } = require("./controllers/checkEmail")
const { resetPassword } = require("./controllers/resetPassword")
const { activeEmail } = require("./controllers/activeEmail")
const { destroySession } = require("./controllers/destroySession")

// configurando as rotas
router.post("/register", registerUser)
router.post("/auth", authUser)
router.post("/refresh-access-token", refreshToken)
router.post("/forgot-password", forgotPassword)
router.put("/reset-password/:otp", resetPassword)
router.put("/check-otp-phone/:otp", checkOTPPhone)
router.get("/check-otp-reset-password/:otp", checkOTPPassword)
router.put("/check-email", protectedRoute, checkEmail)
router.put("/", protectedRoute, updateUser)
router.post("/destroy-session", destroySession)
router.put("/active-email", activeEmail)

// exportando as rotas
module.exports = router