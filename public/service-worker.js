// Set a name for the current cache
var cacheName = 'v1';

// Default files to always cache
var cacheFiles = [
    '/',
    '/index.html',
    '/assets/favicon.ico',
    '/script.js',
    '/styles.css',
    '/assets/close.svg',
    '/assets/logo.svg',
    '/assets/logo-text.svg',
    '/assets/guide.png',
    '/manifest.webmanifest',
    '/assets/splash/manifest-icon-192.png',
    '/assets/splash/manifest-icon-512.png'
]

self.addEventListener('install', function (e) {
    // e.waitUntil Delays the event until the Promise is resolved
    e.waitUntil(

        // Open the cache
        caches.open(cacheName).then(function (cache) {

            // Add all the default files to the cache
            return cache.addAll(cacheFiles);
        })
    ); // end e.waitUntil
});


self.addEventListener('activate', function (e) {

    e.waitUntil(

        // Get all the cache keys (cacheName)
        caches.keys().then(function (cacheNames) {
            return Promise.all(cacheNames.map(function (thisCacheName) {

                // If a cached item is saved under a previous cacheName
                if (thisCacheName !== cacheName) {

                    // Delete that cached file
                    return caches.delete(thisCacheName);
                }
            }));
        })
    ); // end e.waitUntil

});


self.addEventListener('fetch', function (e) {

    // Analytics, fonts should not be cached
    if (e.request.url.includes('__') || e.request.url.includes('googletagmanager') || e.request.url.includes('google-analytics') || e.request.url.includes('fonts.gstatic.com')) {
        return false;
    }

    // e.respondWidth Responds to the fetch event
    e.respondWith(

        // Check in cache for the request being made
        caches.match(e.request)


            .then(function (response) {

                // If the request is in the cache
                if (response) {
                    // Return the cached version
                    return response;
                }

                // If the request is NOT in the cache, fetch and cache

                var requestClone = e.request.clone();
                fetch(requestClone)
                    .then(function (response) {

                        if (!response) {
                            return response;
                        }

                        var responseClone = response.clone();

                        //  Open the cache
                        caches.open(cacheName).then(function (cache) {

                            // Put the fetched response in the cache
                            cache.put(e.request, responseClone);

                            // Return the response
                            return response;

                        }); // end caches.open

                    })
                    .catch(function (err) {
                        console.log('[ServiceWorker] Error Fetching & Caching New Data', err);
                    });


            }) // end caches.match(e.request)
    ); // end e.respondWith
});
