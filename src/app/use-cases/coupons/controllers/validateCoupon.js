const Coupon = require("../../../model/Coupon");

module.exports = {
  async validateCoupon(req, res) {
    try {
      const { code } = req.body;

      if (!code)
        return res.status(400).send({
          message: "Informe o código do cupom.",
        });

      // 1. Buscar o cupom
      const coupon = await Coupon.findOne({ code });
      if (!coupon)
        return res.status(404).send({
          message: "Cupom inválido ou não encontrado.",
        });

      // 2. Validar o cupom
      const currentDate = new Date();

      // Validações básicas
      if (currentDate < coupon.valid_from) {
        return res.status(200).send({
          isValid: false,
          message: "Cupom ainda não está ativo.",
        });
      }

      if (currentDate > coupon.valid_until) {
        validation.isValid = false;
        return res.status(200).send({
          isValid: false,
          message: "Cupom expirado.",
        });
      }

      if (coupon.status !== "active") {
        return res.status(200).send({
          isValid: false,
          message: "Cupom não está ativo.",
        });
      }

      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        return res.status(200).send({
          isValid: false,
          coupon: null,
          message: "Cupom já foi utilizado o número máximo de vezes permitido.",
        });
      }

      await coupon.updateOne({
        $inc: { current_uses: 1 }, // Incrementa o uso do cupom
      });

      // Se válido, retornar dados essenciais do cupom
      res.status(200).send({
        isValid: true,
        coupon: {
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
        },
        message: "Cupom válido!",
      });
    } catch (err) {
      res.status(500).send({
        message: err.message,
      });
    }
  },
};
