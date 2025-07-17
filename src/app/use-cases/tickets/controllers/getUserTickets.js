const Ticket = require("../../../model/Ticket");

/**
 * @description Lista os ingressos de um usuário com base no email ou telefone
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} - Retorna os ingressos do usuário com paginação
 */

module.exports = {
  async getUserTickets(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const { email, phone } = req.user;

      // Validação dos parâmetros de busca
      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: "Email or phone is required to search for tickets",
        });
      }

      // Construir a query de busca
      const query = {
        $or: [{ "costumer.email": email }, { "costumer.phone": phone }],
      };

      // Opções de paginação
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { created_at: -1 }, // Ordena pelos mais recentes primeiro
        populate: [{ path: "event" }, { path: "batch" }, { path: "order" }],
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
