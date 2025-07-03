class WeatherApp {
    constructor() {
        this.cityInput = document.getElementById('cityInput');
        this.weatherDisplay = document.getElementById('weatherDisplay');
        this.suggestions = document.getElementById('suggestions');
        this.weatherParticles = document.getElementById('weatherParticles');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.getUserLocation();
        this.createBackgroundParticles();
    }

    setupEventListeners() {
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchWeather();
            }
        });

        this.cityInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        document.addEventListener('click', (e) => {
            if (!this.suggestions.contains(e.target)) {
                this.suggestions.style.display = 'none';
            }
        });
    }

    async handleSearch(query) {
        if (query.length < 2) {
            this.suggestions.style.display = 'none';
            return;
        }

        // Simple city suggestions (in a real app, you'd use a geocoding API)
        const cities = [
            'Lagos', 'London', 'New York', 'Tokyo', 'Paris', 'Sydney', 'Dubai', 'Mumbai', 'Singapore', 'Toronto'
        ];

        const matches = cities.filter(city =>
            city.toLowerCase().includes(query.toLowerCase())
        );

        if (matches.length > 0) {
            this.showSuggestions(matches);
        } else {
            this.suggestions.style.display = 'none';
        }
    }

    showSuggestions(cities) {
        this.suggestions.innerHTML = cities.map(city =>
            `<div class="suggestion-item" onclick="weatherApp.selectCity('${city}')">${city}</div>`
        ).join('');
        this.suggestions.style.display = 'block';
    }

    selectCity(city) {
        this.cityInput.value = city;
        this.suggestions.style.display = 'none';
        this.searchWeather();
    }

    async getUserLocation() {
        if ('geolocation' in navigator) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });

                const { latitude, longitude } = position.coords;
                this.fetchWeatherByCoords(latitude, longitude);
            } catch (error) {
                this.showError('Location access denied. Please search for a city.');
            }
        } else {
            this.showError('Geolocation not supported. Please search for a city.');
        }
    }

    async searchWeather() {
        const city = this.cityInput.value.trim();
        if (!city) return;

        this.showLoading();
        this.fetchWeatherByCity(city);
    }

    async fetchWeatherByCity(city) {
        try {
            const response = await fetch(`https://wttr.in/${city}?format=j1`);
            if (!response.ok) throw new Error('City not found');

            const data = await response.json();
            this.displayWeather(data, city);
        } catch (error) {
            this.showError('City not found. Please try another city.');
        }
    }

    async fetchWeatherByCoords(lat, lon) {
        try {
            const response = await fetch(`https://wttr.in/${lat},${lon}?format=j1`);
            if (!response.ok) throw new Error('Failed to fetch weather');

            const data = await response.json();
            this.displayWeather(data, 'Your Location');
        } catch (error) {
            this.showError('Failed to fetch weather data.');
        }
    }

    displayWeather(data, location) {
            const current = data.current_condition[0];
            const forecast = data.weather.slice(0, 3);

            this.updateBackground(current.weatherDesc[0].value);
            this.updateWeatherParticles(current.weatherDesc[0].value);

            this.weatherDisplay.innerHTML = `
                    <div class="main-weather-card">
                        <div class="location-name">${location}</div>
                        <div class="weather-icon">${this.getWeatherIcon(current.weatherDesc[0].value)}</div>
                        <div class="temperature">${current.temp_C}°</div>
                        <div class="weather-description">${current.weatherDesc[0].value}</div>
                    </div>

                    <div class="details-card">
                        <div class="details-grid">
                            <div class="detail-item">
                                <div class="detail-label">Feels Like</div>
                                <div class="detail-value">${current.FeelsLikeC}°C</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Humidity</div>
                                <div class="detail-value">${current.humidity}%</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Wind Speed</div>
                                <div class="detail-value">${current.windspeedKmph} km/h</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Pressure</div>
                                <div class="detail-value">${current.pressure} mb</div>
                            </div>
                        </div>
                    </div>
                `;

            // Add forecast section
            const forecastHTML = `
                    <div class="forecast-section">
                        <div class="forecast-title">3-Day Forecast</div>
                        <div class="forecast-grid">
                            ${forecast.map(day => `
                                <div class="forecast-card">
                                    <div style="font-size: 0.9rem; color: rgba(255,255,255,0.7); margin-bottom: 0.5rem;">
                                        ${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">
                                        ${this.getWeatherIcon(day.hourly[4].weatherDesc[0].value)}
                                    </div>
                                    <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;">
                                        ${day.maxtempC}° / ${day.mintempC}°
                                    </div>
                                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.6);">
                                        ${day.hourly[4].weatherDesc[0].value}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

                this.weatherDisplay.innerHTML += forecastHTML;
                this.weatherDisplay.classList.add('visible');
            }

            getWeatherIcon(condition) {
                const icons = {
                    'sunny': '☀️',
                    'clear': '☀️',
                    'partly cloudy': '⛅',
                    'cloudy': '☁️',
                    'overcast': '☁️',
                    'rain': '🌧️',
                    'light rain': '🌦️',
                    'heavy rain': '⛈️',
                    'thunderstorm': '⛈️',
                    'snow': '❄️',
                    'mist': '🌫️',
                    'fog': '🌫️'
                };

                const lowerCondition = condition.toLowerCase();
                for (const [key, icon] of Object.entries(icons)) {
                    if (lowerCondition.includes(key)) {
                        return icon;
                    }
                }
                return '🌤️';
            }

            updateBackground(condition) {
                const body = document.body;
                body.classList.remove('sunny-bg', 'rainy-bg', 'cloudy-bg', 'snowy-bg');

                if (condition.toLowerCase().includes('sunny') || condition.toLowerCase().includes('clear')) {
                    body.classList.add('sunny-bg');
                } else if (condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('storm')) {
                    body.classList.add('rainy-bg');
                } else if (condition.toLowerCase().includes('snow')) {
                    body.classList.add('snowy-bg');
                } else {
                    body.classList.add('cloudy-bg');
                }
            }

            updateWeatherParticles(condition) {
                this.weatherParticles.innerHTML = '';
                
                if (condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('storm')) {
                    this.createRainParticles();
                } else if (condition.toLowerCase().includes('snow')) {
                    this.createSnowParticles();
                }
            }

            createRainParticles() {
                for (let i = 0; i < 50; i++) {
                    const drop = document.createElement('div');
                    drop.className = 'particle rain-drop';
                    drop.style.left = Math.random() * 100 + '%';
                    drop.style.animationDelay = Math.random() * 2 + 's';
                    drop.style.animationDuration = (Math.random() * 0.5 + 0.5) + 's';
                    this.weatherParticles.appendChild(drop);
                }
            }

            createSnowParticles() {
                for (let i = 0; i < 30; i++) {
                    const flake = document.createElement('div');
                    flake.className = 'particle snow-flake';
                    flake.style.left = Math.random() * 100 + '%';
                    flake.style.animationDelay = Math.random() * 5 + 's';
                    flake.style.animationDuration = (Math.random() * 3 + 5) + 's';
                    this.weatherParticles.appendChild(flake);
                }
            }

            createBackgroundParticles() {
                for (let i = 0; i < 20; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.width = Math.random() * 6 + 2 + 'px';
                    particle.style.height = particle.style.width;
                    particle.style.left = Math.random() * 100 + '%';
                    particle.style.top = Math.random() * 100 + '%';
                    particle.style.animationDelay = Math.random() * 10 + 's';
                    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
                    this.weatherParticles.appendChild(particle);
                }
            }

            showLoading() {
                this.weatherDisplay.classList.remove('visible');
                this.weatherDisplay.innerHTML = `
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <p>Fetching weather data...</p>
                    </div>
                `;
            }

            showError(message) {
                this.weatherDisplay.classList.remove('visible');
                this.weatherDisplay.innerHTML = `
                    <div class="error">
                        <p>${message}</p>
                    </div>
                `;
            }
        }

        // Initialize the weather app
        const weatherApp = new WeatherApp();
        
        // Make selectCity globally accessible
window.weatherApp = weatherApp;