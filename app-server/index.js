const express = require('express');

const app = express();

/* load config */
const config = require('./svr.config.json');

const date = new Date();
const base64jwtSecretKey = Buffer.from(config.app.name + config.app.site + date.toLocaleDateString(), "utf8").toString('base64');
app.set('jwtSecretKey', base64jwtSecretKey);
app.set('jwtExpiresIn', config.app.expiresIn);
app.set('port', config.app.port || 3000);

/* prepaire db */
const db = require('./db');

app.set('db', db);

/* prepaire logger */
const logger = require('./winston');

app.set('logger', logger);

/* load body-parser */
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

/* load middle ware */
app.disable('x-powered-by');

/* middle ware */
// const cors = require('cors')
// app.use(cors({ exposedHeaders: 'x-access-token' }))
const authMiddleware = require('./mdw_auth');

app.use('/api', authMiddleware);
app.use('/state', authMiddleware);

/* prepaire api path */
const rtrapi = require('./api_rest');

app.use('/api', rtrapi);

const rtrstate = require('./state_rest');

app.use('/state', rtrstate);

const rtrsign = require('./sign');

app.use('/sign', rtrsign);

/* prepaire static path */
app.use(express.static('./dist'));

/* strat server */
app.listen(app.get('port'), () => {
  logger.info(`App Server listening on port ${app.get('port')}`);
});
