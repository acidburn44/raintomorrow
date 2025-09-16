// 날씨 API 키 (WeatherAPI.com)
const API_KEY = 'your_api_key_here'; // 실제 사용시 API 키를 입력하세요
const API_BASE_URL = 'https://api.weatherapi.com/v1';

// DOM 요소들
const loadingElement = document.getElementById('loading');
const weatherContentElement = document.getElementById('weather-content');
const errorMessageElement = document.getElementById('error-message');
const currentTimeElement = document.getElementById('current-time');
const weatherTitleElement = document.getElementById('weather-title');
const weatherDetailsElement = document.getElementById('weather-details');
const rainAlertElement = document.getElementById('rain-alert');
const snowAlertElement = document.getElementById('snow-alert');
const noRainAlertElement = document.getElementById('no-rain-alert');
const temperatureElement = document.getElementById('temperature');
const weatherImageElement = document.getElementById('weather-image');
const locationElement = document.getElementById('location');

// 날씨 아이콘 매핑
const weatherIcons = {
    'clear': '☀️',
    'clouds': '☁️',
    'rain': '🌧️',
    'drizzle': '🌦️',
    'thunderstorm': '⛈️',
    'snow': '❄️',
    'mist': '🌫️',
    'fog': '🌫️',
    'haze': '🌫️'
};

// 현재 시간 표시
function updateCurrentTime() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'long'
    };
    currentTimeElement.textContent = now.toLocaleDateString('ko-KR', options);
}

// 위치 정보 가져오기
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => resolve(position),
            error => reject(error),
            { 
                timeout: 15000, 
                enableHighAccuracy: true,
                maximumAge: 300000 // 5분간 캐시 허용
            }
        );
    });
}

// WeatherAPI를 사용한 위치명 가져오기
async function getLocationName(lat, lon) {
    try {
        const url = `${API_BASE_URL}/current.json?key=${API_KEY}&q=${lat},${lon}&lang=ko`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Location fetch failed');
        }
        
        const data = await response.json();
        return `${data.location.name}, ${data.location.country}`;
    } catch (error) {
        console.error('Location name fetch error:', error);
        return '현재 위치';
    }
}

// WeatherAPI를 사용한 현재 날씨 가져오기
async function getCurrentWeather(lat, lon) {
    const url = `${API_BASE_URL}/current.json?key=${API_KEY}&q=${lat},${lon}&lang=ko`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error('Weather data fetch failed');
    }
    
    return await response.json();
}

// WeatherAPI를 사용한 예보 데이터 가져오기 (3일 예보)
async function getForecast(lat, lon) {
    const url = `${API_BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=3&lang=ko`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error('Forecast data fetch failed');
    }
    
    return await response.json();
}

// WeatherAPI 데이터로 시간대별 날씨 예보 확인
function checkRainForecast(forecastData) {
    const now = new Date();
    const currentHour = now.getHours();
    
    let targetPeriod = '';
    let checkStartHour, checkEndHour;
    let targetDay = 0; // 0: 오늘, 1: 내일
    
    if (currentHour >= 0 && currentHour < 12) {
        // 오전 0시~오후 12시: 당일 오후 12시부터 자정까지 확인
        targetPeriod = '오늘 오후 12시부터 자정까지';
        checkStartHour = 12;
        checkEndHour = 23;
        targetDay = 0;
    } else {
        // 오후 12시~자정: 다음날 오전 확인
        targetPeriod = '내일 오전';
        checkStartHour = 6;
        checkEndHour = 11;
        targetDay = 1;
    }
    
    let willRain = false;
    let willSnow = false;
    let rainProbability = 0;
    const relevantForecasts = [];
    
    // WeatherAPI 예보 데이터 구조에 맞게 수정
    const targetDayData = forecastData.forecast.forecastday[targetDay];
    if (targetDayData && targetDayData.hour) {
        targetDayData.hour.forEach(hourData => {
            const hour = new Date(hourData.time).getHours();
            
            if (hour >= checkStartHour && hour <= checkEndHour) {
                relevantForecasts.push(hourData);
                
                // 날씨 조건 확인
                const condition = hourData.condition.text.toLowerCase();
                const weatherCode = hourData.condition.code;
                
                // 비 관련 날씨 확인 (WeatherAPI 조건 코드 기준)
                if (condition.includes('rain') || condition.includes('drizzle') || 
                    condition.includes('shower') || condition.includes('thunderstorm') ||
                    [1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246, 1273, 1276].includes(weatherCode)) {
                    willRain = true;
                }
                
                // 눈 관련 날씨 확인
                if (condition.includes('snow') || condition.includes('sleet') || condition.includes('blizzard') ||
                    [1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264, 1279, 1282].includes(weatherCode)) {
                    willSnow = true;
                }
                
                // 강수 확률 확인
                if (hourData.chance_of_rain && hourData.chance_of_rain > rainProbability) {
                    rainProbability = hourData.chance_of_rain;
                }
                if (hourData.chance_of_snow && hourData.chance_of_snow > rainProbability) {
                    rainProbability = hourData.chance_of_snow;
                }
            }
        });
    }
    
    return {
        willRain,
        willSnow,
        rainProbability,
        targetPeriod,
        relevantForecasts
    };
}

