DROP DATABASE IF EXISTS `com3504assignment_bcsdre`;
CREATE DATABASE com3504assignment_bcsdre;
USE com3504assignment_bcsdre;


SET NAMES utf8mb4;
ALTER DATABASE com3504assignment_bcsdre CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tweets`;
CREATE TABLE `tweets` (
  `tweet_id` BIGINT(20) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `datetime` DATETIME NOT NULL,
  `content` TEXT NOT NULL
) DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `searches`;
CREATE TABLE `searches` (
  `id` INT  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `player` TEXT,
  `team` TEXT,
  `author` TEXT,
  `lastId` BIGINT(20) DEFAULT '0',
  `mode` VARCHAR(5) NOT NULL DEFAULT 'AND'
) DEFAULT CHARSET=utf8mb4;

CREATE UNIQUE INDEX tweets_uid ON tweets (Tweet_ID);
