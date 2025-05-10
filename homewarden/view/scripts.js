const ninja = document.querySelector('ninja-keys');
const commands = [];

async function fetchCollections() {
    try {
        const response = await fetch('/api/collections');
        if (!response.ok) {
            throw new Error('Netzwerkantwort war nicht ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fehler beim Abrufen der Collections:', error);
        return [];
    }
}

fetchCollections().then(data => {
    Object.keys(data).forEach(key => {
        const collection = data[key];

        if (collection && collection.title && collection.items) {

            Object.values(collection.items).forEach(item => {
                const iconSrc = item.customIcon || item.selfhost || item.icon;
                const imgElement = iconSrc ? `<img src="${iconSrc}" alt="${item.name}" style="margin-right: 10px; width: calc(${data.global.font_size} * 1.4)" />` : '';

                commands.push({
                    id: item.name,
                    title: `${item.name}`,
                    section: collection.title,
                    icon: imgElement,
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
            section: 'Options',
            handler: () => {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            },
        },
        {
            id: 'Dark Theme',
            title: 'Switch to dark theme',
            section: 'Options',
            handler: () => {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            },
        },
        {
            id: 'Rebuild Collections',
            title: 'Rebuild Collections',
            section: 'Options',
            handler: async () => {
                const response = await fetch('/api/refresh', { method: 'POST' });
                const message = response.ok
                    ? 'Collections have been rebuilt successfully!'
                    : 'Failed to rebuild collections.';

                console.log(message);
                alert(message);

                if (response.ok) {
                    location.reload();
                }
            },
        }
    );

    ninja.data = commands;
    
    ninja.addEventListener('selected', (event) => {
        const searchText = event.detail.search.trim();
        const [bang, ...queryParts] = searchText.split(/\s+/);
        const query = queryParts.join(' ');
    
        const engine = SEARCH_ENGINE.find(engine => engine.bang === bang) || 
                       SEARCH_ENGINE.find(engine => engine.default);
    
        const searchQuery = engine.url.replace(/%s/, encodeURIComponent(query || searchText));
        window.open(searchQuery, '_blank').focus();
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
    }
});