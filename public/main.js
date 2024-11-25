import { themes } from './components/ThemeManager.js';

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

let currentIndex = 0;
let currentTheme = 'default';
const themeNames = Object.keys(themes);

function showNextAlert() {
  const alertContainer = document.createElement('donation-alert');
  alertContainer.theme = currentTheme;
  alertContainer.alert = alerts[currentIndex];
  
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

// Add theme controls to the page
const controls = document.createElement('div');
controls.className = 'fixed bottom-4 left-4 flex gap-2';
controls.innerHTML = `
  <div class="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
    <h3 class="text-white mb-2">Theme:</h3>
    <div class="flex gap-2">
      ${Object.keys(themes).map(theme => `
        <button
          class="px-3 py-1 rounded ${theme === currentTheme ? 'bg-purple-600' : 'bg-gray-700'} text-white text-sm"
          data-theme="${theme}"
        >
          ${theme}
        </button>
      `).join('')}
    </div>
  </div>
`;

controls.addEventListener('click', (e) => {
  if (e.target.dataset.theme) {
    currentTheme = e.target.dataset.theme;
    // Update button styles
    controls.querySelectorAll('button').forEach(btn => {
      btn.className = `px-3 py-1 rounded ${btn.dataset.theme === currentTheme ? 'bg-purple-600' : 'bg-gray-700'} text-white text-sm`;
    });
  }
});

document.body.appendChild(controls);

showNextAlert();