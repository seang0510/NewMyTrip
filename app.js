const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const expressLayouts = require('express-ejs-layouts');
const pool = require('./db/pool');
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const skylog = require("./helper/logger");

// info와 error 로그 구현
skylog.info("Hello world!"); 
//MySQL Session setup
const options = {
  createDatabaseTable: true,
};

const sessionStore = new MySQLStore(options, pool);

const indexRouter = require('./routes');
const systemRouter = require('./routes/system');
const commonRouter = require('./routes/common');
const businessRouter = require('./routes/business');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout/layout');
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/uploads')));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, '/node_modules/bootstrap/dist')));
app.use(express.static(path.join(__dirname, '/node_modules/@popperjs/core/dist')));
app.use(express.static(path.join(__dirname, '/node_modules/font-awesome')));
app.use(express.static(path.join(__dirname, '/node_modules/jquery/dist')));
app.use(express.static(path.join(__dirname, '/node_modules/jquery-ui/dist')));
app.use(express.static(path.join(__dirname, '/node_modules/jquery.cookie')));

//mysql-session setup
app.use(session({
	key: process.env.SESS_KEY,
	secret: process.env.SESS_SECRET,
	store: sessionStore,
	resave: false,
	saveUninitialized: false
}));

app.use('/', indexRouter);
app.use('/system', systemRouter);
app.use('/common', commonRouter);
app.use('/business', businessRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
//test
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', { layout: false });
});

module.exports = app;
