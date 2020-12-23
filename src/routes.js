const Router = require('express').Router;

const UsuarioController = require('./app/controllers/UsuarioController');
const SessionController = require('./app/controllers/SessionController');
const ExercicioController = require('./app/controllers/ExercicioController');

const authMiddleware = require('./app/middlewares/auth');

const routes = new Router();

routes.post('/usuario', UsuarioController.store);
routes.post('/sessions', SessionController.store);
routes.post('/exercicios', ExercicioController.store);

routes.use(authMiddleware);
routes.put('/usuario', UsuarioController.update);
routes.put('/exercicios', ExercicioController.update);
routes.get('/usuario', UsuarioController.list);
routes.get('/usuario/:id', UsuarioController.listOne);
routes.get('/exercicios/:id', ExercicioController.listOne);
routes.get('/exercicios', ExercicioController.list);


module.exports = routes;
