import cors from 'cors';
import express, { type Express } from 'express';

const app: Express = express();

// Set the application to trust the reverse proxy
app.set('trust proxy', true);

// Middlewares
// app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/events', (req, res) => {
  // Set headers to keep the connection alive and tell the client we're sending event-stream data
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send an initial message
  res.write(`data: Connected to server\n\n`);

  // Simulate sending updates from the server
  let counter = 5;

  const intervalId = setInterval(() => {
    const date = new Date();
    if (counter > 0) {
      res.write(`event: CustomEvent\n`);
      res.write(`data: {"time": "${date.toLocaleTimeString()}"}\n\n`);
    } else {
      // Send a closing event to signify the end of the stream
      res.write(`event: Close\n`);
      res.write(`data: Stream Ended\n\n`);

      clearInterval(intervalId);
    }
    counter--;
  }, 1000);

  // When client closes connection, stop sending events
  req.on('close', () => {
    console.log(';; sse-closed')
    clearInterval(intervalId);
    res.end();
  });

});


// Routes
// app.use('/health-check', healthCheckRouter);
app.get('/ping', (req, res) => {
  res.send('Hello World ' + new Date().toISOString());
});
app.use(express.static('build'));

// app.use(errorHandler());

export { app };

app.set('port', process.env.PORT || 9000);

app.listen(app.get('port'), () => {
  console.log(
    '\n  🚀 api server is running at http://localhost:%d in %s mode',
    app.get('port'),
    app.get('env'),
  );
  console.log('\n  Press CTRL-C to stop\n');
});
