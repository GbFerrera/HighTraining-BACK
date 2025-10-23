const {Router} = require("express")
const clienteEstatisticRoutes = Router()

const clienteEstatisticController = require("../controllers/ClienteEstatisticController")

clienteEstatisticRoutes.post("/", clienteEstatisticController.create)
clienteEstatisticRoutes.get("/", clienteEstatisticController.index)
clienteEstatisticRoutes.get("/latest/:cliente_id", clienteEstatisticController.getLatest)
clienteEstatisticRoutes.get("/:id", clienteEstatisticController.show)
clienteEstatisticRoutes.put("/:id", clienteEstatisticController.update)
clienteEstatisticRoutes.delete("/:id", clienteEstatisticController.delete)

module.exports = clienteEstatisticRoutes
