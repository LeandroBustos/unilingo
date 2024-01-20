const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config');

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose;

module.exports = db
