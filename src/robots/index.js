const CancelLiveStreamRobot = require('./logics/CancelLiveStreamRobot');
const UpdateProductCountRobot = require('./logics/UpdateProductCountRobot');
const UpdateStreamCountRobot = require('./logics/UpdateStreamCountRobot');
// const TranslateProductsRobot = require('./logics/TranslateProductsRobot');

const robots = [
  new CancelLiveStreamRobot(),
  // new UpdateProductCountRobot(),
  // new UpdateStreamCountRobot(),
  // new TranslateProductsRobot(),
];
function startRobots() {
  robots.forEach((robot) => {
    robot.start();
  });
}

module.exports = {
  startRobots,
};
