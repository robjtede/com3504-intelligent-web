COM3504 Assignment, Part 1
==========================
Ben Clegg, Sam Dickinson, and Rob Ede
Combined request server and webapp.

This server was developed on Node version 7.7.3, but is confirmed to work on
version 6.10+ (long term support).

We are using the following Node modules/packages:
- express (middleware web framework)
- pug (templating engine, to replace html)
- socket.io (event-based communication)
- mysql (database access)
- moment (time formatting)
- twit (Twitter api interface)
- http (HTTP server, required by Socket.io)

SETUP
=====

As we currently don't have access to our database (as mentioned in our email),
we have developed this system using locally hosted databases.
As such, this must be configured before using the application:

- Modify config.json with the correct credentials (username [user] and password [pass]), and the correct port. The database name should not be modified.
- Run the SQL script 'dbsetup.sql' by accessing your MySQL server (mysql -u USERNAME -p), and running the query 'source /PATH/../TO/../dbsetup.sql;' This configures the database and selects it.

RUNNING
=======
To use the application, run 'node app.js', and open 'localhost:3000' in your web browser.
