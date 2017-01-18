const express = require("express");
const server = express();

const jsonfile = require('jsonfile');
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

// server.get("*", function(request, response) {
//   response.cookie("pet", "cat", {maxAge: 86400000});
//   response.writeHead(200, {"Content-type": "text/html"});
//   response.write(JSON.stringify(request.cookies) + "<br/>\n");
//   response.end("Thanks");
// })

server.set("view engine", "ejs");
server.use(express.static("public"));


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
  response.render("homepage");
});

server.get("/login", (request, response) => {
  let userVars = {
    username: request.cookies["username"],
    // ... any other vars
  };
  response.render("login", userVars);
})

server.post("/login", (request, response) => {
  response.cookie("username", request.body.username, {maxAge: 864000});
  // response.writeHead(200, {"Content-type": "text/html"});
  // response.write(JSON.stringify(request.cookies) + "<br/>\n");
  response.redirect("/");
})

server.get("/urls.json", (request, response) => {
  response.json(urlDatabase);
});

server.get("/urls", (request, response) => {
  let userVars = {
    username: request.cookies["username"],
    // ... any other vars
  };
  let templateVars = {urls: urlDatabase};
  response.render("index", templateVars, userVars);
});

server.get("/urls/new", (request, response) => {
  response.render("urls_new", userVars);
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
  let userVars = {
    username: request.cookies["username"],
    // ... any other vars
  };
  let templateVars = {shortURL: request.params.id,
                      urls: urlDatabase};
  response.render("urls_show", templateVars, userVars);
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
