const express = require("express");
const debug = require('debug');
const bcrypt = require('bcrypt');
const morgan = require('morgan');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const server = express();



server.set("view engine", "ejs");

server.use(bodyParser.urlencoded({extended: true}));

server.use(cookieSession({
  name: 'session',
  keys: ['secretpassword', 'evenmoresecretpassword'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

server.use(express.static("public"));

server.use(morgan('dev'));

server.use(methodOverride('_method'));

server.listen(8080, function() {
  console.log("Server started");
});



let users = {
  "ieatbutts": {
    id: "userRandomID",
    email: "user@example.com",
    password: "unicorns",
    links: {
      "b2xVn2": "http://www.lighthouselabs.ca",
      "9sm5xK": "http://www.google.com"
    },
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "ligers",
    links: {
      "8sm3k9": "http://www.reddit.com",
      "j30si5": "http://www.imdb.com"
    }
  }
}

let urlDatabase = [
  {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    ownerID: "ieatbutts"
  },
  {
    shortURL: "9sm5xK",
    longURL:"http://www.google.com",
    ownerID: "ieatbutts"
  },
  {
    shortURL: "8sm3k9",
    longURL: "http://www.reddit.com",
    ownerID: "user2RandomID"
  },
  {
    shortURL: "j30si5",
    longURL: "http://www.imdb.com",
    ownerID: "user2RandomID"
  }
]

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
};



// routes

server.get("/", (request, response) => {
  if (request.session.user_id) {
    response.redirect("/urls");
  } else {
    response.redirect("/login")
  }
});

server.get("/login", (request, response) => {
  let templateVars = {user_id: request.session.user_id};

  if (request.session.user_id) {
    response.redirect("/");
  }

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
          request.session.user_id = users[user].id;
          response.redirect("/");
          return;

        } else {
          response.status(401).redirect("/login");
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
    data: users,
    user_id: request.session.user_id,
    email: users[request.session.user_id] && users[request.session.user_id].email
  };

  if (request.session.user_id) {
    response.redirect("/");
  }

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

    request.session.user_id = user_id;
    response.redirect("/");
  });
});

server.post("/logout", (request, response) => {
  request.session = null; // delete cookie
  response.redirect("/");
});

server.get("/urls", (request, response) => {
  if (!request.session.user_id) {
    response.status(401);
  }
  let templateVars = {
    data: users,
    user_id: request.session.user_id,
    email: users[request.session.user_id] && users[request.session.user_id].email
  };
  response.render("index", templateVars);
});

server.get("/urls/new", (request, response) => {
  if (!request.session.user_id) {
    response.status(401);
  }
  let templateVars = {
    user_id: request.session.user_id,
    email: users[request.session.user_id] && users[request.session.user_id].email
  };
  response.render("urls_new", templateVars);
});

server.post("/urls", (request, response) => {
  let shortURL = generateRandomString();
  users[request.session.user_id].links[shortURL] = request.body.longURL;
  urlDatabase.push({
    shortURL: shortURL,
    longURL: request.body.longURL,
    ownerID: request.session.user_id
  });
  response.redirect("/urls/" + shortURL);
});

server.get("/urls/:id", (request, response) => {
  let templateVars = {
    shortURL: request.params.id,
    data: users,
    email: users[request.session.user_id] && users[request.session.user_id].email,
    user_id: request.session.user_id
  };
  let urlExists = false;

  urlDatabase.forEach(function(url) {
    if (url.shortURL === request.params.id) {
      urlExists = true;
    }
  });

  if (urlExists === false) {
    response.status(404).send("You're lost! I can't find this page.");
  } else if (!request.session.user_id) {
    response.status(401).render("login", templateVars);
  }

  let isOwner = false;
  urlDatabase.forEach(function(url) {
    if (url.ownerID === request.session.user_id) {
      isOwner = true;
      return;
    }
  });

  if (isOwner === false) {
      response.status(403).send("YOU SHALL NOT PASS! (You don't own this url)");
    }

  response.render("urls_show", templateVars);
});

server.get("/u/:shortURL", (request, response) => {
  let longURL = "";
  if (users[request.session.user_id].links[request.params.shortURL].slice(0, 7) === "http://") {
    longURL = users[request.session.user_id].links[request.params.shortURL];
  } else {
    longURL = "http://" + users[request.session.user_id].links[request.params.shortURL];
  }
  let urlExists = false;

  urlDatabase.forEach(function(url) {
    if (url.shortURL === request.params.shortURL) {
      urlExists = true;
      return;
    }
  });
  if (urlExists === false) {
    response.status(404).send("You're lost! I can't find this page.");
    return;
  }
  response.redirect(longURL);
});

server.delete("/urls/:id/", (request, response) => {
  delete users[request.session.user_id].links[request.params.id];
  response.redirect("/urls");
});

server.put("/urls/:id/", (request, response) => {
  let urlExists = false;

  urlDatabase.forEach(function(url) {
    if (url.shortURL === request.params.id) {
      urlExists = true;
      return;
    }
  });

  if (urlExists === false) {
    response.status(404).send("You're lost! I can't find this page.");
  } else if (!request.session.user_id) {
    response.status(401).render("login", templateVars);
  }

  let isOwner = false;
  urlDatabase.forEach(function(url) {
    if (url.ownerID === request.session.user_id) {
      isOwner = true;
      return;
    }
  });

  if (isOwner === false) {
      response.status(403).send("YOU SHALL NOT PASS! (You don't own this url)");
    }

  users[request.session.user_id].links[request.params.id] = request.body.newLongURL;
  response.redirect("/urls");
});

