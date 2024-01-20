const mongodb = require('./core/mongo').connection
const app = require('./app');
const { PORT } = require('./core/config');

const port = PORT

mongodb.on('error', (err) => {
  console.error(`MongoDB connection error: ${err}`);
  process.exit(-1);
});

mongodb.once('open', () => {
  console.log('MongoDB connected');
  app.listen(port, () => console.log('Server running on port: ', port))
});
