const User = require("../../../model/User");
const Session = require("../../../model/Session");
const generateAccessToken = require("../../../utils/generateAccessToken");
const generateRefreshToken = require("../../../utils/generateRefreshToken");
const decryptRefreshToken = require("../../../utils/decryptRefreshToken");
const decodeTokem = require("../../../utils/decodeTokem"); // Corrigir typo: "decodeTokem" -> "decodeToken"
const encryptRefreshToken = require("../../../utils/encryptRefreshToken");
const userTransformer = require("../../../utils/userTransformer");


module.exports = {
    async refreshToken(req, res) {
        try {
            const { session_id } = req.body;

            // Validação mais robusta do session_id
            if (!session_id || typeof session_id !== "string" || session_id.trim() === "") {
                return res.status(400).send({
                    message: "Informe um ID de sessão válido.",
                });
            }

            // Busca a sessão de forma atômica
            const session = await Session.findOne(
                { id: session_id, status: "a" }
            );

            if (!session) {
                return res.status(401).send({
                    message: "Nenhuma sessão ativa encontrada com este ID.",
                });
            }

            const _key = session.crypto.key;
            const iv = session.crypto.iv;
            const encrypted_refresh_token = session.token;
            const secret_refresh_token_key = process.env.JWT_REFRESH_TOKEN_SECRET;

            if (!secret_refresh_token_key) {
                throw new Error("Chave secreta de refresh token não configurada.");
            }

            const decrypt_token = decryptRefreshToken({
                key: _key,
                iv,
                encryptedRefreshToken: encrypted_refresh_token,
            });

            const decoded_data = decodeTokem(decrypt_token, secret_refresh_token_key);
            const user = await User.findOne({ _id: decoded_data.id });

            if (!user) {
                return res.status(400).send({
                    message: "Usuário não encontrado. Faça login novamente.",
                });
            }

            // Verificar se a sessão pertence ao usuário decodificado (opcional, se aplicável)
            if (session?.user?.toString() !== user?._id.toString()) {
                return res.status(403).send({
                    message: "Sessão não pertence a este usuário.",
                });
            }

            const expires_access_token_in = "30d";
            const expires_refresh_token_in = "1y";

            const access_token = generateAccessToken(user, expires_access_token_in);
            const refresh_token = generateRefreshToken(user, expires_refresh_token_in);
            const _encrypted_refresh_token = encryptRefreshToken(refresh_token);

            // Atualizar a sessão com o novo token
            await session.updateOne({
                $set: {
                    userAgent: req.headers["user-agent"]?.substring(0, 255) || "unknown", // Limitar tamanho
                    crypto: {
                        key: _encrypted_refresh_token.key,
                        iv: _encrypted_refresh_token.iv,
                    },
                    token: _encrypted_refresh_token.encrypted_refresh_token
                },
            });

            return res.status(200).send({
                access_token,
                session_id: session.id,
                user: userTransformer(user),
                message: "Token de acesso atualizado com sucesso.",
            });
        } catch (err) {
            console.error("Erro ao atualizar token:", err);
            return res.status(500).send({
                message: "Erro interno ao processar a solicitação.",
            });
        }
    },
};