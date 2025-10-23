const {Router} = require("express")
const exercisesRoutes = Router()

const exercisesController = require("../controllers/ExercisesController")

exercisesRoutes.post("/", exercisesController.create)
exercisesRoutes.get("/", exercisesController.index)
exercisesRoutes.get("/:id", exercisesController.show)
exercisesRoutes.put("/:id", exercisesController.update)
exercisesRoutes.delete("/:id", exercisesController.delete)

module.exports = exercisesRoutes
