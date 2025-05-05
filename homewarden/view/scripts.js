import data from '../../custom/config.toml';
import 'ninja-keys';

// Konfiguration
const config = {
    dateFormat: 'DD/MM/YY',
    timeFormat: 'HH:mm:ss',
    timeMode: '24h'
  };
  
  let dateString, timeString;
  
  function formatDate(date) {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
  }
  
  function formatTime(date, timeMode) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    let ampm = '';
  
    if (timeMode === '12h') {
      hours = hours % 12 || 12;
      ampm = hours >= 12 ? 'PM' : 'AM';
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
    } else {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  function updateDateTime() {
    const dateTimeElement = document.getElementById('datetime');
    const currentDate = new Date();
  
    dateString = formatDate(currentDate);
    timeString = formatTime(currentDate, config.timeMode);
  
    dateTimeElement.textContent = `${dateString} - ${timeString}`;
    requestAnimationFrame(updateDateTime);
  }
  
  updateDateTime();

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