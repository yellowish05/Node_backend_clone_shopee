/* eslint-disable no-shadow */
const { createLogger, format, transports } = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');
const { logs } = require('./index');

const {
  combine, timestamp, label, printf,
} = format;

const myFormat = printf(({
  level, message, label, timestamp,
}) => `${timestamp} ${label} ${level}: ${message}`);


let transport = null;
if (logs.cloudWatchEnabled) {
  transport =  new WinstonCloudWatch({
    name: logs.name,
    logGroupName: 'api',
    logStreamName: 'api',
    awsRegion: 'eu-central-1'
  })
} else {
  transport = new transports.Console();
}

module.exports = createLogger({
  level: logs.level,
  format: combine(
    label({ label: '['+logs.name+']' }),
    timestamp(),
    myFormat,
  ),
  transports: [
    transport
  ],
});