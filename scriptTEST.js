const express = require('express'); // Using the express framework
const app = express();
require("dotenv").config(); // Get environment variables from .env file(s)
var sqlite3 = require('sqlite3').verbose()
const cors = require('cors');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');

const DBSOURCE = "usersdb.sqlite";
const auth = require("./middleware");

const port = 3004;

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    }
    else {
        var salt = bcrypt.genSaltSync(10);

        db.run(`CREATE TABLE Users (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Username text,
            Email text,
            Password text,
            Salt text,
            Token text,
            DateLoggedIn DATE,
            DateCreated DATE
            )`,
        (err) => {
            if (err) {
                // Table already created
            } else{
                // Table just created, creating some rows
                var insert = 'INSERT INTO Users (Username, Email, Password, Salt, DateCreated) VALUES (?,?,?,?,?)'
                db.run(insert, ["user1", "user1@example.com", bcrypt.hashSync("user1", salt), salt, Date('now')])
                db.run(insert, ["user2", "user2@example.com", bcrypt.hashSync("user2", salt), salt, Date('now')])
                db.run(insert, ["user3", "user3@example.com", bcrypt.hashSync("user3", salt), salt, Date('now')])
                db.run(insert, ["user4", "user4@example.com", bcrypt.hashSync("user4", salt), salt, Date('now')])
            }
        });
    }
});

app.use(
    express.urlencoded({extended: false}),
    cors({
        origin: 'http://localhost:3000'
    })
);


// L O G I N //
app.post("/api/login", async (req, res) => {

    try {
      const { Email, Password } = req.body;
          // Make sure there is an Email and Password in the request
          if (!(Email && Password)) {
              res.status(400).send("All input is required");
          }

          let user = [];

          var sql = "SELECT * FROM Users WHERE Email = ?";
          db.all(sql, Email, function(err, rows) {
              if (err){
                  res.status(400).json({"error": err.message})
                  return;
              }

              rows.forEach(function (row) {
                  user.push(row);
              })

              var PHash = bcrypt.hashSync(Password, user[0].Salt);

              if(PHash === user[0].Password) {
                  // * CREATE JWT TOKEN
                  const token = jwt.sign(
                      { user_id: user[0].Id, username: user[0].Username, Email },
                        process.env.TOKEN_KEY,
                      {
                        expiresIn: "1h", // 60s = 60 seconds - (60m = 60 minutes, 2h = 2 hours, 2d = 2 days)
                      }
                  );

                  user[0].Token = token;

              } else {
                  return res.status(400).send("No Match");
              }

             return res.status(200).send(user);
          });

      } catch (err) {
        console.log(err);
      }
  });

  app.get('/', (req, res) => { // req - запрашиваемый маршрут и т.д.( то что в кавычках)
    // вывод текста
    res.render('index')
});

  app.post('/check-user', (req, res) => {
    let username = req.body.username;
    if(username == "")
    {
      //переадресовываем пользователя на ...URL
        return res.redirect('/');
    } else {
        console.log(req.body);
        return res.redirect('/' + username);
    }
    })

    app.listen(port, () => console.log(`API listening on port http://localhost:${port}`));