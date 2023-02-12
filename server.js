const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const { exec } = require("child_process");
const fs = require('fs');
const iconv = require('iconv-lite');




const filesInDB = {1: { name: '1', content: 'Текст стартового файла' }}
// то есть изначально у меня в базе данных только один стартовый файл.

let db = new sqlite3.Database('database.sqlite', (err) => {
  if (err) {
    // Can't open database.sqlite
    console.log(err.message);
    throw err;
  } else {
    db.run(`CREATE TABLE users (username TEXT, password TEXT, filesInDB JSON)`, (err) => {
      if (err) {
        // Таблица уже создана
        console.log("Возможно таблица уже создана");
      } else {
        // хеширование пароля для безопасности (возможно пригодится в будущем)
        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash("admin", salt, function(err,hash) {
            db.run("INSERT INTO users VALUES ('admin',?, ?)", [hash, JSON.stringify(filesInDB)]);
          })
        })
        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash("viewer", salt, function(err,hash) {
            db.run("INSERT INTO users VALUES ('viewer',?, ?)", [hash, JSON.stringify(filesInDB)]);
          })
        })
      }
    });
  }
});


let dbCountFiles = new sqlite3.Database('databaseCountFiles.sqlite', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the databaseCountFiles SQLITE database');
})

dbCountFiles.serialize(() => {
  dbCountFiles.run(`CREATE TABLE IF NOT EXISTS countFiles (username TEXT, value INTEGER)`);
  dbCountFiles.run(`INSERT INTO countFiles VALUES ('admin', 1)`, function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log(`A row has been inserted with rowid ${this.lastID} where username = admin`);
  });
  dbCountFiles.run(`INSERT INTO countFiles VALUES ('viewer', 1)`, function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log(`A row has been inserted with rowid ${this.lastID} where username = viewer`);
  })
});

let countFilesFromClient = 1;





// устанавливаем настройку(шаблонизатор) к нашему приложению -
// чекает папку views (там расширение .ejs)
app.set('view engine', 'ejs');
// npm i body-parser (позволить работать с формочками)
// тут указываем что мы будем использовать body-parser
app.use(express.urlencoded({extended: false}));
// создаём промежуточное ПО(функционал который встраивается в последующие функции)
// и в самом ejs файле меняем ссылку на css файл - как будто мы уже находимся
// в статической папке 'public'.
app.use(express.static(__dirname + '/public'));
app.use(express.json());

// отслеживание (переход) главной страницы. Функция get позволяет отслеживать
// любые URL адреса (у меня здесь это / - главная страница).
app.get('/', (req, res) => { // req - запрашиваемый маршрут и т.д.( то что в кавычках)
    // вывод текста
    res.render('index');
});

app.get('/logout', function(req, res) {
  res.clearCookie('username');
  res.json({ message: 'User logged out' });
});

// валидация данных в регистрации (ПОТОМ СДЕЛАТЬ HTML странички вместо недоступной alert)!!!
app.post('/validation', (req, res) => {
  const { login, email, password, passwordAgain } = req.body;

  const loginRegex = /^[a-zA-Z][a-zA-Z0-9-_\.]{1,20}$/;
  const emailRegex = /^[a-zA-Z-.]+@[a-z]+\.[a-z]{2,3}$/;
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).*$/;

  if (loginRegex.test(login) && emailRegex.test(email) && passwordRegex.test(password) && password === passwordAgain) {
    res.status(200).json({ message: 'Validation successful' });
  } else {
    res.status(400).json({ message: 'Validation failed' });
  }
});




app.post('/check-user', (req, res) => {
  let username = req.body.username;
  console.log("username из формы = " + username);
  let password = req.body.password;
  console.log("password из формы = " + password);
//[username] - это массив, который содержит значение имени пользователя, которое мы получили из формы авторизации.
//Это значение будет подставлено в запрос вместо знака вопроса, и используется для поиска данных в таблице users
//по имени пользователя.
  db.get("SELECT username, password FROM users WHERE username = ?", [username], function(err, row) {
    if(row)
    {
      console.log('row.username = ' + row.username);
      console.log('row.password = ' + row.password);
      // bcrypt - хеш-функция принимает исходный пароль и возвращает необратимый хеш
      bcrypt.compare(password, row.password, function (err, result) {
        console.log("result = " + result);
        //console.log("error = " + error);
        if (result) {
          // атворизация успешна
          // Установка куки и отправка статуса 200
          res.status(200).cookie('username', username, { maxAge: 2592000000, httpOnly: true }).json({username});
        } else {
          // проходит если логин как в БД, а хеш паролей не совпал
          res.status(404).send('Error of login or password');
        }
      })
    } else {
      // Ошибка авторизации, если даже логин не совпал с данными из БД
      console.log('User not found in the database');
      res.status(404).send('Error of login or password');
    }
  })
})






app.post('/updateVariableCountFiles', (req, res) => {
  countFilesFromClient = req.body.countFiles;
  let username = req.body.username;
  dbCountFiles.run(`UPDATE countFiles SET value = ? WHERE username = '${username}'`, countFilesFromClient, function(err) {
    if (err) {
      console.log('Проблема тут. Ошибка обновления данных в таблице countFiles');
      return console.error(err.message);
    }
    console.log(`Row(s) updated: ${this.changes}`);
  });
  console.log("Обновляю переменную countFiles на сервере, теперь она равна " + countFilesFromClient);
  res.send({message: 'CountFiles updated'});
});

