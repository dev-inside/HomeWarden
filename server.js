import { createCollections } from './index.js';
import path from 'path';
import fs from 'fs/promises';
import { watch } from "fs";
import nj from 'nunjucks';
import { serve } from "bun";

const env = new nj.Environment();

// intilalize the collections
let collections;

// generate the index.html file
async function generateIndexHtml() {
    try {
        const templatePath = path.join(process.cwd(), 'view', 'template.html');
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        
        // Check if collections are available
        if (!collections) {
            collections = await createCollections();
        }
        
        // Render the template with the data
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
const watchDirectory = path.join(process.cwd(), 'view');
watch(watchDirectory, { recursive: true }, (eventType, fileName) => {
    console.log(`Detected ${ eventType } in ${ fileName }`);
    generateIndexHtml();
});