const {Router} = require("express")
const trainingsRoutes = Router()

const trainingsController = require("../controllers/TrainingsController")

trainingsRoutes.post("/", trainingsController.create)
trainingsRoutes.get("/", trainingsController.index)
trainingsRoutes.get("/:id", trainingsController.show)
trainingsRoutes.put("/:id", trainingsController.update)
trainingsRoutes.delete("/:id", trainingsController.delete)

module.exports = trainingsRoutes
