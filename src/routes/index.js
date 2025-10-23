const {Router} = require("express")
const routes = Router()

const adminsRoutes = require("./admins.routes")
const treinadoresRoutes = require("./treinadores.routes")
const clientesRoutes = require("./clientes.routes")
const trainingsRoutes = require("./trainings.routes")
const clientTrainingRoutes = require("./clientTraining.routes")
const clienteEstatisticRoutes = require("./clienteEstatistic.routes")
const agendaPointRoutes = require("./agendaPoint.routes")
const exercisesRoutes = require("./exercises.routes")
const exerciseTrainingsRoutes = require("./exerciseTrainings.routes")

routes.use("/admins", adminsRoutes)
routes.use("/treinadores", treinadoresRoutes)
routes.use("/clientes", clientesRoutes)
routes.use("/trainings", trainingsRoutes)
routes.use("/client-training", clientTrainingRoutes)
routes.use("/cliente-estatistic", clienteEstatisticRoutes)
routes.use("/agenda-point", agendaPointRoutes)
routes.use("/exercises", exercisesRoutes)
routes.use("/exercise-trainings", exerciseTrainingsRoutes)

module.exports = routes
