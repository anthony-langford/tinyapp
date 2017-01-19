const express = require("express");
const server = express();
const jsonfile = require('jsonfile');
const debug = require('debug');
const bcrypt = require('bcrypt');
const morgan = require('morgan');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');

// let db_path = './db.json';
// const db = jsonfile.readFileSync(db_path);

// server.use('/', require('./routes/index'));
// server.use('/users', require('./routes/users'));

// jsonfile.readFile(db_path, function(err, obj) {
//   console.dir(obj);
// })

// jsonfile.writeFile(db_path, data, function() {
//   res.redirect('/');
// });


server.set("view engine", "ejs");

server.use(bodyParser.urlencoded({extended: true}));

server.use(cookieSession({
  name: 'session',
  keys: ['secretpassword'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

server.use(express.static("public"));

server.use(morgan('dev'))

server.listen(8080, function() {
  console.log("Server started");
});



let users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "unicorns",
    links: {
      "b2xVn2": "http://www.lighthouselabs.ca",
      "9sm5xK": "http://www.google.com"
    }
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "ligers",
    links: {
      "8sm3k9": "http://www.reddit.com",
      "j30si5": "http://wwwimdb.com"
    }
  }
}

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
};



// routes

server.get("/", (request, response) => {

  let templateVars = {
    user_id: request.session.user_id,
    email: users[request.session.user_id] && users[request.session.user_id].email
  };

  response.render("homepage", templateVars);
});

server.get("/login", (request, response) => {
  let templateVars = {user_id: request.session.user_id};
  response.render("login", templateVars);
});

server.post("/login", (request, response) => {
  const email = request.body.email;
  const password = request.body.password;

  // find user by email
  for (let user in users) {
    if (users[user].email === email) {
      // check the password
      bcrypt.compare(password, users[user].password, (err, matched) => {

        if (matched) {
          // set a cookie
          // response.cookie('user_id', user.username, {signed: true});
          request.session.user_id = users[user].id;
          response.redirect("/");
          return;

        } else {
          response.status(403).send('Sorry! The password you entered was incorrect.');
          response.redirect("/login");
          return;
        }
      });
      return;
    }
  }
  response.status(403).send('Sorry! Your email hasn\'t been registered yet.');
});

server.get("/register", (request, response) => {
  let templateVars = {
    userList: users,
    user_id: request.session.user_id,
    email: users[request.session.user_id] && users[request.session.user_id].email
  };
  response.render("register", templateVars);
});

server.post("/register", (request, response) => {
  // check if email and password are provided, and if email is free to register
  if (!request.body.email || !request.body.password) {
    response.status(400).send('Sorry! You need to provide both an email and a password.');
    return;
  }

  for (let user in users) {
    if (users[user].email === request.body.email) {
      response.status(400).send('Sorry! That email address has already been registered. If you think this is a mistake, please contact us somehow.');
      return;
    }
  }

  const password = request.body.password;
  let hashed_password;
  const user_id = generateRandomString();

  // hash the password and update database
  bcrypt.hash(password, 10, (err, hash) => {

    if (err) {
      response.send('There was an error creating your account.')
      return;
    }

    hashed_password = hash;
    users[user_id] = {
      id: user_id,
      email: request.body.email,
      password: hashed_password,
      links: {}
    };
  });

  request.session.user_id = user_id;
  response.redirect("/");
});

server.get("/logout", (request, response) => {
  request.session = null; // delete cookie
  response.redirect("/");
});

server.get("/urls", (request, response) => {
  let templateVars = {
    data: users,
    user_id: request.session.user_id,
    email: users[request.session.user_id] && users[request.session.user_id].email
  };
  response.render("index", templateVars);
});

server.get("/urls/new", (request, response) => {
  let templateVars = {
    user_id: request.session.user_id,
    email: users[request.session.user_id] && users[request.session.user_id].email
  };
  response.render("urls_new", templateVars);
});

server.post("/urls", (request, response) => {
  let shortURL = generateRandomString();
  // urlDatabase[shortURL] = request.body.longURL;
  users[request.session.user_id].links[shortURL] = request.body.longURL;
  response.redirect("/urls/" + shortURL);
});

server.get("/urls/:id", (request, response) => {
  let templateVars = {
    shortURL: request.params.id,
    data: users,
    email: users[request.session.user_id] && users[request.session.user_id].email,
    user_id: request.session.user_id
  };
  response.render("urls_show", templateVars);
});

server.get("/u/:shortURL", (request, response) => {
  let longURL = users[request.session.user_id].links[request.params.shortURL];
  response.redirect(longURL);
});

server.post("/urls/:id/delete", (request, response) => {
  delete users[request.session.user_id].links[request.params.id];
  response.redirect("/urls");
});

server.post("/urls/:id/update", (request, response) => {
  users[request.session.user_id].links[request.params.id] = request.body.newLongURL;
  response.redirect("/urls");
});







// middleware, just like get and post. get and post also technically receive next but they respond to the server so they don't need to pass it on
// server.use(function(request, response, next) {
//   console.log('A new request has come in...');
//   next();
//   response.send(response);
// });

// add middleware function at the end to check if the route was found. if not, redirect to error page. can also send html instead of plaintext
// server.use(function(request, response, next) {
//   response.status(404).send('Sorry the page was not found');
// });


// // create another route where you can input a person's name - anything after the / is set to 'name'
// server.get("/:name", function(request, response) {
//   response.render("index", {name: request.params.name,
//                             colors: ["red", "green"],
//                             showMoon: true})
//   response.send(request.params.name)
// })
