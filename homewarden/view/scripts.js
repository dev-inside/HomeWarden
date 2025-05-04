import data from '../collections.json';
import 'ninja-keys';

const ninja = document.querySelector('ninja-keys');
const commands = [];

Object.keys(data).forEach(key => {
    const collection = data[key];

    if (collection && collection.title && collection.items) {
        Object.values(collection.items).forEach(item => {
            commands.push({
                id: item.name,
                title: `${item.name}`,
                section: collection.title,
                handler: () => {
                    window.open(item.url, '_blank').focus();
                },
            });
        });
    }
});

commands.push(
    {
        id: 'Light Theme',
        title: 'Switch to light theme',
        parent: 'Theme',
        handler: () => {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        },
    },
    {
        id: 'Dark Theme',
        title: 'Switch to dark theme',
        parent: 'Theme',
        handler: () => {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        },
    });


ninja.data = commands;

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.body.setAttribute('data-theme', savedTheme);
}