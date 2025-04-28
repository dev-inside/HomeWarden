// index.js
import fs from "fs";
import path from 'path';

const host = process.env.LW_HOST;
const api = "api/v1";
const token = process.env.LW_TOKEN;
const url = host + "/" + api;
const collections = JSON.parse(process.env.COLLECTIONS);

/**
 * 
 * @param {*} endpoint 
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
 * @param {*} name the collection.name generates the image name fa "Home Assistant" => home-assistant.webp
 * @param {*} filepath filepath is the path to the folder where icons are stored
 * @returns Custom Icon-Url as string
 */
async function getIconUrl(name, filepath = "selfhst-icons/webp") {
  const formattedName = name.toLowerCase().replace(/\s+/g, '-');
  const formats = ['.webp', '.png', '.gif', '.svg', '.jpeg'];
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
 * @param {*} id the unique identifier of the collection from Linkwarden
 * @returns object
 */
async function getLinks(id) {
  const links = {};
  const call = await requestLW("links?collectionId=" + id + "&sort=1");
  const parsedCall = JSON.parse(call);
  
  const iconPromises = parsedCall.response.map(async (link) => {
    return {
      id: link.id,
      name: link.name,
      description: link.description,
      url: link.url,
      icon: host + "/_next/image?url=" + encodeURIComponent("https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=" + link.url + "&size=128") + "&w=64&q=100",
      selfhost: await getIconUrl(link.name),
      customIcon: await getIconUrl(link.name, 'custom/icons'),
      tags: link.tags
    };
  });
  
  const linkArray = await Promise.all(iconPromises);
  linkArray.forEach(link => {
    links[link.id] = link;
  });
  return links;
}

/**
 * createCollections()
 * Creates all collections containing the links and their metadata
 * 
 * @returns object
 */
async function createCollections() {
  const card = {};
  await Promise.all(collections.map(async (section) => {
    const category = await requestLW("collections/" + section.id);
    const result = JSON.parse(category);
    card[section.id] = {
      title: result.response.name,
      col: section.cols,
      description: result.response.description,
      items: await getLinks(section.id)
    };
  }));
  const data = card;
  return data;
}

export { createCollections };