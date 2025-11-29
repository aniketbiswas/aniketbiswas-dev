/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/ssr-apis/
 */

import React from 'react';

// Inject early error recovery script
export const onRenderBody = ({ setHeadComponents }) => {
  setHeadComponents([
    <script
      key="cdn-fallback-early"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            var ORIGIN = 'https://aniketwebsiteblob.z30.web.core.windows.net';
            var originalFetch = window.fetch;
            
            window.fetch = function(url, opts) {
              return originalFetch(url, opts).then(function(response) {
                if (response.status === 404 && typeof url === 'string' && 
                    (url.includes('page-data') || url.endsWith('.json'))) {
                  var path = new URL(url, window.location.origin).pathname;
                  return originalFetch(ORIGIN + path, Object.assign({}, opts, {mode: 'cors'}));
                }
                return response;
              }).catch(function(err) {
                if (typeof url === 'string' && (url.includes('page-data') || url.endsWith('.json'))) {
                  var path = new URL(url, window.location.origin).pathname;
                  return originalFetch(ORIGIN + path, Object.assign({}, opts, {mode: 'cors'}));
                }
                throw err;
              });
            };
          })();
        `,
      }}
    />,
  ]);
};
