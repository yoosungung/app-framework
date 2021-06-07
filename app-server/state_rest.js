const express = require('express');
const xstate = require('./xstate_service');

const router = express.Router();

router.get('/machines/:id', async (req, res) => {
  const db = req.app.get('db');

  const sql = `SELECT * FROM sys_xmachine 
                WHERE ${await db.getVisibleSql('machine', 'read', req.user.id, req.user.grp)}
                  AND id = ?`;
  const params = [req.params.id];

  try {
    const connection = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await connection.query(sql, params);
      res.json(JSON.stringify(rows));
    }
    finally {
      if (connection) {
        connection.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}:${req.ip}:${sql} - [${params}]`);
    req.app.get('logger').error(err);
    res.status(500).json(JSON.stringify({ err: { code: '-301', message: 'call system manager !', data: err } }));
  }
});

router.get('/machines', async (req, res) => {
  const db = req.app.get('db');

  let sql = `SELECT * FROM sys_xmachine 
              WHERE ${await db.getVisibleSql('machine', 'read', req.user.id, req.user.grp)}`;
  const params = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(req.query)) {
    sql += ` AND ${key} = ? `;
    params.push(value);
  }
  sql += ' ORDER BY editat DESC ';

  try {
    const connection = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await connection.query(sql, params);
      res.json(JSON.stringify(rows));
    }
    finally {
      if (connection) {
        connection.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}:${req.ip}:${sql} - [${params}]`);
    req.app.get('logger').error(err);
    res.status(500).json(JSON.stringify({ err: { code: '-301', message: 'call system manager !', data: err } }));
  }
});

router.post('/machines/:name', async (req, res) => {
  const db = req.app.get('db');

  const sql = 'INSERT INTO sys_xmachine (fullname, grp, editby, fields) VALUES (?, ?, ?, ?)';
  const params = [req.params.name, req.user.grp, req.user.id, JSON.stringify(req.body)];

  try {
    const connection = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await connection.query(sql, params);
      res.json(JSON.stringify(rows));
    }
    finally {
      if (connection) {
        connection.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}:${req.ip}:${sql} - [${params}]`);
    req.app.get('logger').error(err);
    res.status(500).json(JSON.stringify({ err: { code: '-301', message: 'call system manager !', data: err } }));
  }
});

router.delete('/machines/:id', async (req, res) => {
  const db = req.app.get('db');
  const xid = req.params.id;

  const sql = `DELETE FROM sys_xmachine 
              WHERE ${await db.getVisibleSql('machine', 'write', req.user.id, req.user.grp)}
                AND id = ?`;
  const params = [xid];

  try {
    const connection = await db.pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await connection.query(sql, params);
      xstate.remove(xid);
      res.json(JSON.stringify(rows));
    }
    finally {
      if (connection) {
        connection.release();
      }
    }
  }
  catch (err) {
    req.app.get('logger').error(`${req.url}:${req.ip}:${sql} - [${params}]`);
    req.app.get('logger').error(err);
    res.status(500).json(JSON.stringify({ err: { code: '-301', message: 'call system manager !', data: err } }));
  }
});

router.put('/machines/start/:machineid', async (req, res) => {
  const xid = req.params.machineid;
  const xcontent = req.body;
  const xres = xstate.start(xid, xcontent);
  res.json(JSON.stringify(xres));
});

router.put('/states/:stateid/:event', async (req, res) => {
  const xid = req.params.stateid;
  const xevent = req.params.event;
  const xcontent = req.body;
  const xres = xstate.event(xid, xevent, xcontent);
  res.json(JSON.stringify(xres));
});

module.exports = router;
