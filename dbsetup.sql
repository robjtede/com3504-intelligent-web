DROP DATABASE IF EXISTS `com3504assignment`;
CREATE DATABASE com3504assignment;
USE com3504assignment;

DROP TABLE IF EXISTS `tweets`;
CREATE TABLE `tweets` (
  `Tweet_ID` BIGINT(20) NOT NULL,
  `Author` VARCHAR(255) NOT NULL,
  `Datetime` DATETIME NOT NULL,
  `Content` TEXT NOT NULL
) DEFAULT CHARSET=UTF8MB4;

CREATE UNIQUE INDEX tweets_uid ON tweets (Tweet_ID);
