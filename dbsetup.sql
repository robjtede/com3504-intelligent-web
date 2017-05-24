DROP DATABASE IF EXISTS `com3504assignment_bcsdre`;
CREATE DATABASE com3504assignment_bcsdre;
CREATE USER IF NOT EXISTS 'com3504assignment_bcsdre'@'localhost' IDENTIFIED BY 'com3504assignment_bcsdre';
GRANT ALL PRIVILEGES ON com3504assignment_bcsdre.* TO 'com3504assignment_bcsdre'@'localhost';
USE com3504assignment_bcsdre;


SET NAMES utf8mb4;
ALTER DATABASE com3504assignment_bcsdre CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

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
  `local_id` BIGINT(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tweet_id` BIGINT(20) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `real_name` VARCHAR(255) NOT NULL,
  `avatar_url` TEXT,
  `datetime` DATETIME NOT NULL,
  `content` TEXT NOT NULL,
  `searches_id` INT NOT NULL,
  FOREIGN KEY(`searches_id`) REFERENCES `searches`(`id`)
) DEFAULT CHARSET=utf8mb4;

#CREATE UNIQUE INDEX tweets_uid ON tweets (Tweet_ID);

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
INSERT INTO players (screen_name, real_name) VALUES ('Ibra_official', 'Zlatan Ibrahimovic');
INSERT INTO players (screen_name, real_name) VALUES ('WayneRooney', 'Wayne Rooney');
INSERT INTO players (screen_name, real_name) VALUES ('AnthonyMartial', 'Anthony Martial');
INSERT INTO players (screen_name, real_name) VALUES ('ChrisSmalling', 'Chris Smalling');
INSERT INTO players (screen_name, real_name) VALUES ('JesseLingard', 'Jesse Lingard');
INSERT INTO players (screen_name, real_name) VALUES ('adnanjanuzaj', 'Adnan Januzaj');
INSERT INTO players (screen_name, real_name) VALUES ('carras16', 'Michael Carrick');
INSERT INTO players (screen_name, real_name) VALUES ('BlindDaley', 'Daley Blind');
INSERT INTO players (screen_name, real_name) VALUES ('youngy18', 'Ashley Young');
INSERT INTO players (screen_name, real_name) VALUES ('MarcusRashford', 'Marcus Rashford');
#INSERT INTO players (screen_name, real_name) VALUES ('NO ACCOUNT', 'Sergio Romero');
INSERT INTO players (screen_name, real_name) VALUES ('AnderHerrera', 'Ander Herrera');
INSERT INTO players (screen_name, real_name) VALUES ('HenrikhMkh', 'Henrikh Mkhitaryan');
INSERT INTO players (screen_name, real_name) VALUES ('LukeShaw23', 'Luke Shaw');
INSERT INTO players (screen_name, real_name) VALUES ('tfosumensah', 'Timothy Fosu-Mensah');
INSERT INTO players (screen_name, real_name) VALUES ('anto_v25', 'Antonio Valencia');
INSERT INTO players (screen_name, real_name) VALUES ('Fellaini', 'Marouane Fellaini');
INSERT INTO players (screen_name, real_name) VALUES ('samjohnstone50', 'Sam Johnstone');
INSERT INTO players (screen_name, real_name) VALUES ('demetrimitche11', 'Demetri Mitchell');
INSERT INTO players (screen_name, real_name) VALUES ('DarmianOfficial', 'Matteo Darmian');
#INSERT INTO players (screen_name, real_name) VALUES ('NO ACCOUNT', 'Axel Tuanzebe');
INSERT INTO players (screen_name, real_name) VALUES ('mctominay10', 'Scott McTominay');
INSERT INTO players (screen_name, real_name) VALUES ('ElgatoPereira1', 'Joel Castro Pereira');
INSERT INTO players (screen_name, real_name) VALUES ('mattywillock', 'Matty Willock');
#INSERT INTO players (screen_name, real_name) VALUES ('NO ACCOUNT', 'Cameron Borthwick-Jackson');
INSERT INTO players (screen_name, real_name) VALUES ('andrinhopereira', 'Andreas Pereira');
INSERT INTO players (screen_name, real_name) VALUES ('joshharrop23', 'Josh Harrop');
#INSERT INTO players (screen_name, real_name) VALUES ('NO ACCOUNT', 'Angel Gomes');
#INSERT INTO players (screen_name, real_name) VALUES ('NO ACCOUNT', 'James Wilson');
INSERT INTO players (screen_name, real_name) VALUES ('guille_varela4', 'Guillermo Varela');
# Chelsea FC (http://www.chelseafc.com/teams/first-team.html):
INSERT INTO players (screen_name, real_name) VALUES ('asmir1', 'Asmir Begovic');
INSERT INTO players (screen_name, real_name) VALUES ('thibautcourtois', 'Thibaut Courtois');
#INSERT INTO players (screen_name, real_name) VALUES ('NO ACCOUNT', 'Eduardo Carvalho');
INSERT INTO players (screen_name, real_name) VALUES ('Aina2Ola', 'Ola Aina');
INSERT INTO players (screen_name, real_name) VALUES ('NathanAke', 'Nathan Ake');
INSERT INTO players (screen_name, real_name) VALUES ('marcosalonso03', 'Marcos Alonso');
INSERT INTO players (screen_name, real_name) VALUES ('CesarAzpi', 'Cesar Azpilicueta');
INSERT INTO players (screen_name, real_name) VALUES ('GaryJCahill', 'Gary Cahill');
INSERT INTO players (screen_name, real_name) VALUES ('DavidLuiz_4', 'David Luiz');
#INSERT INTO players (screen_name, real_name) VALUES ('NO ACCOUNT', 'John Terry');
INSERT INTO players (screen_name, real_name) VALUES ('KurtZouma', 'Kurt Zouma');
INSERT INTO players (screen_name, real_name) VALUES ('chalobah', 'Nathaniel Chalobah');
INSERT INTO players (screen_name, real_name) VALUES ('cesc4official', 'Cesc Fabregas');
INSERT INTO players (screen_name, real_name) VALUES ('hazardeden10', 'Eden Hazard');
INSERT INTO players (screen_name, real_name) VALUES ('nglkante', 'N\'Golo Kante');
#INSERT INTO players (screen_name, real_name) VALUES ('NO ACCOUNT', 'Kenedy');
INSERT INTO players (screen_name, real_name) VALUES ('rubey_lcheek', 'Ruben Loftus-Cheek');
#INSERT INTO players (screen_name, real_name) VALUES ('NO ACCOUNT', 'Nemanja Matic');
INSERT INTO players (screen_name, real_name) VALUES ('VictorMoses', 'Victor Moses');
INSERT INTO players (screen_name, real_name) VALUES ('CharlyMusondajr', 'Charly Musonda');
INSERT INTO players (screen_name, real_name) VALUES ('_Pedro17_', 'Pedro Rodriguez');
INSERT INTO players (screen_name, real_name) VALUES ('willianborges88', 'Willian');
INSERT INTO players (screen_name, real_name) VALUES ('diegocosta', 'Diego Costa');
INSERT INTO players (screen_name, real_name) VALUES ('mbatshuayi', 'Michy Batshuayi');
#INSERT INTO players (screen_name, real_name) VALUES ('NO ACCOUNT', 'Dominic Solanke');

# Set screennames to lowercase
UPDATE players SET screen_name=LOWER(screen_name);