// 날씨 아이콘 설정
function setWeatherIcon(weatherMain) {
    const iconKey = weatherMain.toLowerCase();
    const icon = weatherIcons[iconKey] || '🌤️';
    
    // 이모지를 이미지 대신 직접 표시
    weatherImageElement.style.display = 'none';
    const iconDiv = document.createElement('div');
    iconDiv.style.fontSize = '110px'; /* 크기 증가 */
    iconDiv.style.marginBottom = '20px'; /* 마진 증가 */
    iconDiv.textContent = icon;
    
    const weatherIconContainer = document.querySelector('.weather-icon');
    weatherIconContainer.innerHTML = '';
    weatherIconContainer.appendChild(iconDiv);
}

// 배경색 변경
function updateBackgroundColor(weatherMain, willRain) {
    const body = document.body;
    body.className = ''; // 기존 클래스 제거
    
    if (willRain) {
        body.classList.add('rainy');
    } else if (weatherMain.toLowerCase().includes('clear')) {
        body.classList.add('sunny');
    } else if (weatherMain.toLowerCase().includes('cloud')) {
        body.classList.add('cloudy');
    } else if (weatherMain.toLowerCase().includes('snow')) {
        body.classList.add('snowy');
    }
}

// WeatherAPI 데이터로 날씨 정보 표시
function displayWeatherInfo(currentWeather, weatherForecast) {
    const { willRain, willSnow, rainProbability, targetPeriod } = weatherForecast;
    
    // WeatherAPI 데이터 구조에 맞게 수정
    weatherTitleElement.textContent = currentWeather.current.condition.text;
    temperatureElement.textContent = `${Math.round(currentWeather.current.temp_c)}°C`;
    // 위치 정보는 이미 메인 함수에서 설정됨
    
    // 날씨 아이콘 설정 (WeatherAPI 조건 텍스트 기준)
    setWeatherIcon(currentWeather.current.condition.text);
    
    // 배경색 변경
    updateBackgroundColor(currentWeather.current.condition.text, willRain || willSnow);
    
    // 날씨 예보 정보 및 알림 표시
    if (willRain) {
        weatherDetailsElement.innerHTML = `
            <strong>${targetPeriod}</strong>에 비가 올 예정입니다.<br>
            <span style="color: #0984e3;">강수 확률: ${rainProbability}%</span>
        `;
        rainAlertElement.style.display = 'block';
        snowAlertElement.style.display = 'none';
        noRainAlertElement.style.display = 'none';
    } else if (willSnow) {
        weatherDetailsElement.innerHTML = `
            <strong>${targetPeriod}</strong>에 눈이 올 예정입니다.<br>
            <span style="color: #636e72;">강수 확률: ${rainProbability}%</span>
        `;
        rainAlertElement.style.display = 'none';
        snowAlertElement.style.display = 'block';
        noRainAlertElement.style.display = 'none';
    } else {
        weatherDetailsElement.innerHTML = `
            <strong>${targetPeriod}</strong>에는 비가 오지 않을 예정입니다.
        `;
        rainAlertElement.style.display = 'none';
        snowAlertElement.style.display = 'none';
        noRainAlertElement.style.display = 'block';
    }
}

// 에러 표시
function showError(message) {
    loadingElement.style.display = 'none';
    weatherContentElement.style.display = 'none';
    errorMessageElement.style.display = 'block';
    errorMessageElement.querySelector('p').textContent = message;
}

// 로딩 표시
function showLoading() {
    loadingElement.style.display = 'flex';
    weatherContentElement.style.display = 'none';
    errorMessageElement.style.display = 'none';
}

// 날씨 콘텐츠 표시
function showWeatherContent() {
    loadingElement.style.display = 'none';
    weatherContentElement.style.display = 'block';
    errorMessageElement.style.display = 'none';
}

