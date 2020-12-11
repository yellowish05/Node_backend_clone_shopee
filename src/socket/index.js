const path = require('path');
const SocketIOContextMiddleware = require(path.resolve('src/lib/SocketIOContextMiddleware'));
const EVENTS = require('./event.constants');

const bootstrapSocket = (io, repository) => {
  let _user;
  io.use(async (socket, next) => {
    const { user } = await SocketIOContextMiddleware(repository)(socket);
    if (user) {
      _user = user;
      next();
    } else {
      next(new Error('Authentication error!'));
    }
  })
  .on('connection', async socket => {
    socket.on(EVENTS.SKT_HEALTH, args => {
      console.log(`[${EVENTS.SKT_HEALTH}]`, args, _user._id)
    })

    socket.on('disconnecting', () => {
      console.log('disconnecting...')
    });

    socket.on('disconnect', () => {
      console.log('[disconnect]')
    });
  });
}

module.exports = {
  bootstrapSocket,
};
