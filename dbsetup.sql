DROP DATABASE IF EXISTS `com3504assignment`;
CREATE DATABASE com3504assignment;
USE com3504assignment;

DROP TABLE IF EXISTS `tweets`;
CREATE TABLE `tweets` (
  `Tweet_ID` INT(11) NOT NULL,
  `Author` VARCHAR(255) NOT NULL,
  `Datetime` DATE NOT NULL,
  `Content` VARCHAR(255) NOT NULL
) DEFAULT CHARSET=utf8;

CREATE UNIQUE INDEX tweets_uid ON tweets (Tweet_ID);
