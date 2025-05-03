// index.js
import fs from "fs";
import path from 'path';
import config from "./config.toml";

const host = process.env.LW_HOST;
const api = "api/v1";
const token = process.env.LW_TOKEN;
const url = host + "/" + api;
const collections = config.CLT;

function getBaseUrl(url) {
  if (url === null || url === undefined) {
    return null; // oder einen anderen Standardwert, den Sie möchten
  }
  const parsedUrl = new URL(url);
  return `${parsedUrl.protocol}//${parsedUrl.host}`;
}

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
  const formattedName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-]/gi, '');
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
 * Creates all collections containing the links and their metadata
 * 
 * @returns object
 */

export async function createCollections() {
  const card = {
    global: {
      color: config.COLOR,
    }
  };
  
  await Promise.all(collections.map(async (section, index) => {
    const category = await requestLW("collections/" + section.id);
    const result = JSON.parse(category);
    
    // Verwende den Index anstelle von section.sort
    card[index] = {
      title: result.response.name,
      col: section.cols,
      description: result.response.description,
      items: await getLinks(section.id)
    };
  }));

  
  return { data: card, timestamp: Date.now() };
}

async function makePanel() {
  const { data } = await createCollections();
  const ninja = { data: [] };

  // Verwende Object.entries, um durch die Kategorien zu iterieren
  for (const [key, category] of Object.entries(data)) {
      // Füge die Kategorie als Objekt hinzu
      ninja.data.push({
          id: category.title,
          title: category.title,
          hotkey: `shift+${key}`,
          handler: () => {
              ninja.open({ parent: category.title });
              return { keepOpen: true };
          },
      });

      // Iteriere durch die Items der Kategorie
      for (const link of category.items) {
          // Füge jedes Link-Objekt hinzu
          ninja.data.push({
              id: link.name,
              title: link.name,
              section: category.title,
              parent: category.title,
              keywords: link.tags,
              icon: link.customIcon 
                  ? `<img width="18" height="18" src="${link.customIcon}" alt="">`
                  : link.selfhost 
                  ? `<img width="18" height="18" src="${link.selfhost}" alt="">`
                  : link.icon 
                  ? `<img width="18" height="18" src="${link.icon}" alt="">`
                  : '',
              handler: () => {
                  window.open(link.url, '_blank');
              },
          });
      }
  }

  await Bun.write('panel.json', JSON.stringify(ninja.data));
}
