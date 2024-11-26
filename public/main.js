import { themes } from './components/ThemeManager.js';
const socket = io();
socket.emit('join-room', 'sala1');
socket.on('user-joined', ({ userId, usersCount }) => {
  console.log(`Usuario ${userId} se unió. Total usuarios: ${usersCount}`);
});

socket.on('user-left', ({ userId, usersCount }) => {
  console.log(`Usuario ${userId} salió. Total usuarios: ${usersCount}`);
});
// Enhanced alerts data with more media combinations
const alerts = [
  {
    type: 'text',
    content: 'John Doe donated $50! Thank you!',
    duration: 5000
  },
  {
    type: 'multi-image',
    images: [
      'https://picsum.photos/200/200',
      'https://picsum.photos/201/200',
      'https://picsum.photos/200/201'
    ],
    text: 'Amazing triple donation from our top supporters!',
    duration: 8000
  },
  {
    type: 'video-image',
    video: 'https://www.w3schools.com/html/mov_bbb.mp4',
    image: 'https://picsum.photos/200/200',
    text: 'SuperFan123 with the mega combo donation!',
    duration: 10000
  },
  {
    type: 'image-grid',
    images: [
      'https://picsum.photos/150/150',
      'https://picsum.photos/151/150',
      'https://picsum.photos/150/151',
      'https://picsum.photos/151/151'
    ],
    text: 'Squad donation achieved! Thank you team!',
    duration: 7000
  },
  {
    type: 'video-grid',
    videos: [
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4'
    ],
    text: 'Double feature donation! You\'re amazing!',
    duration: 9000
  }
];
// ['multi-image','video-grid','image-grid','video-image','image','video','text']
let currentIndex = 0;
const themeNames = Object.keys(themes);
console.log(themes,themeNames)
function showNextAlert(currentTheme = 'default') {
  const alertContainer = document.createElement('donation-alert');
  alertContainer.theme = currentTheme;
  alertContainer.alert = alerts[currentIndex];
  console.log(alerts[currentIndex])
  document.querySelector('#app').appendChild(alertContainer);
  
  setTimeout(() => {
    alertContainer.remove();
    currentIndex = (currentIndex + 1) % alerts.length;
    // Change theme every two alerts
    if (currentIndex % 2 === 0) {
      currentTheme = themeNames[(themeNames.indexOf(currentTheme) + 1) % themeNames.length];
    }
    setTimeout(showNextAlert, 5000); // 2 second gap between alerts
  }, alerts[currentIndex].duration);
}


//showNextAlert();
function createOverlay(config, currentTheme = 'neon') {
  if (!config ||!config.type || !config.content && !config.duration) return;
  const alertContainer = document.createElement('donation-alert');
  alertContainer.theme = currentTheme;
  alertContainer.alert = config;
  document.querySelector('#app').appendChild(alertContainer);
  setTimeout(() => {
    alertContainer.remove();
  }, 15000);//config.duration 
}
const testevent = alerts[3];
createOverlay(testevent,'neon');
console.log(testevent);
socket.on('create-overlay', (config) => {
  console.log('create-window', config);
  createOverlay(config);
});