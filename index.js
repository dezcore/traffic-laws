require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;
const googleRouter = require('./routes/google');
const openaiRouter = require('./routes/openai');
const trafficlawsRouter = require('./routes/index');

app.use(require('cors')())

app.use(bodyParser.json());

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get('/', (req, res) => {
  res.json({'message': 'ok'});
})

app.use('/trafficlaws', trafficlawsRouter);
app.use('/trafficlaws/openai', openaiRouter);
app.use('/trafficlaws/google', googleRouter);

/* Error handler middleware */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({'message': err.message});
  
  return;
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Example app listening at http://localhost:${port}`)
});