const {Router} = require("express")
const treinadoresRoutes = Router()

const treinadoresController = require("../controllers/TreinadoresController")

treinadoresRoutes.post("/", treinadoresController.create)
treinadoresRoutes.get("/", treinadoresController.index)
treinadoresRoutes.get("/:id", treinadoresController.show)
treinadoresRoutes.put("/:id", treinadoresController.update)
treinadoresRoutes.delete("/:id", treinadoresController.delete)

module.exports = treinadoresRoutes
