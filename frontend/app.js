// Configuration
let currentUnit = 'F'; // 'F' for US Imperial standard, 'C' for Metric system
let activeLocation = '';

// DOM Elements
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const gpsBtn = document.getElementById('gps-btn');
const refreshBtn = document.getElementById('refresh-btn');
const unitF = document.getElementById('unit-f');
const unitC = document.getElementById('unit-c');

const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error-msg');
const mainCardEl = document.getElementById('main-card');

// Weather Parameter Mappers
function getWeatherSpecs(iconString, isNight) {
  const icon = iconString.toLowerCase();
  if (icon.includes('rain') || icon.includes('shower')) {
    return { emoji: '🌧️', theme: 'rainy', particle: '💧' };
  }
  if (icon.includes('snow') || icon.includes('sleet')) {
    return { emoji: '❄️', theme: 'snowy', particle: '❄️' };
  }
  if (icon.includes('cloud') || icon.includes('overcast')) {
    return { emoji: '☁️', theme: 'cloudy', particle: '☁️' };
  }
  if (isNight) {
    return { emoji: '🌙', theme: 'night', particle: '✨' };
  }
  return { emoji: '☀️', theme: 'sunny', particle: '✨' };
}

// Render Engine
function renderWeather(data) {
  const current = data.currentConditions;
  const isNight = current.datetime ? parseInt(current.datetime.split(':')[0]) > 19 || parseInt(current.datetime.split(':')[0]) < 6 : false;
  const specs = getWeatherSpecs(current.icon || '', isNight);

  // Background and Atmospheric Particles
  const bg = document.getElementById('sky-bg');
  if (bg) bg.className = specs.theme;
  generateAtmosphere(specs.particle);

  // Assign Core Hero Card Metrics
  document.getElementById('loc-name').textContent = data.resolvedAddress;
  document.getElementById('cur-temp').textContent = Math.round(current.temp);
  document.getElementById('cur-unit').textContent = `°${currentUnit}`;
  document.getElementById('cur-condition').textContent = current.conditions;
  document.getElementById('cur-feels').textContent = `Feels like ${Math.round(current.feelslike)}°`;
  document.getElementById('cur-icon').textContent = specs.emoji;

  // Stat Indicators
  const speedUnit = currentUnit === 'F' ? 'mph' : 'km/h';
  document.getElementById('stat-wind').textContent = `${Math.round(current.windspeed)} ${speedUnit}`;
  document.getElementById('stat-wind-dir').textContent = `Direction: ${current.winddir}°`;
  document.getElementById('stat-precip').textContent = `${Math.round(current.precip || 0)}%`;
  document.getElementById('stat-precip-prob').textContent = `Probability: ${current.precipprob || 0}%`;
  document.getElementById('stat-humidity').textContent = `${Math.round(current.humidity)}%`;

  // Timeline Outlook Generation (24-Hour Windows)
  const hourlyContainer = document.getElementById('hourly-container');
  hourlyContainer.innerHTML = '';

  const hoursArray = data.days[0].hours || [];
  const currentHourString = current.datetime ? current.datetime.substring(0, 2) : '';

  hoursArray.forEach(hour => {
    const hrString = hour.datetime.substring(0, 2);
    const hourSpecs = getWeatherSpecs(hour.icon || '', parseInt(hrString) > 19 || parseInt(hrString) < 6);
    const isCurrent = hrString === currentHourString;

    const chip = document.createElement('div');
    chip.className = `hour-chip ${isCurrent ? 'current-hour' : ''}`;
    chip.innerHTML = `
      <div class="hour-time">${hour.datetime.substring(0, 5)}</div>
      <div class="hour-icon">${hourSpecs.emoji}</div>
      <div class="hour-temp">${Math.round(hour.temp)}°</div>
      <div class="hour-rain">💧${Math.round(hour.precipprob || 0)}%</div>
    `;
    hourlyContainer.appendChild(chip);
  });

  // Stamp Update Time
  document.getElementById('updated-time').textContent = `Last updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  
  // Reveal Card
  mainCardEl.classList.add('visible');
}

// Particle Canvas Generator
function generateAtmosphere(char) {
  const container = document.getElementById('particles');
  if (!container) return;
  container.innerHTML = '';
  const count = char === '✨' ? 25 : 60;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = char;
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.fontSize = char === '☁️' ? `${Math.random() * 20 + 15}px` : `${Math.random() * 12 + 8}px`;
    particle.style.animationDuration = `${Math.random() * 3 + 2}s`;
    particle.style.animationDelay = `${Math.random() * 5}s`;
    container.appendChild(particle);
  }
}

// Core Fetch Engine with Vercel URL parameters
async function fetchWeather(targetLocation) {
  if (!targetLocation || targetLocation.trim() === "") {
    console.warn("Fetch blocked: Location string is empty.");
    return;
  }

  errorEl.classList.remove('show');
  mainCardEl.classList.remove('visible');
  loadingEl.classList.add('show');

  try {
    // Map system config to API parameter syntax
    const unitsGroup = currentUnit === 'F' ? 'us' : 'metric';
    
    // Explicitly send unitGroup so the backend renders the correct scale!
    const url = `/api/weather/${encodeURIComponent(targetLocation.trim())}?unitGroup=${unitsGroup}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Location not found. Please try a different city.');
    }

    const data = await response.json();

    activeLocation = data.resolvedAddress;
    renderWeather(data);

  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.add('show');
  } finally {
    loadingEl.classList.remove('show');
  }
}

// Location Retrieval via GPS with a forced fallback
function fetchByGPS() {
  if (navigator.geolocation) {
    loadingEl.classList.add('show');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const query = `${position.coords.latitude},${position.coords.longitude}`;
        fetchWeather(query);
      },
      (error) => {
        console.log("GPS denied or unavailable. Falling back to default city.");
        fetchWeather('London'); 
      },
      { timeout: 5000 }
    );
  } else {
    fetchWeather('London');
  }
}

// Optimized Unit Switcher
function setUnit(unit) {
  if (currentUnit === unit) return;
  currentUnit = unit;
  
  if (unit === 'F') {
    unitF.classList.add('active');
    unitC.classList.remove('active');
  } else {
    unitC.classList.add('active');
    unitF.classList.remove('active');
  }

  const query = locationInput.value.trim() || activeLocation;
  if (query) {
    fetchWeather(query);
  }
}

// Event Listeners
searchBtn.addEventListener('click', () => {
  const query = locationInput.value.trim();
  if (query) fetchWeather(query);
});

locationInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const query = locationInput.value.trim();
    if (query) fetchWeather(query);
  }
});

gpsBtn.addEventListener('click', fetchByGPS);

refreshBtn.addEventListener('click', () => {
  const query = locationInput.value.trim() || activeLocation;
  if (query) fetchWeather(query);
});

unitF.addEventListener('click', () => setUnit('F'));
unitC.addEventListener('click', () => setUnit('C'));

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  fetchByGPS();
});