// npm init $ npm install express --save $ npm install ejs --save $ npm install body-parser -S $ npm install sqlite3 -S $ npm install --save-dev nodemon $ npm install --save-dev ejs-lint

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('public'));
app.use('/', express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

//connecting to DB
let db = new sqlite3.Database(path.join(__dirname, 'data.db'), (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQLite database.');
});

//create table
db.run('CREATE TABLE IF NOT EXISTS data(id INTEGER PRIMARY KEY AUTOINCREMENT, string TEXT NOT NULL, integer INTEGER NOT NULL, float FLOAT NOT NULL, date TEXT NOT NULL, boolean TEXT NOT NULL)');

app.get('/', (req, res) => {
  const page = req.query.page || 1;
  const limit = 5;
  const offset = (page - 1) * limit;
  const url = req.url == '/' ? '/?page=1' : req.url

  let params = [];
  let isFilter = false;

  if (req.query.checkid && req.query.formid) {
    params.push(`id=${req.query.formid}`);
    isFilter = true;
  }
  if (req.query.checkstring && req.query.formstring) {
    params.push(`string like '%${req.query.formstring}%'`);
    isFilter = true;
  }
  if (req.query.checkinteger && req.query.forminteger) {
    params.push(`integer=${req.query.forminteger}`);
    isFilter = true;
  }
  if (req.query.checkfloat && req.query.formfloat) {
    params.push(`float=${req.query.formfloat}`);
    isFilter = true;
  }
  if (req.query.checkdate && req.query.formdate && req.query.formenddate) {
    params.push(`date between '${req.query.formdate}' and '${req.query.formenddate}'`);
    isFilter = true;
  }
  if (req.query.checkboolean && req.query.boolean) {
    params.push(`boolean='${req.query.boolean}'`);
    isFilter = true;
  }

  let sql = `select count(*) as total from data`;
  if (isFilter) {
    sql += ` where ${params.join(' and ')}`

  }

  db.all(sql, (err, count) => {
    const total = count[0].total;
    const pages = Math.ceil(total / limit);
    sql = `select * from data`;
    if (isFilter) {
      sql += ` where ${params.join(' and ')}`
    }
    sql += ` limit ${limit} offset ${offset}`;
    console.log(sql)
    db.all(sql, (err, rows) => {
      res.render('list', { rows, page, pages, query: req.query, url });
      console.log({ rows })
      console.log(params)
    });
  });
});

app.get('/add', (req, res) => res.render('add'));
app.post('/add', (req, res) => {
  const sql = 'INSERT INTO data(id, string, integer, float, date, boolean) VALUES(?,?,?,?,?,?)';
  db.run(sql, req.body.id, req.body.string, req.body.integer, req.body.float, req.body.date, req.body.boolean, (err) => {
    if (err) {
      console.error(err.message);
    };
    console.log('post to add success');
  })
  res.redirect('/');
})

app.get('/delete/:id', (req, res) => {
  const id = req.params.id
  const sql = `DELETE FROM data WHERE id = ${id}`;
  //const sqlReset = 'DELETE FROM sqlite_sequence WHERE name =data';
  db.run(sql, req.body.id, (err) => {
    if (err) {
      console.error(err.message);
    };
    console.log('Delete Success');
  })
  res.redirect('/');
})

app.get('/edit/:id', (req, res) => {
  const id = req.params.id;
  const sql = `SELECT * FROM data WHERE id = ${id}`;
  db.all(sql, (err, rows) => {
    if (err) {
      console.error(err.message);
    };
    res.render('edit', { item: rows[0], id: id })
  })
})
app.post('/edit/:id', (req, res) => {
  let id = req.params.id;
  let sql = ' UPDATE data SET string = ?, integer= ?, float = ?, date = ?, boolean = ? where id = ? '
  db.run(sql, req.body.string, req.body.integer, req.body.float, req.body.date, req.body.boolean, id, (err) => {
    if (err) {
      console.error(err.messsage);
    }
    console.log('post to edit success');
  });
  res.redirect('/');
})


app.listen(3000, () => {
  console.log('  ===>> Web ini berjalan di port 3000 <<=== ')
})