// 메인 함수
async function initWeatherDashboard() {
    try {
        showLoading();
        updateCurrentTime();
        
        // API 키 확인
        if (API_KEY === 'your_api_key_here') {
            // 데모 데이터 사용
            showDemoData();
            return;
        }
        
        // 위치 정보 가져오기
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        
        // 현재 날씨와 예보 데이터 가져오기
        const [currentWeather, forecastData] = await Promise.all([
            getCurrentWeather(latitude, longitude),
            getForecast(latitude, longitude)
        ]);
        
        // 위치 정보 업데이트 (WeatherAPI 데이터 구조에 맞게 수정)
        locationElement.textContent = `${currentWeather.location.name}, ${currentWeather.location.country}`;
        
        // 날씨 예보 확인
        const weatherForecast = checkRainForecast(forecastData);
        
        // 날씨 정보 표시
        displayWeatherInfo(currentWeather, weatherForecast);
        showWeatherContent();
        
    } catch (error) {
        console.error('Error:', error);
        
        if (error.code === 1) {
            showError('위치 정보 접근이 거부되었습니다. 위치 권한을 허용해주세요.');
        } else if (error.code === 2) {
            showError('위치 정보를 가져올 수 없습니다.');
        } else if (error.code === 3) {
            showError('위치 정보 요청 시간이 초과되었습니다.');
        } else {
            showError('날씨 정보를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
    }
}

// 데모 데이터 표시 (API 키가 없을 때)
async function showDemoData() {
    try {
        // 현재 위치 정보 가져오기 시도
        const position = await getCurrentPosition();
        const locationName = await getDemoLocationName(position.coords.latitude, position.coords.longitude);
        
        displayDemoWeather(locationName);
    } catch (error) {
        console.log('위치 정보를 가져올 수 없어 기본 위치로 표시합니다:', error);
        displayDemoWeather('현재 위치 (데모)');
    }
}

// 데모용 위치명 가져오기
async function getDemoLocationName(lat, lon) {
    try {
        // 무료 역지오코딩 API 사용 (Nominatim)
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ko`);
        const data = await response.json();
        
        if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.county;
            const country = data.address.country_code?.toUpperCase() || 'KR';
            return `${city || '현재 위치'}, ${country} (데모)`;
        }
        
        return '현재 위치 (데모)';
    } catch (error) {
        console.error('Demo location fetch error:', error);
        return '현재 위치 (데모)';
    }
}

// 데모 날씨 표시
function displayDemoWeather(locationName) {
    const now = new Date();
    const currentHour = now.getHours();
    
    // 랜덤하게 날씨 결정 (비, 눈, 맑음)
    const weatherType = Math.random();
    const willRain = weatherType < 0.33;
    const willSnow = weatherType >= 0.33 && weatherType < 0.66;
    const isClear = weatherType >= 0.66;
    
    let targetPeriod = '';
    if (currentHour >= 0 && currentHour < 12) {
        targetPeriod = '오늘 오후 12시부터 자정까지';
    } else {
        targetPeriod = '내일 오전';
    }
    
    // 데모 날씨 정보
    let weatherDescription = '맑음';
    let weatherIcon = 'clear';
    if (willRain) {
        weatherDescription = '소나기';
        weatherIcon = 'rain';
    } else if (willSnow) {
        weatherDescription = '눈';
        weatherIcon = 'snow';
    }
    
    weatherTitleElement.textContent = weatherDescription;
    temperatureElement.textContent = `${Math.round(Math.random() * 10 + 15)}°C`;
    locationElement.textContent = locationName;
    
    // 날씨 아이콘 설정
    setWeatherIcon(weatherIcon);
    
    // 배경색 변경
    updateBackgroundColor(weatherIcon, willRain || willSnow);
    
    // 날씨 예보 정보 및 알림 표시
    if (willRain) {
        weatherDetailsElement.innerHTML = `
            <strong>${targetPeriod}</strong>에 비가 올 예정입니다.<br>
            <span style="color: #0984e3;">강수 확률: ${Math.round(Math.random() * 40 + 60)}%</span><br>
            <small style="color: #999;">※ 데모 데이터입니다. 실제 사용을 위해서는 API 키가 필요합니다.</small>
        `;
        rainAlertElement.style.display = 'block';
        snowAlertElement.style.display = 'none';
        noRainAlertElement.style.display = 'none';
    } else if (willSnow) {
        weatherDetailsElement.innerHTML = `
            <strong>${targetPeriod}</strong>에 눈이 올 예정입니다.<br>
            <span style="color: #636e72;">강수 확률: ${Math.round(Math.random() * 40 + 60)}%</span><br>
            <small style="color: #999;">※ 데모 데이터입니다. 실제 사용을 위해서는 API 키가 필요합니다.</small>
        `;
        rainAlertElement.style.display = 'none';
        snowAlertElement.style.display = 'block';
        noRainAlertElement.style.display = 'none';
    } else {
        weatherDetailsElement.innerHTML = `
            <strong>${targetPeriod}</strong>에는 비가 오지 않을 예정입니다.<br>
            <small style="color: #999;">※ 데모 데이터입니다. 실제 사용을 위해서는 API 키가 필요합니다.</small>
        `;
        rainAlertElement.style.display = 'none';
        snowAlertElement.style.display = 'none';
        noRainAlertElement.style.display = 'block';
    }
    
    showWeatherContent();
}

// 페이지 로드시 실행
document.addEventListener('DOMContentLoaded', initWeatherDashboard);

// 시간 업데이트 (1분마다)
setInterval(updateCurrentTime, 60000);
