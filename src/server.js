require('dotenv/config');
const Logger = require('./lib/logger');
const cors = require('cors');

const app = require('./app');

const PORT = process.env.PORT || 3333;

app.use(cors());

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Origin',
    'https://academia-uninassau-back.herokuapp.com/'
  );
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

app.listen(PORT, () => {
  Logger.success(`Conectado na porta ${PORT}`);
});
