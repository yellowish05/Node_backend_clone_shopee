const http = require('http');
const app = require('./src/app');
const config = require('./config');

/**
 * Event listener for HTTP server "error" event.
 */
function generateOnErrorFn(usedPost) {
  return (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof usedPost === 'string'
      ? `Pipe ${usedPost}`
      : `Port ${usedPost}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  };
}

/**
 * Event listener for HTTP server "listening" event.
 */
function generateOnListeningFn(server) {
  return () => {
    const addr = server.address();
    const bind = typeof addr === 'string'
      ? `pipe ${addr}`
      : `port ${addr.port}`;
    console.log(`🚀 Listening on ${bind}`);
  };
}

/**
 * Create HTTPS servers.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(config.port);
server.on('error', generateOnErrorFn(config.port));
server.on('listening', generateOnListeningFn(server));
