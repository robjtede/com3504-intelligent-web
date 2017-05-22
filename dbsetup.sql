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
