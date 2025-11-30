/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/ssr-apis/
 */

import React from 'react';

// Remove problematic preload hints that can cache 404s from CDN
export const onPreRenderHTML = ({ getHeadComponents, replaceHeadComponents }) => {
  const headComponents = getHeadComponents();

  // Filter out preload links for page-data JSON files
  const filteredComponents = headComponents.filter(component => {
    if (component.type === 'link' && component.props) {
      const { rel, href, as: asType } = component.props;
      // Remove preload hints for page-data JSON files
      if (rel === 'preload' && asType === 'fetch' && href && href.includes('page-data')) {
        return false;
      }
    }
    return true;
  });

  replaceHeadComponents(filteredComponents);
};

// Inject early error recovery script
export const onRenderBody = ({ setHeadComponents }) => {
  // Add script to head for fetch interception and image fallback
  setHeadComponents([
    <script
      key="cdn-fallback-early"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            var ORIGIN = 'https://aniketwebsiteblob.z30.web.core.windows.net';
            var retryCache = {};
            var originalFetch = window.fetch;
            
            // Fetch interceptor for JSON/page-data
            window.fetch = function(url, opts) {
              var urlStr = typeof url === 'string' ? url : url.toString();
              var isRetryable = urlStr.includes('page-data') || urlStr.endsWith('.json') || 
                                urlStr.endsWith('.pdf') || urlStr.endsWith('.gif');
              
              if (isRetryable && retryCache[urlStr]) {
                var path = new URL(urlStr, window.location.origin).pathname;
                return originalFetch(ORIGIN + path, Object.assign({}, opts, {mode: 'cors', cache: 'no-store'}));
              }
              
              return originalFetch(url, opts).then(function(response) {
                if (response.status === 404 && isRetryable) {
                  retryCache[urlStr] = true;
                  var path = new URL(urlStr, window.location.origin).pathname;
                  return originalFetch(ORIGIN + path, Object.assign({}, opts, {mode: 'cors', cache: 'no-store'}));
                }
                return response;
              }).catch(function(err) {
                if (isRetryable) {
                  retryCache[urlStr] = true;
                  var path = new URL(urlStr, window.location.origin).pathname;
                  return originalFetch(ORIGIN + path, Object.assign({}, opts, {mode: 'cors', cache: 'no-store'}));
                }
                throw err;
              });
            };
            
            // Image error handler - retry from origin on 404
            window.addEventListener('error', function(e) {
              var target = e.target;
              if (target.tagName === 'IMG' && !target.dataset.retried) {
                target.dataset.retried = 'true';
                var src = target.src;
                if (src.includes(window.location.host)) {
                  var path = new URL(src).pathname;
                  target.src = ORIGIN + path;
                }
              }
            }, true);
            
            // Handle resume/PDF link clicks with fallback
            document.addEventListener('click', function(e) {
              var link = e.target.closest('a[href$=".pdf"]');
              if (link && link.href.includes(window.location.host)) {
                e.preventDefault();
                var path = new URL(link.href).pathname;
                // Try CDN first, fall back to origin
                fetch(link.href, {method: 'HEAD'}).then(function(res) {
                  if (res.ok) {
                    window.open(link.href, '_blank');
                  } else {
                    window.open(ORIGIN + path, '_blank');
                  }
                }).catch(function() {
                  window.open(ORIGIN + path, '_blank');
                });
              }
            });
            
            // Store origin for other scripts
            window.__CDN_ORIGIN__ = ORIGIN;
          })();
        `,
      }}
    />,
  ]);
};