app.get('/getVariableCountFiles/:username', (req, res) => {
  let username = req.params.username;
  dbCountFiles.get(`SELECT value FROM countFiles WHERE username = ?`, [username], (err, row) => {
    if (err) {
      console.log('Проблема тут. Ошибка выборки данных из таблицы countFiles');
      return console.error(err.message);
    }
    countFilesFromClient = row.value;
    console.log('Обновил страницу, вытащил CountFiles из базы данных - и она равна ' + countFilesFromClient);
    res.send({countFilesFromClient: countFilesFromClient});
  });
});






app.get('/:foundUser/files', (req, res) => {
  // Проверка аутентификации пользователя
  console.log("Происходит проверка аутентификации пользователя");
  console.log("req.params.foundUser = " + req.params.foundUser);
  if (req.headers.cookie && req.headers.cookie.includes(`username=${req.params.foundUser}`)) {
    console.log("прошли первый if в get'e");
    res.render('userSelect', {foundUser: req.params.foundUser, filesInDB: 2});
    } else {
    res.send('You are not authenticated');
    }
});


// Обработка несуществующих страниц
app.get('/:something', (req, res) => {
  res.send('No such page was found');
});


// выгрузка данных из БД
app.get('/:foundUser/upload', function (req, res) {
  let username = req.params.foundUser;
  // Получение данных из базы данных
  db.all('SELECT filesInDB FROM users WHERE username = ?', [username], function (err, rows) {
    if (err) {
      console.error(err);
      res.sendStatus(500);
      return;
    }
    console.log(`rows = ${JSON.stringify(rows, null, 2)}`);
    res.json(rows);
  });
});


app.patch('/save-contentOfFile', (req, res) => {
  const numFile = req.body.num;
  const content = req.body.content;
  const username = req.body.username;
  console.log(`Сохранили файл под номером: ${numFile}`);
  console.log(`Содержимое: ${content}`);
  console.log(`имя пользователя: ${username}`);
  const query = `UPDATE users SET filesInDB = JSON_REPLACE(filesInDB, '$.${numFile}', JSON_OBJECT("name", "${numFile}", "content", "${content.replace(/"/g, '""')}")) WHERE username = '${username}'`;
  db.run(query, (error) => {
      if (error) {
        res.status(500).json({error: error.message});
      } else {
        console.log("Сохранено");
        res.status(200).json({message: 'Content updated successfully'});
      }
  });
});


app.post('/add-file', (req, res) => {
  const countFiles = req.body.countFiles;
  console.log(`countFiles из /add-file равен ${countFiles}`);
  const username = req.body.username;
  const filesInDBNew = { [countFiles]: { name: countFiles.toString(), content: `${countFiles}` } }; // убрать потом из контента countFiles!
  // Добавление новых данных в таблицу users
  db.run(`INSERT INTO users (username, filesInDB) VALUES (?, ?)`, [username, JSON.stringify(filesInDBNew)], (err) => {
    if (err) {
      console.error(err);
      res.send({ success: false, error: err });
    } else {
      console.log("создал файл в бд");
      res.send({ success: true });
    }
  });
});


// Выгрузка данных конкретного файла, для выгрузки кода в <textarea> (1, 2, 4 пункт)
app.get('/:foundUser/file/:num', (req, res) => {
  let username = req.params.foundUser;
  let fileNumber = req.params.num;
  console.log("textarea для " + username + " связана s файлом N. " + fileNumber);
  db.all("SELECT JSON_EXTRACT(filesInDB, '$." + fileNumber + ".content') AS content FROM users WHERE username = ? AND JSON_EXTRACT(filesInDB, '$." + fileNumber + ".content') IS NOT NULL", [username], (err, rows) => {
    if (err) {
      res.status(500).send(err);
    } else {
      console.log('Вы нажали на файл номер ' + fileNumber);
      console.log(`TEST! rows json stringify = ${JSON.stringify(rows)}`);
      let row = rows[0];
      if (!row) {
        res.status(404).send("File not found");
        return;
      }
      rowObject = JSON.stringify(row);
      console.log(`row = ${rowObject}`);
      res.status(200).send(row.content);
    }
  });
});





app.post("/compile", (req, res) => {
  const code = req.body.code;
  console.log(`Приняли это содержимое на компиляцию: ${code}`);
  fs.writeFileSync('main.py', code, { encoding: 'utf-8' });
  process.env.PYTHONIOENCODING = 'utf-8';
  exec("python main.py", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      res.send({result: error.message});
    } else if (stderr) {
      console.log(`stderr: ${stderr}`);
      res.send({result: stderr});
    } else {
      // res.set('Content-Type', 'text/html; charset=utf-8');
      console.log(stdout);
      const output = Buffer.from(stdout, 'utf-8').toString(); // удалить это
      console.log(`stdout: ${output}`);
      res.send({result: output});
    }
  });
});




app.delete('/deleteFile', (req, res) => {
  const { num, username } = req.body;
  db.run(`DELETE FROM users WHERE username = '${username}' AND JSON_EXTRACT(filesInDB, '$.${num}.name') = '${num}'`, (err) => {
    if (err)
    {
      console.log('Удаление прошло некорректно');
      res.json({ success: false});
    } else {
      console.log('Удаление прошло успешно!');
      db.all('SELECT filesInDB FROM users WHERE username = ?', [username], function (err, rows) {
        console.log(`rows = ${JSON.stringify(rows, null, 2)}`);
      });
      res.json({ success: true });
    }
  });
});








const PORT = 3000;
//запуск сервера
app.listen(PORT, ()=> {
    console.log(`Server started: http://localhost:${PORT}`)
});