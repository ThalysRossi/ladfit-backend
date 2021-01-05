//require('dotenv/config');

const cors = require('cors');
const express = require('express');
const Youch = require('youch');
const Sentry = require('@sentry/node');
require('express-async-errors');
const routes = require('./routes');
const sentryConfig = require('./config/sentry');
const path = require('path');

class App {
  constructor() {
    this.server = express();

    Sentry.init(sentryConfig);

    this.middlewares();
    this.routes();
    this.exceptionHandler();
  }

  middlewares() {
    this.server.use(Sentry.Handlers.requestHandler());
    this.server.use(cors());
    this.server.use(express.json());
   /* this.server.use(
      '/exercicios/upload',
      express.static(path.resolve(__dirname, '..', 'img', 'uploads'))
    );
    this.server.use(
      '/usuario/upload',
      express.static(path.resolve(__dirname, '..', 'img', 'uploads'))
    );*/
  }

  routes() {
    this.server.use(routes);
    this.server.use(Sentry.Handlers.errorHandler());
  }

  exceptionHandler() {
    this.server.use(async (err, req, res, next) => {
      if (process.env.NODE_ENV === 'development') {
        const errors = await new Youch(err, req).toJSON();

        return res.status(500).json(errors);
      }

      return res.status(500).json({ error: 'Internal server error' });
    });
  }
}

module.exports = new App().server;
