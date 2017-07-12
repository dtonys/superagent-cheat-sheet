# superagent-cheat-sheet

Superagent is a great HTTP client for both server and browser JS.

This repo performs the most common use cases with the Express server and a browser with simple javascript, serving as a reference for future use.

Typical use cases:

- Browser side AJAX calls
  - GET, POST, multipart POST, PUT, DELETE

- Server side calls
  - GET, POST, PUT, DELETE

- GET with redirect


Problem cases:

- Handling and logging errors
  - HTTP errors ( 404, 500, ... )
  - Network errors ( Timeout )
  - Internal server errors ( Server code syntax error )

- Parsing JSON response to native JS object, reliably

- Transferring the `Set-Cookie` headers from an external server to the browser.

![webapp](https://user-images.githubusercontent.com/899077/28143357-f9b11062-6719-11e7-8d95-53530e50d9f9.png)

