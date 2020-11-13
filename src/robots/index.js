const CancelLiveStreamRobot = require('./logics/CancelLiveStreamRobot');

const robots = [
  new CancelLiveStreamRobot(),
];
function startRobots() {
  robots.forEach((robot) => {
    robot.start();
  });
}

module.exports = {
  startRobots,
};
