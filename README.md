COM3504 Assignment - Team 090
=============================

[Ben Clegg](https://github.com/BenClegg), [Sam Dickinson](https://github.com/coa12sd), and [Rob Ede](https://github.com/robjtede)

Combined request server and webapp, plus Cordova hybrid mobile app client.

This server runs on Node v0.12.4 and above.

We are using the following Node modules/packages:

- express (middleware-based web framework)
- pug (templating engine, to replace html)
- socket.io (event-based communication)
- mysql (database access)
- moment (time formatting)
- twit (Twitter api interface)
- any-promise + bluebird (promise library)

SETUP
=====
A custom database and Twitter client can be configured by editing the server's
`config.json` accordingly, yet these are already configured with our own
credentials.

The database schema is `databaseschema/dbsetup.sql`

RUNNING
=======
To use the application, run `npm install` to make sure all packages are
installed then `npm start` or `node app.js`, and open `localhost:3000` in your
web browser.

The server must be running for the Cordova app to function.
