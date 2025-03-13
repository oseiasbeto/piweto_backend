const User = require("../../../model/User");
const Session = require("../../../model/Session");
const generateAccessToken = require("../../../utils/generateAccessToken");
const generateRefreshToken = require("../../../utils/generateRefreshToken");
const encryptRefreshToken = require("../../../utils/encryptRefreshToken");
const userTransformer = require("../../../utils/userTransformer");
const { randomUUID } = require("crypto")
const { compare } = require("bcryptjs");

module.exports = {
    async authUser(req, res) {
        try {
            const { email, password } = req.body;

            // Validação reforçada
            if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).send({
                    message: "Informe um email válido.",
                });
            }
            if (!password || typeof password !== "string" || password.trim() === "") {
                return res.status(400).send({
                    message: "Informe uma senha válida.",
                });
            }

            const user = await User.findOne({ email });

            if (!user || !(await compare(password, user.password))) {
                return res.status(401).send({
                    message: "Credenciais inválidas.",
                });
            }

            if (user.status === "p") {
                return res.status(403).send({
                    message: "Usuário não está ativo.",
                });
            }

            // Verificar chaves JWT
            if (!process.env.JWT_ACCESS_TOKEN_SECRET || !process.env.JWT_REFRESH_TOKEN_SECRET) {
                throw new Error("Configuração de tokens JWT incompleta.");
            }

            const expires_access_token_in = "30m";
            const expires_refresh_token_in = "7d";

            const access_token = generateAccessToken(user, expires_access_token_in);
            const refresh_token = generateRefreshToken(user, expires_refresh_token_in);
            const _encrypted_refresh_token = encryptRefreshToken(refresh_token);

            // Opcional: Invalidar sessões anteriores (se desejado)
            // await Session.updateMany({ user: user._id, status: 'a' }, { status: 'i' });

            const newSession = new Session({
                id: randomUUID(),
                userAgent: (req.headers["user-agent"] || "unknown").substring(0, 255), // Limitar tamanho
                crypto: {
                    key: _encrypted_refresh_token.key,
                    iv: _encrypted_refresh_token.iv,
                },
                token: _encrypted_refresh_token.encrypted_refresh_token,
                user: user._id,
                status: "a", // Garantir status explícito
            });

            await newSession.save();

            return res.status(200).send({
                access_token,
                session_id: newSession.id,
                user: userTransformer(user),
                message: "Usuário autenticado com sucesso.",
            });
        } catch (err) {
            console.error("Erro na autenticação:", err);
            return res.status(500).send({
                message: "Erro interno ao processar a autenticação.",
            });
        }
    },
};