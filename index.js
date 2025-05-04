// index.js
import fs from "fs";
import path from 'path';
import config from "./config.toml";

const host = process.env.LW_HOST;
const api = "api/v1";
const token = process.env.LW_TOKEN;
const url = host + "/" + api;
const collections = config.COLLECTIONS;

/**
 * getBaseUrl(url)
 * 
 * Returns the base url of a given URL.
 * Used to obtain the host from a URL which
 * is needed to obtain the Favicons from the Google-API
 * 
 * @param {string} url 
 * @returns 
 */
function getBaseUrl(url) {
  if (url === null || url === undefined) {
    return null; // oder einen anderen Standardwert, den Sie möchten
  }
  const parsedUrl = new URL(url);
  return `${parsedUrl.protocol}//${parsedUrl.host}`;
}

/**
 * requestLW(endpoint)
 * 
 * A simple http-request-helper to Linkwarden API
 * 
 * @param {string} endpoint 
 * @returns 
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

/**
 * getIconUrl(name, filepath = "selfhst-icons/webp")
 * 
 * This function browses through a given folder and 
 * returns the first found image with a given name.
 * By default it scrapes the selfhst-icons folder, 
 * but is also used for custom icons.
 * 
 * @param {*} name the collection.name generates the image name fa "Home Assistant" => home-assistant.webp
 * @param {*} filepath filepath is the path to the folder where icons are stored
 * @returns Custom Icon-Url as string
 */
async function getIconUrl(name, filepath = "selfhst-icons/webp") {
  const formattedName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-]/gi, '');
  const formats = ['.webp', '.png', '.gif', '.svg', '.jpeg', '.jpg', '.avif'];
  for (const format of formats) {
    const iconPath = path.join(filepath, formattedName + format);
    if (fs.existsSync(iconPath)) {
      return iconPath;
    }
  }
  return null;
}

/**
 * getLinks(id)
 * 
 * This function generates the object for the list-data
 * 
 * @param {*} id the unique identifier of the collection from Linkwarden
 * @returns object
 */
async function getLinks(id) {
  const links = {};
  const call = await requestLW("links?collectionId=" + id + "&sort=1");
  const parsedCall = JSON.parse(call);
  
  const iconPromises = parsedCall.response.map(async (link) => {
    const baseUrl = await getBaseUrl(link.url);
    if (baseUrl) {
      return {
        id: link.id,
        name: link.name,
        description: link.description,
        url: link.url,
        selfhost: await getIconUrl(link.name),
        icon: `https://www.google.com/s2/favicons?domain=${baseUrl}&sz=256`,
        customIcon: await getIconUrl(link.name, 'custom/icons'),
        tags: link.tags
      };
    } else {
      return null; // oder einen anderen Standardwert, den Sie möchten
    }
  });

  const linkArray = await Promise.all(iconPromises);
  linkArray.forEach(link => {
    if (link) {
      links[link.id] = link;
    }
  });
  return links;
}

/**
 * createCollections()
 * 
 * Creates all collections containing the links and their metadata
 * 
 * @returns object
 */

export async function createCollections() {
  const card = {
    global: {
      color: config.COLOR,
      wrapper: config.WRAPPER,
    }
  };
  
  await Promise.all(collections.map(async (section, index) => {
    const category = await requestLW("collections/" + section.id);
    const result = JSON.parse(category);
    
    // Verwende den Index anstelle von section.sort
    card[index] = {
      title: result.response.name,
      col: section.cols,
      type: section.type,
      description: result.response.description,
      items: await getLinks(section.id)
    };
  }));

  
  return { data: card, timestamp: Date.now() };
}