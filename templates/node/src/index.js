'use strict';

const express = require('express');

const app = express();
const PORT = process.env.PORT || {{SERVICE_PORT}};

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: '{{SERVICE_NAME}}' });
});

app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to {{SERVICE_NAME}}' });
});

const server = app.listen(PORT, () => {
  console.log(`{{SERVICE_NAME}} listening on port ${PORT}`);
});

module.exports = { app, server };
