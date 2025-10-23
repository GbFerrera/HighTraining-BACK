const {Router} = require("express")
const clientesRoutes = Router()

const clientesController = require("../controllers/ClientesController")

clientesRoutes.post("/", clientesController.create)
clientesRoutes.get("/", clientesController.index)
clientesRoutes.get("/:id", clientesController.show)
clientesRoutes.put("/:id", clientesController.update)
clientesRoutes.delete("/:id", clientesController.delete)

module.exports = clientesRoutes
