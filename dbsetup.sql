DROP DATABASE IF EXISTS `com3504assignment`;
CREATE DATABASE com3504assignment;
USE com3504assignment;


SET NAMES utf8mb4;
ALTER DATABASE com3504assignment CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tweets`;
CREATE TABLE `tweets` (
  `tweet_id` BIGINT(20) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `datetime` DATETIME NOT NULL,
  `content` TEXT NOT NULL
) DEFAULT CHARSET=utf8mb4;

CREATE UNIQUE INDEX tweets_uid ON tweets (Tweet_ID);
