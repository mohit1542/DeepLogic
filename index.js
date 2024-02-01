const http = require('http');
const https = require('https');

const PORT = 3000;
const TIME_URL = 'https://time.com';

const server = http.createServer((req, res) => {
    if (req.url === '/getTimeStories') {
        fetchTopStories().then(topStories => respondJSON(res, topStories))
            .catch(error => respondError(res, 'Failed to fetch top stories'));
    } else {
        respondNotFound(res);
    }
});

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}/`);
});

async function fetchTopStories() {
    try {
        const html = await fetchData(TIME_URL);
        return extractTopStories(html);
    } catch (error) {
        throw error;
    }
}

function fetchData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, responsedata => {
            let data = '';
            responsedata.on('data', chunk => (data += chunk));
            responsedata.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function extractTopStories(html) {
    const topStories = [];
    const startIndex = html.indexOf('<h2 class="latest-stories__heading">Latest Stories</h2>');
    const endIndex = html.indexOf('</ul>', startIndex);
    const HTMLsection = html.substring(startIndex, endIndex + 5);

    const storyRegex = /<li class="latest-stories__item">([\s\S]*?)<\/li>/g;
    let match;

    while ((match = storyRegex.exec(HTMLsection)) !== null && topStories.length < 6) {
        const [, storyHTML] = match;
        const [, title] = /<h3 class="latest-stories__item-headline">([^<]*)<\/h3>/g.exec(storyHTML) || [];
        const [, relativeLink] = /<a href="([^"]*)">/g.exec(storyHTML) || [];
        const link = relativeLink ? resolveRelativeURL(TIME_URL, relativeLink) : relativeLink;

        if (title && link) {
            topStories.push({ title: title.trim(), link });
        }
    }

    return topStories;
}

function respondJSON(res, data) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
}

function respondError(res, message) {
    console.error('Error:', message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(message);
}

function respondNotFound(res) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Data Not Found');
}

function resolveRelativeURL(baseUrl, relativeUrl) {
    return new URL(relativeUrl, baseUrl).href;
}
