// Load environment variables
require('dotenv').config();

import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import Debug from 'debug';

const debug = Debug('backend:app');
const app = express();

if (process.env.DEBUG) {
  require('./Mock');
}

// Routes
import { router as usersRouter } from '@routes/users';
import { router as authRouter } from '@routes/auth';
import { router as tasksRouter } from '@routes/tasks';

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
app.use(function (err: Error, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  debug(req.app.get('env'));
  debug(err);

  // @ts-ignore TODO
  const statusCode = err.status || 500;
  if (statusCode >= 500) console.error(err);

  res.status(statusCode);

  // Render the error page
  if (req.is('application/json')) {
    res.send(JSON.stringify({
        statusCode: statusCode,
        message: err.message,
      })
    );
  } else {
    res.send(err.message);
  }
});

const port = process.env.PORT || '3000';
app.set('port', port);

app.listen(port, () => {
  debug(`Listening on port ${port}`);
});
