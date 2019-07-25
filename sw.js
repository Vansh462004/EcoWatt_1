const CACHE = 'network-or-cache';

self.addEventListener('install', evt => {
    evt.waitUntil(precache());
});

self.addEventListener('fetch', evt => {
    evt.respondWith(
        fromNetwork(evt.request, 400).catch(() => fromCache(evt.request)),
    );
});

function precache() {
    return caches
        .open(CACHE)
        .then(cache =>
            cache.addAll([
                './',
                'index.html',
                'style.css',
                'js/chart.js',
                'microwave.csv',
                'copier.csv',
                'fridge.csv',
                'fa/css/font-awesome.min.css',
                'fa/fonts/fontawesome-webfont.eot',
                'fa/fonts/fontawesome-webfont.svg',
                'fa/fonts/fontawesome-webfont.ttf',
                'fa/fonts/fontawesome-webfont.woff',
                'fa/fonts/FontAwesome.otf',
            ]),
        );
}

/**
 * @param {RequestInfo} request
 * @param {number} timeout
 * @returns {Promise<Response>}
 */
function fromNetwork(request, timeout) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(reject, timeout);
        fetch(request).then(response => {
            clearTimeout(timeoutId);
            resolve(response);
        }, reject);
    });
}

/**
 * @param {RequestInfo} request
 */
function fromCache(request) {
    return caches
        .open(CACHE)
        .then(cache => cache.match(request))
        .then(matching => {
            if (matching) {
                return matching;
            } else {
                throw new Error('no-match');
            }
        });
}
