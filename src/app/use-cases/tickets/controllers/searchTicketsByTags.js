const Ticket = require("../../../model/Ticket");

/**
 * @description Pesquisa tickets por keywords nas tags
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} - Retorna os tickets encontrados com paginação
 */
module.exports = {
  async searchTicketsByTags(req, res) {
    try {
      const { page = 1, keywords, status, limit = 10 } = req.query;
      const { email, phone } = req.user;

      // Validação dos parâmetros de busca
      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: "Email or phone is required to search for tickets",
        });
      }

      // Validação dos parâmetros de busca
      if (!keywords) {
        return res.status(400).json({
          success: false,
          message: "Keywords are required to search for tickets",
        });
      }

      // Preparar as keywords para busca (divide por vírgulas ou espaços)
      const searchTerms = keywords
        .split(/[, ]+/)
        .filter((term) => term.trim() !== "");

      // Construir a query de busca
      const query = {
        $and: [
          { tags: { $in: searchTerms.map((term) => new RegExp(term, "i")) } },
          { $or: [{ "costumer.email": email }, { "costumer.phone": phone }] },
        ]
      };

      // Adicionar filtros adicionais se fornecidos
      if (status) {
        query.status = status;
      }

      // Opções de paginação
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { created_at: -1 },
        populate: [{ path: "event" }, { path: "batch" }, { path: "order" }],
      };

      // Busca paginada
      const tickets = await Ticket.paginate(query, options);

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
