const Ticket = require("../../../model/Ticket");

/**
 * @description Lista os ingressos de um usuário com base no email ou telefone
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} - Retorna os ingressos com paginação
 */

module.exports = {
  async getTicketsByOrderId(req, res) {
    try {
      const { id } = req.params
      const { page = 1, limit = 10 } = req.query;

      // Validação dos parâmetros de busca
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Informe o id da reserva",
        });
      }

      // Construir a query de busca
      const query = {
        order: id,
      };

      // Opções de paginação
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { created_at: -1 }, // Ordena pelos mais recentes primeiro
        populate: [{ path: "event" }, {path: "order"}, { path: "batch" }],
      };

      // Busca paginada
      const tickets = await Ticket.paginate(query, options);

      // Formata a resposta
      const response = {
        success: true,
        data: tickets.docs,
        pagination: {
          total: tickets.total,
          limit: tickets.limit,
          page: tickets.page,
          pages: tickets.pages,
          hasNextPage: tickets.hasNextPage,
          hasPrevPage: tickets.hasPrevPage,
        },
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
};
