const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');


let passwordOfAdmin = "admin";
let passwordOfViewer = "viewer";

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
app.use(express.static('public'));
app.use(express.json());

// отслеживание (переход) главной страницы. Функция get позволяет отслеживать
// любые URL адреса (у меня здесь это / - главная страница).
app.get('/', (req, res) => { // req - запрашиваемый маршрут и т.д.( то что в кавычках)
    // вывод текста
    res.render('index');
});

// валидация данных в регистрации (ПОТОМ СДЕЛАТЬ HTML странички вместо недоступной alert)!!!
app.post('/validation', (req, res) => {
  if(/^[a-zA-Z-.]+@[a-z]+\.[a-z]{2,3}$/.test(req.body.email)
      && /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).*$/.test(req.body.password)
      && /^[a-zA-Z][a-zA-Z0-9-_\.]{1,20}$/.test(req.body.login)
      && req.body.password == req.body.passwordAgain)
    {
      console.log("The data was entered correctly, registration completed successfilly!");
    } else
    {
      console.log('Error validation of data');
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
        if (result) {
          // атворизация успешна
          // Установка куки
          res.cookie('username', username, { maxAge: 2592000000, httpOnly: true });
          res.redirect('/' + username); // изменяет адрес на маршрут /foundUser
        } else {
          res.status(404).send('Error of login or password');
        }
      })
    } else {
      // Ошибка авторизации
      res.send('Authorization error');
    }
  })
})

app.get('/:foundUser', (req, res) => {
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