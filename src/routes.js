const Router = require('express').Router;
const multer = require('multer');
const multerConfig = require('./config/multer');

const UserController = require('./app/controllers/UserController');
const SessionController = require('./app/controllers/SessionController');
const ExerciseController = require('./app/controllers/ExerciseController');
const ArquivoController = require('./app/controllers/ArquivoController');
const StudentProfileController = require('./app/controllers/StudentProfileController');

const authMiddleware = require('./app/middlewares/auth');

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/user', UserController.store);
routes.post('/sessions', SessionController.store);



routes.use(authMiddleware);
routes.post('/exercises', ExerciseController.store);
routes.post('/studentprofile', StudentProfileController.store);
routes.post('/studentprofile/upload', upload.single('file'), StudentProfileController.upload);
routes.post('/exercises/:id', upload.single('file'), ExerciseController.upload);

routes.put('/user', UserController.update);
routes.put('/exercises/:id', ExerciseController.update);

routes.get('/user', UserController.list);
routes.get('/user/:id', UserController.listOne);
routes.get('/exercises/:id', ExerciseController.listOne);
routes.get('/exercises', ExerciseController.list);


module.exports = routes;
