DROP DATABASE IF EXISTS `com3504assignment_bcsdre`;
CREATE DATABASE com3504assignment_bcsdre;
CREATE USER IF NOT EXISTS 'com3504assignment_bcsdre'@'localhost' IDENTIFIED BY 'com3504assignment_bcsdre';
GRANT ALL PRIVILEGES ON com3504assignment_bcsdre.* TO 'com3504assignment_bcsdre'@'localhost';
USE com3504assignment_bcsdre;


SET NAMES utf8mb4;
ALTER DATABASE team090 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tweets`;
DROP TABLE IF EXISTS `searches`;
CREATE TABLE `searches` (
  `id` INT  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `player` TEXT,
  `team` TEXT,
  `author` TEXT,
  `newestTweet` BIGINT(20) DEFAULT '0',
  `mode` VARCHAR(5) NOT NULL DEFAULT 'AND'
) DEFAULT CHARSET=utf8mb4;


CREATE TABLE `tweets` (
  `tweet_id` BIGINT(20) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `datetime` DATETIME NOT NULL,
  `content` TEXT NOT NULL,
  `searches_id` INT NOT NULL,
  FOREIGN KEY(`searches_id`) REFERENCES `searches`(`id`)
) DEFAULT CHARSET=utf8mb4;

CREATE UNIQUE INDEX tweets_uid ON tweets (Tweet_ID);

DROP TABLE IF EXISTS `players`;
CREATE TABLE `players` (
  `screen_name` VARCHAR(255) NOT NULL,
  `real_name` VARCHAR(255) NOT NULL
) DEFAULT CHARSET=utf8mb4;

# First team players...
# NOTE: Some players do not have entries in DBPedia, and therefore will not get results
# Manchester United (http://www.manutd.com/en/Players-And-Staff/First-Team.aspx):
INSERT INTO players (screen_name, real_name) VALUES ('D_DeGea', 'David De Gea');
INSERT INTO players (screen_name, real_name) VALUES ('ericbailly24', 'Eric Bailly');
INSERT INTO players (screen_name, real_name) VALUES ('PhilJones4', 'Phil Jones');
#INSERT INTO players (screen_name, real_name) VALUES ('NO ACCOUNT', 'Marcos Rojo');
INSERT INTO players (screen_name, real_name) VALUES ('paulpogba', 'Paul Pogba');
INSERT INTO players (screen_name, real_name) VALUES ('juanmata8', 'Juan Mata');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Zlatan Ibrahimovic');
INSERT INTO players (screen_name, real_name) VALUES ('WayneRooney', 'Wayne Rooney');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Anthony Martial');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Chris Smalling');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Jesse Lingard');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Adnan Januzaj');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Michael Carrick');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Daley Blind');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Ashley Young');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Marcus Rashford');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Sergio Romero');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Ander Herrera');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Henrikh Mkhitaryan');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Luke Shaw');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Timothy Fosu-Mensah');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Antonio Valencia');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Marouane Fellaini');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Sam Johnstone');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Demi Mitchell');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Matteo Darmian');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Axel Tuanzebe');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Scott McTominay');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Joel Castro Pereira');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Matty Willock');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Cameron Borthwick-Jackson');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Andreas Pereira');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Josh Harrop');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Angel Gomes');
INSERT INTO players (screen_name, real_name) VALUES ('', 'James Wilson');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Guillermo Varela');
# Chelsea FC (http://www.chelseafc.com/teams/first-team.html):
INSERT INTO players (screen_name, real_name) VALUES ('', 'Asmir Begovic');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Thibaut Courtois');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Eduardo Carvalho');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Ola Aina');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Nathan Ake');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Marcos Alonso');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Cesar Azpilicueta');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Gary Cahill');
INSERT INTO players (screen_name, real_name) VALUES ('', 'David Luiz');
INSERT INTO players (screen_name, real_name) VALUES ('', 'John Terry');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Kurt Zouma');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Nathaniel Chalobah');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Cesc Fabregas');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Eden Hazard');
INSERT INTO players (screen_name, real_name) VALUES ('', 'N\'Golo Kante');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Kenedy');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Ruben Loftus-Cheek');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Nemanja Matic');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Victor Moses');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Charly Musonda');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Pedro');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Willian');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Diego Costa');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Michy Batshuayi');
INSERT INTO players (screen_name, real_name) VALUES ('', 'Dominic Solanke');
