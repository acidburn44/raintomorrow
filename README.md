# 내일 비와? - 날씨 예보 대시보드

시간대별로 비 예보를 알려주는 간단한 웹 대시보드입니다.

## 기능

- **시간대별 비 예보 확인**
  - 오전 0시~오후 12시: 당일 오후 12시부터 자정까지의 비 예보
  - 오후 12시~자정: 다음날 오전의 비 예보

- **직관적인 UI**
  - 날씨 상황을 나타내는 이모지 아이콘
  - 비가 올 때 "비 와" 텍스트 강조 표시
  - 날씨에 따른 배경색 변화

- **반응형 디자인**
  - 모바일과 데스크톱 모두 지원

## 사용 방법

### 1. API 키 설정 (실제 날씨 데이터 사용시)

1. [WeatherAPI.com](https://www.weatherapi.com/)에서 무료 API 키를 발급받습니다.
2. `script.js` 파일의 `API_KEY` 변수에 발급받은 키를 입력합니다:

```javascript
const API_KEY = 'your_actual_api_key_here';
```

### 2. 애드센스 광고 설정 (선택사항)

1. [Google AdSense](https://www.google.com/adsense/)에서 계정을 생성합니다.
2. `index.html` 파일의 애드센스 코드를 수정합니다:
   - `ca-pub-XXXXXXXXX`를 실제 퍼블리셔 ID로 교체
   - `data-ad-slot="XXXXXXXXX"`를 실제 광고 슬롯 ID로 교체
3. 데모 광고 부분(`<div class="demo-ad">`)을 제거합니다.

### 3. 실행

1. 웹 브라우저에서 `index.html` 파일을 엽니다.
2. 위치 권한을 허용합니다.
3. 날씨 정보가 자동으로 표시됩니다.

### 4. 데모 모드

API 키 없이도 데모 데이터로 기능을 확인할 수 있습니다.

## 파일 구조

```
raintomorrow/
├── index.html      # 메인 HTML 파일
├── styles.css      # CSS 스타일
├── script.js       # JavaScript 로직
└── README.md       # 사용 설명서
```

## 기술 스택

- **HTML5**: 웹 구조
- **CSS3**: 스타일링 및 애니메이션
- **JavaScript (ES6+)**: 날씨 API 연동 및 로직
- **WeatherAPI.com**: 날씨 데이터 제공

## 브라우저 지원

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 라이선스

MIT License
