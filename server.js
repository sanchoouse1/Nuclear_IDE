const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const { exec } = require("child_process");
const fs = require('fs');

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


// Сбор данных из БД, для выгрузки кода в <textarea> (1, 2, 4 пункт)
app.get('/:foundUser/file/:num', (req, res) => {
  let username = req.params.foundUser;
  let fileNumber = req.params.num;
  console.log("textarea для " + username + " связана s файлом N. " + fileNumber);
  db.all("SELECT filesInDB FROM users WHERE username = ?", [username], (err, rows) => {
    if (err) {
      res.status(500).send(err);
    } else {
      let row = rows[fileNumber-1];
      const rowObject = JSON.parse(row.filesInDB);
      //console.log(rowObject[fileNumber].content);
      res.status(200).send(rowObject[fileNumber].content);
    }
  });
  //реализовать возвращение клиенту и добавление в <textarea>
})

app.post("/compile", (req, res) => {
  const code = req.body.code;
  console.log(`Приняли это содержимое на компиляцию: ${code}`);
  fs.writeFileSync('code.c', code);
  exec("gcc code.c -o code", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      //res.send({error: error.message});
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      res.send({result: stderr});
    } else {
      console.log(`stdout: ${stdout}`);
      res.send({result: code});
    }
  });
});


const PORT = 3000;
//запуск сервера
app.listen(PORT, ()=> {
    console.log(`Server started: http://localhost:${PORT}`)
});

/*
#include <stdio.h>
int main() {
  printf("Вот такие вот дела!");
  return 0;
}
*/