/* eslint-disable max-len */
/* eslint-disable operator-assignment */
const express = require('express');

const router = express.Router();

router.get('/master/:object/:id', async (req, res) => {
  const db = req.app.get('db');

  const sql = `SELECT * FROM ${db.getTableName(req.params.object, 'master')}
               WHERE ${await db.getVisibleSql(req.params.object, 'read', req.user.id, req.user.grp)} AND id = ?`;
  const param = [req.params.id];

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await conntion.query(sql, param);
      res.json(JSON.stringify(rows));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} - [${param}] - ${err}`);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.get('/master/:object', async (req, res) => {
  const db = req.app.get('db');

  let sql = `SELECT * FROM ${db.getTableName(req.params.object, 'master')}
             WHERE ${await db.getVisibleSql(req.params.object, 'read', req.user.id, req.user.grp)} `;
  const param = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(req.query)) {
    sql += ` AND ${key} = ? `;
    param.push(value);
  }
  sql += ' ORDER BY editat DESC ';

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await conntion.query(sql, param);
      res.json(JSON.stringify(rows));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} - [${param}] - ${err}`);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.post('/master/:object', async (req, res) => {
  const db = req.app.get('db');

  const sql = `INSERT INTO ${db.getTableName(req.params.object, 'master')} (grp, editby, fields) VALUES (?, ?, ?)`;
  const param = [req.user.grp, req.user.id, JSON.stringify(req.body)];

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const ires = await conntion.query(sql, param);
      res.json(JSON.stringify(ires));
    }
    finally {
      if (conntion) {
        await conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} - [${param}] - ${err}`);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.put('/master/:object', async (req, res) => {
  const db = req.app.get('db');

  const sql = `UPDATE ${db.getTableName(req.params.object, 'master')}
               SET editby = ?, fields = ?
               WHERE ${await db.getVisibleSql(req.params.object, 'write', req.user.id, req.user.grp)}
               AND id = ?`;
  const param = [req.user.id, JSON.stringify(req.body.fields), req.body.id];

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const ires = await conntion.query(sql, param);
      res.json(JSON.stringify(ires));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url} = ${req.user.id}: ${sql} -[${param}] - ${err} `);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.delete('/master/:object', async (req, res) => {
  const db = req.app.get('db');

  const sql = `DELETE FROM ${db.getTableName(req.params.object, 'master')}
               WHERE ${await db.getVisibleSql(req.params.object, 'write', req.user.id, req.user.grp)}
               AND id = ?`;
  const param = [req.body.id];

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const ires = await conntion.query(sql, param);
      res.json(JSON.stringify(ires));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} -[${param}] - ${err} `);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.get('/summary/master/:object', async (req, res) => {
  const db = req.app.get('db');

  let sql = `SELECT ${db.getTableSummary(req.params.object, 'master').join(',')} 
             FROM ${db.getTableName(req.params.object, 'master')}
             WHERE ${await db.getVisibleSql(req.params.object, 'read', req.user.id, req.user.grp)} `;
  const param = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'visible') {
      // eslint-disable-next-line no-await-in-loop
      sql += ` AND ${await db.getVisibleSql(req.params.object, value, req.user.id, req.user.grp)} `;
    }
    else {
      sql += ` AND ${key} = ? `;
      param.push(value);
    }
  }
  sql += ' ORDER BY editat DESC ';

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await conntion.query(sql, []);
      res.json(JSON.stringify(rows));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} - [] - ${err}`);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.get('/code/:object', async (req, res) => {
  const db = req.app.get('db');

  const sql = `SELECT ${req.query.value} AS value, ${req.query.text} AS text  
             FROM ${db.getTableName(req.params.object)}
             WHERE ${await db.getVisibleSql(req.params.object, 'read', req.user.id, req.user.grp)} 
             ORDER BY ${req.query.value} ASC `;

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await conntion.query(sql, []);
      res.json(JSON.stringify(rows));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} - [] - ${err}`);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.get('/child/:object/:id', async (req, res) => {
  const db = req.app.get('db');

  const sql = `SELECT * FROM ${db.getTableName(req.params.object, 'child')} 
               WHERE ${await db.getVisibleSql(req.params.object, 'read', req.user.id, req.user.grp)} AND id = ? `;
  const param = [req.params.id];

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await conntion.query(sql, param);
      res.json(JSON.stringify(rows));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} - [${param}] - ${err}`);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.get('/child/:object', async (req, res) => {
  const db = req.app.get('db');

  const sql = `SELECT * FROM ${db.getTableName(req.params.object, 'child')} 
               WHERE ${await db.getVisibleSql(req.params.object, 'read', req.user.id, req.user.grp)} 
               AND parent_id = ? AND parent_object = ? 
               ORDER BY editat DESC`;
  const param = [req.query.from_id, req.query.from_obj];

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await conntion.query(sql, param);
      res.json(JSON.stringify(rows));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} - [${param}] - ${err}`);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.post('/child/:tobject', async (req, res) => {
  const db = req.app.get('db');

  const sql = `INSERT INTO ${db.getTableName(req.params.tobject, 'child')} (parent_id, parent_object, data) VALUES (?, ?, ?)`;
  const param = [req.body.parent_id, req.body.parent_object, JSON.stringify(req.body.fields)];

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const ires = await conntion.query(sql, param);
      res.json(JSON.stringify(ires));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} - [${param}] - ${err}`);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.put('/child/:tobject', async (req, res) => {
  const db = req.app.get('db');

  const sql = `UPDATE ${db.getTableName(req.params.tobject, 'child')} 
               SET editby = ?, fields = ?
               WHERE ${await db.getVisibleSql(req.params.object, 'read', req.user.id, req.user.grp)} 
               AND parent_id = ? AND parent_object = ? AND id = ?`;
  // eslint-disable-next-line max-len
  const param = [req.user.id, JSON.stringify(req.body.fields), req.body.parent_id, req.body.parent_object, req.body.id];

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const ires = await conntion.query(sql, param);
      res.json(JSON.stringify(ires));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} - [${param}] - ${err}`);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.delete('/child/:tobject', async (req, res) => {
  const db = req.app.get('db');

  const sql = `DELETE FROM ${db.getTableName(req.params.object, 'child')} 
               WHERE ${await db.getVisibleSql(req.params.object, 'read', req.user.id, req.user.grp)} 
               AND parent_id = ? AND parent_object = ? AND id = ?`;
  const param = [req.body.parent_id, req.body.parent_object, req.body.id];
  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const ires = await conntion.query(sql, param);
      res.json(JSON.stringify(ires));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} -[${param}] - ${err} `);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.get('/summary/child/:object', async (req, res) => {
  const db = req.app.get('db');

  let sql = `SELECT ${db.getTableSummary(req.params.object, 'child').join(',')} 
             FROM ${db.getTableName(req.params.object, 'child')}
             WHERE ${await db.getVisibleSql(req.params.object, 'read', req.user.id, req.user.grp)} `;
  let param = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(req.query)) {
    sql += ` AND ${key} = ? `;
    param.push(value);
  }
  sql += ' ORDER BY editat DESC ';

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await conntion.query(sql, []);
      res.json(JSON.stringify(rows));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} - [] - ${err}`);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});


router.get('/reference/:tobject', async (req, res) => {
  const db = req.app.get('db');

  let sql = `SELECT * FROM ${db.getTableName(req.params.tobject, 'master')} 
             WHERE ${await db.getVisibleSql(req.params.object, 'read', req.user.id, req.user.grp)} 
             AND id in (SELECT id FROM ${db.getTableName(req.params.tobject, 'reference')}
                        WHERE from_id = ? AND from_object = ?)
             ORDER BY editat DESC`;
  const param = [req.query.from_id, req.query.from_object];

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await conntion.query(sql, param);
      res.json(JSON.stringify(rows));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} - [${param}] - ${err}`);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.post('/reference/:tobject', async (req, res) => {
  const db = req.app.get('db');

  const sql = `INSERT INTO ${db.getTableName(req.params.object, 'reference')} (from_id, from_object, id, editby, fields) VALUES (?, ?, ?, ?, ?)`;
  const param = [req.body.from_id, req.body.from_object, req.body.id, req.user.id, JSON.stringify(req.body.fields)];

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const ires = await conntion.query(sql, param);
      res.json(JSON.stringify(ires));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} - [${param}] - ${err}`);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.put('/reference/:tobject', async (req, res) => {
  const db = req.app.get('db');

  const sql = `UPDATE ${db.getTableName(req.params.tobject, 'reference')} 
               SET editby = ?, fields = ?
               WHERE ${await db.getVisibleSql(req.params.object, 'write', req.user.id, req.user.grp)} 
               AND from_id = ? AND from_object = ? AND id = ? `;
  const param = [req.user.id, JSON.stringify(req.body.fields), req.body.from_id, req.body.from_object, req.body.id];

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const ires = await conntion.query(sql, param);
      res.json(JSON.stringify(ires));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} - [${param}] - ${err}`);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.delete('/reference/:tobject', async (req, res) => {
  const db = req.app.get('db');

  const sql = `DELETE FROM ${db.getTableName(req.params.object, 'reference')} 
               WHERE ${await db.getVisibleSql(req.params.object, 'write', req.user.id, req.user.grp)} 
               AND from_id = ? AND from_object = ? AND id = ?`;
  const param = [req.body.from_id, req.body.from_object, req.body.id];
  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const ires = await conntion.query(sql, param);
      res.json(JSON.stringify(ires));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} -[${param}] - ${err} `);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

router.get('/summary/reference/:object', async (req, res) => {
  const db = req.app.get('db');

  let sql = `SELECT ${db.getTableSummary(req.params.object, 'reference').join(',')} 
             FROM ${db.getTableName(req.params.object, 'reference')}
             WHERE ${await db.getVisibleSql(req.params.object, 'read', req.user.id, req.user.grp)} `;
  const param = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(req.query)) {
    sql += ` AND ${key} = ? `;
    param.push(value);
  }
  sql += ' ORDER BY editat DESC ';

  try {
    const conntion = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await conntion.query(sql, []);
      res.json(JSON.stringify(rows));
    }
    finally {
      if (conntion) {
        conntion.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}=${req.user.id}: ${sql} - [] - ${err}`);
    res.status(500).json(JSON.stringify({ err: { code: '', message: 'call system manager !', data: err } }));
  }
});

module.exports = router;
