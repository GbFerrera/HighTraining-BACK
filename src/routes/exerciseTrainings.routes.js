const {Router} = require("express")
const exerciseTrainingsRoutes = Router()

const exerciseTrainingsController = require("../controllers/ExerciseTrainingsController")

exerciseTrainingsRoutes.post("/", exerciseTrainingsController.create)
exerciseTrainingsRoutes.get("/", exerciseTrainingsController.index)
exerciseTrainingsRoutes.get("/training/:training_id", exerciseTrainingsController.getByTraining)
exerciseTrainingsRoutes.get("/:id", exerciseTrainingsController.show)
exerciseTrainingsRoutes.delete("/:id", exerciseTrainingsController.delete)

module.exports = exerciseTrainingsRoutes
