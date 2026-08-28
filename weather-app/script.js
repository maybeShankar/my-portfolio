const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-btn");

const cityName = document.getElementById("city-name");
const temperature = document.getElementById("temperature");
const weatherDescription = document.getElementById("weather-description");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const weatherIcon = document.getElementById("weather-icon");
const locationButton = document.getElementById("location-btn");
const errorMessage = document.getElementById("error-message");
const forecastContainer = document.getElementById("forecastContainer");

searchButton.addEventListener("click", getWeather);
cityInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    getWeather();
  }
});
locationButton.addEventListener("click", getMyLocation);

async function getWeather() {
  errorMessage.textContent = "";
  const city = cityInput.value.trim();

  if (city === "") {
    errorMessage.textContent = "Please enter a city name.";
    return;
  }

  searchButton.disabled = true;
  searchButton.textContent = "Loading...";
  weatherDescription.textContent = "Loading...";

  try {
    // 1. Find the city
    const locationResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
    );

    const locationData = await locationResponse.json();

    if (!locationData.results) {
      weatherDescription.textContent = "City not found.";
      return;
    }

    const location = locationData.results[0];

    const latitude = location.latitude;
    const longitude = location.longitude;

    // 2. Get weather
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&temperature_unit=celsius&wind_speed_unit=kmh`,
    );

    const weatherData = await weatherResponse.json();

    // 3. Display the data
    cityName.textContent = location.name;

    temperature.textContent = Math.round(weatherData.current.temperature_2m);

    humidity.textContent = weatherData.current.relative_humidity_2m + "%";

    wind.textContent = Math.round(weatherData.current.wind_speed_10m) + " km/h";

    const weatherCode = weatherData.current.weather_code;
    changeWeatherTheme(weatherCode);

    weatherDescription.textContent = getWeatherDescription(weatherCode);

    weatherIcon.textContent = getWeatherIcon(weatherCode);
    displayForecast(weatherData.daily);
  } catch (error) {
    console.error(error);

    weatherDescription.textContent = "Something went wrong. Please try again.";
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Search";
  }
}

function getWeatherDescription(code) {
  if (code === 0) {
    return "Clear sky ☀️";
  }

  if (code === 1 || code === 2) {
    return "Partly cloudy ⛅";
  }

  if (code === 3) {
    return "Overcast ☁️";
  }

  if (code >= 51 && code <= 67) {
    return "Rain 🌧️";
  }

  if (code >= 71 && code <= 77) {
    return "Snow ❄️";
  }

  if (code >= 80 && code <= 82) {
    return "Rain showers 🌦️";
  }

  if (code >= 95) {
    return "Thunderstorm ⛈️";
  }

  return "Unknown weather";
}
function getWeatherIcon(code) {
  if (code === 0) {
    return "☀️";
  }

  if (code === 1 || code === 2) {
    return "⛅";
  }

  if (code === 3) {
    return "☁️";
  }

  if (code >= 51 && code <= 67) {
    return "🌧️";
  }

  if (code >= 71 && code <= 77) {
    return "❄️";
  }

  if (code >= 80 && code <= 82) {
    return "🌦️";
  }

  if (code >= 95) {
    return "⛈️";
  }

  return "🌤️";
}
function getMyLocation() {
  if (!navigator.geolocation) {
    weatherDescription.textContent =
      "Location is not supported by your browser.";

    return;
  }

  weatherDescription.textContent = "Getting your location...";

  navigator.geolocation.getCurrentPosition(
    function (position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      getWeatherByCoordinates(latitude, longitude);
    },

    function () {
      weatherDescription.textContent = "Unable to get your location.";
    },
  );
}
async function getWeatherByCoordinates(latitude, longitude) {
  try {
    weatherDescription.textContent = "Loading weather...";

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&temperature_unit=celsius&wind_speed_unit=kmh`,
    );

    const weatherData = await weatherResponse.json();

    cityName.textContent = "Your Location";

    temperature.textContent = Math.round(weatherData.current.temperature_2m);

    humidity.textContent = weatherData.current.relative_humidity_2m + "%";

    wind.textContent = Math.round(weatherData.current.wind_speed_10m) + " km/h";

    const weatherCode = weatherData.current.weather_code;
    changeWeatherTheme(weatherCode);

    weatherDescription.textContent = getWeatherDescription(weatherCode);

    weatherIcon.textContent = getWeatherIcon(weatherCode);
    displayForecast(weatherData.daily);
  } catch (error) {
    console.error(error);

    weatherDescription.textContent = "Could not get weather data.";
    searchButton.disabled = false;
    searchButton.textContent = "Search";
  }
}
function changeWeatherTheme(code) {
  document.body.className = "";

  if (code === 0) {
    document.body.classList.add("clear");
  } else if (code === 1 || code === 2 || code === 3) {
    document.body.classList.add("cloudy");
  } else if (code >= 51 && code <= 67) {
    document.body.classList.add("rain");
  } else if (code >= 71 && code <= 77) {
    document.body.classList.add("snow");
  } else if (code >= 80 && code <= 82) {
    document.body.classList.add("rain");
  } else if (code >= 95) {
    document.body.classList.add("storm");
  } else {
    document.body.classList.add("cloudy");
  }
}

function displayForecast(daily) {
  forecastContainer.innerHTML = "";

  for (let i = 0; i < 5; i++) {
    const date = new Date(daily.time[i]);
    const dayName = date.toLocaleDateString("en-US", {
      weekday: "short",
    });
    const maxTemp = Math.round(daily.temperature_2m_max[i]);
    const minTemp = Math.round(daily.temperature_2m_min[i]);
    const weatherCode = daily.weather_code[i];
    const card = document.createElement("div");

    card.classList.add("forecast-card");
    card.innerHTML = `
      <h3>${dayName}</h3>
      <div class="forecast-icon">${getWeatherIcon(weatherCode)}</div>
      <div class="temperature">${maxTemp}°C</div>
      <p>${minTemp}°C</p>
      <p class="forecast-description">${getWeatherDescription(weatherCode)}</p>
    `;

    forecastContainer.appendChild(card);
  }
}
