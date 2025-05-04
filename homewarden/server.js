import { createCollections } from './scrape.js';
import path from 'path';
import fs from 'fs/promises';
import { watch } from "fs";
import nj from 'nunjucks';
import config from "../config.toml";

// nunjucks-instance
const env = new nj.Environment(new nj.FileSystemLoader(path.join(process.cwd(), 'homewarden/view')), {
    autoescape: true,
    trimBlocks: true, 
    lstripBlocks: true
});

// intilalize the collections
let collections;
let collectionsCache = null;

// generate the index.html file
async function generateIndexHtml() {
    try {
        const cacheDir = path.join(process.cwd(), '.cached-icons');
        await fs.mkdir(cacheDir, { recursive: true });

        if (collectionsCache && Date.now() - collectionsCache.timestamp < config.REFRESH_INTERVAL * 1000) {
            console.log('Using cached collections data');
            collections = collectionsCache.data;
        } else {
            console.log('Generating fresh collections data');
            const freshCollections = await createCollections();
            collections = freshCollections.data;

            collectionsCache = { 
                data: collections,
                timestamp: freshCollections.timestamp
            };
        }

        const templatePath = path.join(process.cwd(), 'homewarden/view', 'template.html');
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        const renderedHtml = await env.renderString(templateContent, { data: collections });
        const outputPath = path.join(process.cwd(), 'index.html');
        await fs.writeFile(outputPath, renderedHtml);
        console.log('index.html has been generated successfully.');
    } catch (error) {
        console.error('Error generating index.html:', error);
    }
}

// Create the collections
generateIndexHtml();

// Watch for changes in the view directory
const watchDirectory = path.join(process.cwd(), 'homewarden/view');
watch(watchDirectory, { recursive: true }, (eventType, fileName) => {
    console.log(`Detected ${eventType} in ${fileName}`);
    generateIndexHtml();
});


// Clear cache every 30 seconds
setInterval(() => {
    collectionsCache = null;
    generateIndexHtml();
}, config.REFRESH_INTERVAL * 1000);

// Optional: Interval beenden beim Herunterfahren des Servers
process.on('exit', () => {
    if (intervalId) {
        clearInterval(intervalId);
    }
});