const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const debug = require('debug')('backend:app');
import { NetworkError } from 'NetworkError';

const app = express();

// Load config
dotenv.config();

if (process.env.DEBUG) {
  require('mock');
}

// Routes
const { router: usersRouter } = require('./routes/users');
const { router: authRouter } = require('./routes/auth');
const { router: tasksRouter } = require('./routes/tasks');

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({ origin: true, credentials: true }));


// Add routes
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/tasks', tasksRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  debug(req.app.get('env'));
  debug(err);
  if (err instanceof NetworkError) {
    if (err.httpCode >= 500) console.error(err);
    res.status(err.httpCode);
  } else {
    if (err.status >= 500) console.error(err);
    res.status(err.status || 500);
  }

  // Render the error page
  if (req.is('application/json')) {
    res.send(JSON.stringify({
      statusCode: err.httpCode,
      message: err.message,
    }));
  } else {
    res.send(err.message);
  }
});

module.exports = app;
