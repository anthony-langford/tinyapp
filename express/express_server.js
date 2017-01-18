const express = require("express");
const server = express();
const jsonfile = require('jsonfile');
const debug = require('debug');
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

const bodyParser = require("body-parser");
server.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
server.use(cookieParser());

server.set("view engine", "ejs");
server.use(express.static("public"));

let users = {
  "userRandomID": {id: "userRandomID", email: "user@example.com", password: "unicorns"},
  "user2RandomID": {id: "user2RandomID", email: "user2@example.com", password: "ligers"}
}

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
};

server.listen(8080, function() {
  console.log("Server started");
});

server.get("/", (request, response) => {
  let templateVars = {username: request.cookies["username"]};
  response.render("homepage", templateVars);
});

server.get("/login", (request, response) => {
  let templateVars = {username: request.cookies["username"]};
  response.render("login", templateVars);
});

server.post("/login", (request, response) => {
  response.cookie("username", request.body.username, {maxAge: 864000});
  response.redirect("/");
});

server.get("/register", (request, response) => {
  let templateVars = {userList: users};
  response.render("register", templateVars);
});

server.post("/register", (request, response) => {
  if (!request.body.email || !request.body.password) {
    response.status(400).send('Sorry! You need to provide both an email and a password.');
    return;
  }
  for (let user in users) {
    if (users[user].email === request.body.email) {
      response.status(400).send('Sorry! That email address has already been registered. If you think this is a mistake, please contact us somehow.');
      return;
    };
  };
  let userid = generateRandomString();
  users[userid] = {id: userid, email: request.body.email, password: request.body.password};
  response.cookie(userid, request.body.username, {maxAge: 864000});
  response.redirect("/");
});

server.post("/logout", (request, response) => {
  response.clearCookie("username");
  response.redirect("/");
});

server.get("/urls", (request, response) => {
  let templateVars = {urls: urlDatabase,
                      username: request.cookies["username"]};
  response.render("index", templateVars);
});

server.get("/urls/new", (request, response) => {
  let templateVars = {username: request.cookies["username"]};
  response.render("urls_new", templateVars);
});

server.post("/urls", (request, response) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = request.body.longURL;
  // const data = {
  //   shortURL: request.body.longURL
  // }
  // jsonfile.writeFile(db_path, data, function() {
  //   res.redirect('/');
  // });
  response.redirect("/urls/" + shortURL);
});

server.get("/urls/:id", (request, response) => {
  let templateVars = {shortURL: request.params.id,
                      urls: urlDatabase,
                      username: request.cookies["username"]};
  response.render("urls_show", templateVars);
});

server.get("/u/:shortURL", (request, response) => {
  let longURL = urlDatabase[request.params.shortURL];
  response.redirect(longURL);
});

server.post("/urls/:id/delete", (request, response) => {
  delete urlDatabase[request.params.id];
  response.redirect("/urls");
});

server.post("/urls/:id/update", (request, response) => {
  urlDatabase[request.params.id] = request.body.newLongURL;
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
