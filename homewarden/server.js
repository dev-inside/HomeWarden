import express from 'express';
import { createCollections } from './scrape.js';
import { join } from 'path';
import { watch } from 'fs';
import compression from 'compression';
import nj from 'nunjucks';
import config from "../custom/config.toml";

const env = new nj.Environment(new nj.FileSystemLoader(join(process.cwd(), 'homewarden/view')), {
    autoescape: true,
    trimBlocks: true, 
    lstripBlocks: true
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression({
    type: "br"
    }));
app.use('/.cache', express.static(join(process.cwd(), '.cache')));
app.use('/custom', express.static(join(process.cwd(), 'custom')));
app.use('/selfhst-icons', express.static(join(process.cwd(), 'selfhst-icons')));
app.use('/homewarden', express.static(join(process.cwd(), 'homewarden')));
app.use('/fonts', express.static(join(process.cwd(), 'node_modules/@fontsource-variable/figtree')));

let collectionsCache = null;

async function getCollections() {
    if (!collectionsCache || Date.now() - collectionsCache.timestamp >= config.REFRESH_INTERVAL * 1000) {
        console.log('Generating fresh collections data');
        const freshCollections = await createCollections();
        collectionsCache = { 
            data: freshCollections.data,
            timestamp: freshCollections.timestamp
        };
    } else {
        console.log('Using cached collections data');
    }
    return collectionsCache.data;
}

app.get('/api/collections', async (req, res) => {
    try {
        const collections = await getCollections();
        res.json(collections);
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/', async (req, res) => {
    try {
        const collections = await getCollections();
        const templatePath = join(process.cwd(), 'homewarden/view', 'template.html');
        const templateContent = await Bun.file(templatePath).text();
        const renderedHtml = await env.renderString(templateContent, { data: collections });
        res.send(renderedHtml);
    } catch (error) {
        console.error('Error rendering the main page:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/api/refresh', async (req, res) => {
    try {
        console.log('Rebuilding collections...');
        await createCollections();
        collectionsCache = null; 
        console.log('Collections rebuilt successfully.');
        res.status(200).send('Collections have been rebuilt successfully.');
    } catch (error) {
        console.error('Error rebuilding collections:', error);
        res.status(500).send('Internal Server Error');
    }
});

const watchDirectory = join(process.cwd(), 'homewarden/view');
watch(watchDirectory, { recursive: true }, async (eventType, fileName) => {
    console.log(`Detected ${eventType} in ${fileName}`);
    try {
        console.log('Rebuilding collections due to file change...');
        await createCollections();
        collectionsCache = null;
        console.log('Collections rebuilt successfully.');
    } catch (error) {
        console.error('Error rebuilding collections:', error);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
