const {Router} = require("express")
const clientTrainingRoutes = Router()

const clientTrainingController = require("../controllers/ClientTrainingController")

clientTrainingRoutes.post("/", clientTrainingController.create)
clientTrainingRoutes.get("/", clientTrainingController.index)
clientTrainingRoutes.get("/:id", clientTrainingController.show)
clientTrainingRoutes.put("/:id", clientTrainingController.update)
clientTrainingRoutes.delete("/:id", clientTrainingController.delete)

module.exports = clientTrainingRoutes
