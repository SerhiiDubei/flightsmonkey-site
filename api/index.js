'use strict';
// Vercel serverless entry point: every request that does not match a static file in /public
// is rewritten here (see vercel.json) and handled by the same Express app used locally.
module.exports = require('../server.js');
