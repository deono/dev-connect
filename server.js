const express = require('express');
const connectDB = require('./config/db');

const app = express();

// connect the database
connectDB();

// init middleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API Running'));

// define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

// look for PORT environment varialble or set to port 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`>>>> [DEV-CONNECT SERVER] listening on port ${PORT}...`)
);
