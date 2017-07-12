(function(){
  const superagentGet = ( urlPath, formDataSerialized, callback ) => {
    const request = superagent('GET', urlPath);
    request.query(formDataSerialized);
    request.timeout(3000);
    // NOTE: Disable error on HTTP 4xx or 5xx. This means:
    // - `networkError` will only be populated if `resonse.text` is falsey
    // - Only one of `networkError` or `response` will be set in the callback, never both.
    request.ok( response => Boolean(response && response.text) );
    request.end(( networkError, response ) => {
      // No `networkError` or `response`. This should not happen. Report unexpected error.
      if ( !networkError && !response ) {
        callback('Unknown error: Neither `networkError` nor `response` provided');
        return;
      }
      // Network error and no response. Log the network error.
      if ( networkError ) {
        const errorDetails = {
          name: networkError.name,
          message: networkError.message,
          stack: networkError.stack.split('\n'),
        };
        callback(errorDetails);
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
          callback( responseTextParsed );
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
          callback( errorDetails );
          return;
        }
        // No valid json or `response.error`. This should not happen. Report unexpected error.
        callback('Unknown error: Invalid JSON and no `response.error` provided.');
        return;
      }
      // <4xx status code, assume success. Pass the response through.
      // We expect `responseTextParsed` to be valid, but fallback to `response.text` in edge cases ( html / xml )
      callback( responseTextParsed || response.text );
      return;
    });
  }
  const superagentPost = ( urlPath, formDataSerialized, callback ) => {
    const request = superagent('POST', urlPath);
    request.send(formDataSerialized);
    request.end(( error, response ) => {
      callback(response.body || response.text);
    });
  }
  const superagentPut = ( urlPath, formDataSerialized, callback ) => {
    const request = superagent('PUT', urlPath);
    request.send(formDataSerialized);
    request.end(( error, response ) => {
      callback(response.body || response.text);
    });
  }
  const superagentDelete = ( urlPath, formDataSerialized, callback ) => {
    const request = superagent('DELETE', urlPath);
    request.send(formDataSerialized);
    request.end(( error, response ) => {
      callback(response.body || response.text);
    });
  }
  const superagentMultipartPost = (urlPath, multiPartFormData, callback) => {
    const request = superagent('POST', urlPath);
    request.send(multiPartFormData);
    request.end(( error, response ) => {
      callback(response.body || response.text);
    });
  }

  window.run = () => {
    const getFormNode = document.querySelector('.ajaxGetForm');
    const postFormNode = document.querySelector('.ajaxPostForm');
    const putFormNode = document.querySelector('.ajaxPutForm');
    const deleteFormNode = document.querySelector('.ajaxDeleteForm');
    const multipartPostFormNode = document.querySelector('.ajaxMultipartPostForm');
    const apiProxyGetFormNode = document.querySelector('.apiProxyGetForm');
    const apiProxyPostFormNode = document.querySelector('.apiProxyPostForm');

    const apiErrorFormNode = document.querySelector('.apiErrorForm');
    const apiProxyErrorFormNode = document.querySelector('.apiProxyErrorForm');
    const apiRedirectFormNode = document.querySelector('.apiRedirectForm');
    const apiProxyRedirectFormNode = document.querySelector('.apiProxyRedirectForm');

    const iframeNode = document.querySelector('.iframe');

    const writeTextToIframe = (textOrObject) => {
      let outputText = textOrObject;
      if ( typeof textOrObject === 'object' ) {
        const jsonString = JSON.stringify( textOrObject, null, 2 );
        outputText = outputText = '<pre>' + jsonString + '</pre>';
      }
      const doc = iframeNode.contentWindow.document;
      doc.open();
      doc.write(outputText);
      doc.close();
    }

    getFormNode.addEventListener('submit', function(event) {
      event.preventDefault();
      const formDataSerialized = $(getFormNode).serialize();
      superagentGet( '/get', formDataSerialized, (responseTextOrObject) => {
        writeTextToIframe(responseTextOrObject);
      });
    });

    postFormNode.addEventListener('submit', function(event) {
      event.preventDefault();
      const formDataSerialized = $(postFormNode).serialize();
      superagentPost( '/post', formDataSerialized, (responseTextOrObject) => {
        writeTextToIframe(responseTextOrObject);
      });
    });

    putFormNode.addEventListener('submit', function(event) {
      event.preventDefault();
      const formDataSerialized = $(putFormNode).serialize();
      superagentPut( '/put', formDataSerialized, (responseTextOrObject) => {
        writeTextToIframe(responseTextOrObject);
      });
    });

    deleteFormNode.addEventListener('submit', function(event) {
      event.preventDefault();
      const formDataSerialized = $(deleteFormNode).serialize();
      superagentDelete( '/delete', formDataSerialized, (responseTextOrObject) => {
        writeTextToIframe(responseTextOrObject);
      });
    });

    multipartPostFormNode.addEventListener('submit', function(event) {
      event.preventDefault();
      const multiPartFormData = new FormData(multipartPostFormNode);
      superagentMultipartPost( '/post-multipart', multiPartFormData, (responseTextOrObject) => {
        writeTextToIframe(responseTextOrObject);
      });
    });

    apiProxyGetFormNode.addEventListener('submit', function(event) {
      event.preventDefault();
      const formDataSerialized = $(apiProxyGetFormNode).serialize();
      superagentGet( '/api-proxy-get', formDataSerialized, (responseTextOrObject) => {
        writeTextToIframe(responseTextOrObject);
      });
    });

    apiProxyPostFormNode.addEventListener('submit', function(event) {
      event.preventDefault();
      const formDataSerialized = $(apiProxyPostFormNode).serialize();
      superagentPost( '/api-proxy-post', formDataSerialized, (responseTextOrObject) => {
        writeTextToIframe(responseTextOrObject);
      });
    });

    apiErrorFormNode.addEventListener('submit', function(event) {
      event.preventDefault();
      const errorPath = $(apiErrorFormNode).find('input:checked').val();
      superagentGet( '/'+errorPath, {}, (responseTextOrObject) => {
        writeTextToIframe(responseTextOrObject);
      });
    });

    apiProxyErrorFormNode.addEventListener('submit', function(event) {
      event.preventDefault();
      const formDataSerialized = $(apiProxyErrorFormNode).serialize();
      superagentGet( '/api-proxy-get-error', formDataSerialized, (responseTextOrObject) => {
        writeTextToIframe(responseTextOrObject);
      });
    });

    apiRedirectFormNode.addEventListener('submit', function(event) {
      event.preventDefault();
      superagentGet( '/api-redirect', {}, (responseTextOrObject) => {
        writeTextToIframe(responseTextOrObject);
      });
    });

    apiProxyRedirectFormNode.addEventListener('submit', function(event) {
      event.preventDefault();
      superagentGet( '/api-proxy-redirect', {}, (responseTextOrObject) => {
        writeTextToIframe(responseTextOrObject);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', run);
})();