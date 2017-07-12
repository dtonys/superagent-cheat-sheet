const os = require('os');
const superagent = require('superagent');

// Express + API middleware
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const multer  = require('multer');

const cookie = require('cookie');

const SYSTEM_TMP_DIR = os.tmpdir();
const upload = multer({ dest: SYSTEM_TMP_DIR });

// API SERVER
const app = express();
app.use(compression()); // gzip compression
app.use(express.static('public'));  // static
app.use(cookieParser());  // Populate `req.cookies`.
app.use(bodyParser.json()); // parse `application/json`:
app.use(bodyParser.urlencoded({ extended: true })); // parse `application/x-www-form-urlencoded`:
app.use(methodOverride());  // Allow PUT and DELETE requests.

// Serve index.html
app.get('/', () => {
  res.send(fs.readFileSync('./public/index.html', 'utf8'));
});

// API to serve frontend
// GET
app.get('/get', (req, res) => {
  if( req.query['set-cookies'] ) {
    res.cookie('cookie-set-from-get', '1', );
  }
  const returnObject = {
    query: req.query,
    body: req.body,
    path: req.path,
  };
  res.json(returnObject);
});

// POST
app.post('/post', (req, res) => {
  if( req.body['set-cookies'] ) {
    res.cookie('cookie-set-from-post-1', '1');
    res.cookie('cookie-set-from-post-2', '1');
  }
  const returnObject = {
    query: req.query,
    body: req.body,
    path: req.path,
  };
  res.json(returnObject);
});

// PUT
app.put('/put', (req, res) => {
  const returnObject = {
    query: req.query,
    body: req.body,
    path: req.path,
  };
  res.json(returnObject);
});

// DELETE
app.delete('/delete', (req, res) => {
  const returnObject = {
    query: req.query,
    body: req.body,
    path: req.path,
  };
  res.json(returnObject);
});

// POST multipart/form-dataa
app.post('/post-multipart', upload.any(), (req, res) => {
  const returnObject = {
    query: req.query,
    body: req.body,
    path: req.path,
    files: req.files,
  };
  res.json(returnObject);
});

// Make requests to external API server or 3rd party
app.get('/api-proxy-get', (req, res) => {
  const request = superagent('GET', 'http://localhost:3000/get');
  request.query(req.query);
  request.end(( error, response ) => {
    res.json( response.body );
  });
});

app.post('/api-proxy-post', (req, res) => {
  const request = superagent('POST', 'http://localhost:3000/post');
  request.send(req.body);
  request.ok( response => Boolean(response && response.text) );  // NOTE: Disable error on HTTP 4xx or 5xx
  request.end(( error, response ) => {
    // NOTE: Set-Cookie headers have to be explicitely transferred over
    if( response.headers['set-cookie'] && response.headers['set-cookie'].length ) {
      response.headers['set-cookie'].forEach((setCookieHeader) => {
        res.append('Set-Cookie', setCookieHeader);
      });
    }
    res.json( response.body );
  });
});

app.get('/api-proxy-get-error', (req, res) => {
  const request = superagent('GET', 'http://localhost:3000/' + req.query.errorPath );
  request.send(req.body);
  // NOTE: Disable error on HTTP 4xx or 5xx. This means:
  // - `networkError` will only be populated if `resonse.text` is falsey
  // - Only one of `networkError` or `response` will be set in the callback, never both.
  request.ok( response => Boolean(response && response.text) );
  request.timeout(3000);
  request.end(( networkError, response ) => {
    // No `networkError` or `response`. This should not happen. Report unexpected error.
    if ( !networkError && !response ) {
      res.send('Unknown error: Neither `networkError` nor `response` provided');
      return;
    }
    // Network error and no response. Log the network error.
    if ( networkError ) {
      const errorDetails = {
        name: networkError.name,
        message: networkError.message,
        stack: networkError.stack.split('\n'),
      };
      res.status(500);
      res.json(errorDetails);
      return;
    }
    // Parse response text to JS object.  Relying on superagent's `request.body` can be error prone,
    // it may return `null` or `{}` on a failed body parse.
    let responseTextParsed = null;
    try {
      responseTextParsed = JSON.parse(response.text);
    }
    catch ( exception ) {}
    // >=4xx status code, something went wrong.
    if ( response.status >= 400 ) {
      // Server returned valid JSON, assume the server sent an error code intentionally. Pass the response through.
      if ( responseTextParsed ) {
        res.status( response.status );
        res.json( responseTextParsed );
        return;
      }
      // Server did not return valid JSON, assume unexpected error. Log the unexpected error.
      if ( response.error ) {
        const errorDetails = {
          name: response.error.name,
          message: response.error.message,
          stack: response.error.stack.split('\n'),
          responseText: response.text,
          responseStatus: response.status,
        };
        res.status( response.status );
        res.json( errorDetails );
        return;
      }
      // No valid json or `response.error`. This should not happen. Report unexpected error.
      res.send('Unknown error: Invalid JSON and no `response.error` provided.');
      return;
    }
    // <4xx status code, assume success. Pass the response through.
    // We expect `responseTextParsed` to be valid, but fallback to `response.text` in edge cases ( html / xml )
    res.status( response.status );
    res.send( responseTextParsed || response.text );
    return;
  });
});

app.get('/api-404-error', (req, res ) => {
  res.status(404);
  res.json({
    success: false,
    message: '404 - Not Found',
  });
});

app.get('/api-500-error', (req, res ) => {
  res.status(500);
  res.json({
    success: false,
    message: '500 - Internal Server error',
  });
});

app.get('/api-timeout-error', (req, res) => {
  // This triggers a HTTP timeout error
  setTimeout(() => {
    res.json({
      success: true,
      message: '10 Second Response',
    });
  }, 10000);
});

app.get('/api-internal-error', (req, res ) => {
  // This broken javascript triggers an internal server error
  !asdfadfs;
  res.json({
    success: true,
    message: 'Internal javascript error',
  });
});

app.get('/api-redirect', (req, res ) => {
  res.redirect('/get');
});

app.get('/api-proxy-redirect', (req, res) => {
  const request = superagent('GET', 'http://localhost:3000/api-redirect');
  request.end(( error, response ) => {
    res.json( response.body );
  });
});

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});

