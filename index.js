import fs from "fs";
import { request } from "http";

const host = process.env.LW_HOST;
const api = "api/v1";
const token = process.env.LW_TOKEN;
const url = host + "/" + api;
const collections = JSON.parse(process.env.COLLECTIONS);


/**
 * requestLW()
 * Simple-GET-Request
 * 
 * @param {string} endpoint API-Endpoint and params
 * @returns {object}
 */
async function requestLW(endpoint) {
    let headersList = {
        "Accept": "application/json",
        "Authorization": "Bearer " + token
    }

    let response = await fetch(url + "/" + endpoint, {
        method: "GET",
        headers: headersList
    });
    return await response.text();
}

async function getIconUrl(name) {
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    const url = `https://cdn.jsdelivr.net/gh/selfhst/icons/webp/${formattedName}.webp`;

    try {
        const response = await fetch(url);

        if (response.ok) { 
            return url;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

async function getLinks(id) {
    var links = {};
    var call = await requestLW("links?collectionId=" + id + "&sort=1");
    var call = JSON.parse(call);

    for (const link of call.response) {
        links[link.id] = {
            name: link.name,
            description: link.description,
            url: link.url,
            icon: host + "/_next/image?url=" + encodeURIComponent("https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=" + link.url + "&size=128") + "&w=64&q=100",
            selfhost: await getIconUrl(link.name).then(url => url),
            tags: link.tags
        }
    };
    return links;
}

/**
 * createCollections
 * Builds all collections and includes the links
 * 
 * @returns {object}
 */
async function createCollections() {
    const card = {};
    await Promise.all(collections.map(async (section) => {
        const category = await requestLW("collections/" + section.id);
        const result = JSON.parse(category);
        card[section.id] = {
            title: result.response.name,
            col: section.col,
            description: result.response.description,
            items: await getLinks()
        };
    }));
    return card;
}

console.log(await getLinks(9706));


