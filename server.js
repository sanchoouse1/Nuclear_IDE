const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

let db = new sqlite3.Database('database.sqlite', (err) => {
  if (err) {
    // Can't open database.sqlite
    console.log(err.message);
    throw err;
  } else {
    db.run(`CREATE TABLE users (username TEXT, password TEXT)`, (err) => {
      if (err) {
        // Таблица уже создана
        console.log("Возможно таблица уже создана");
      } else {
        // хеширование пароля для безопасности (возможно пригодится в будущем)
        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash("admin", salt, function(err,hash) {
            db.run("INSERT INTO users VALUES ('admin',?)", [hash]);
          })
        })
        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash("viewer", salt, function(err,hash) {
            db.run("INSERT INTO users VALUES ('viewer',?)", [hash]);
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

app.get('/:foundUser/file/1', (req, res) => {
  // Проверка аутентификации пользователя
  console.log("Обрабатываем страницу /:foundUser");
  console.log("req.params.foundUser = " + req.params.foundUser);
  if (req.headers.cookie && req.headers.cookie.includes(`username=${req.params.foundUser}`)) {
    console.log("прошли первый if в get'e");
    res.render('userSelect', {foundUser: req.params.foundUser});
    } else {
    res.send('You are not authenticated');
    }
});



// Обработка несуществующих страниц
app.get('/:something', (req, res) => {
  res.send('No such page was found');
});


const PORT = 3000;
//запуск сервера
app.listen(PORT, ()=> {
    console.log(`Server started: http://localhost:${PORT}`)
});