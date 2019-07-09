
var skycons = new Skycons({"color": "black", "resizeClear": true});
skycons.play();

function fitToContainerWidth(canvas){
    // Make it visually fill the positioned parent
    canvas.style.width ='100%';
    // ...then set the internal size to match
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.width;
}

var weathericonComponent = {
    props:['iconName'],
    template: '<canvas ref="canvas" width="100%" height="15px">{{iconName}}</canvas>',
    created: function () {
        this.update()
    },
    updated: function () {
        this.update()
    },
    methods: {
        update() {
            this.$nextTick(function () {
                let canvas = this.$refs.canvas;
                skycons.set(canvas, this.iconName);
                fitToContainerWidth(canvas)
            })
        }
    }
};

var app = new Vue({
    el: '#app',
    components: {
        'weathericon': weathericonComponent
    },
    data: {
        city_name: 'N/A',
        weather_desc: 'N/A',
        city_temp_now: 'N/A',
        city_temp_high: 'N/A',
        city_temp_low: 'N/A',
        weather_icon: '\uf00d',
        temp_unit: '°C',
        units: 'si',
        dailydata: {},
        month: [],
        time: {
            dateobj: undefined,
            year: undefined,
            month: undefined    
        },
        listingdata: [
            {
                city_name: 'San Francisco',
                weather_icon_id: 'SF',
                daily: [
                    {
                        temp: 17,
                        date: 'Today',
                        icon: "partly-cloudy-day"
                    },
                    {
                        temp: 11,
                        date: '7/1',
                        icon: "partly-cloudy-day"
                    },
                    {
                        temp: 10,
                        date: '7/2',
                        icon: "rain"
                    },
                ]
            },
            {
                city_name: 'Napa Valley',
                weather_icon_id: 'NV',
                daily: [
                    {
                        temp: 19,
                        date: '7/3',
                        icon: "rain"
                    },
                ]
            },
            {
                city_name: 'Berkeley',
                weather_icon_id: 'BK',
                daily: [
                    {
                        temp: 16,
                        date: '7/4',
                        icon: "rain"
                    },
                    {
                        temp: 15,
                        date: '7/5',
                        icon: "partly-cloudy-day"
                    },
                    {
                        temp: 17,
                        date: '7/6',
                        icon: "partly-cloudy-day"
                    },
                ]
            },
            {
                city_name: 'Monterey',
                weather_icon_id: 'MT',
                daily: [
                    {
                        temp: 18,
                        date: '7/7',
                        icon: "partly-cloudy-day"
                    },
                    {
                        temp: 19,
                        date: '7/8',
                        icon: "partly-cloudy-day"
                    },
                    {
                        temp: 22,
                        date: '7/9',
                        icon: "partly-cloudy-day"
                    },
                ]
            }
        ]
    }
});

app.time.dateobj = new Date();
app.time.year = app.time.dateobj.getFullYear();
app.time.month = app.time.dateobj.getMonth() + 1;

fitty('.text-fit');

var map = L.map('map');
map.removeControl(map.zoomControl);
map.removeControl(map.attributionControl);
var tangramLayer = Tangram.leafletLayer({
    scene: mapConfigFile,
    attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors'
});
tangramLayer.addTo(map);
map.locate({setView: true, maxZoom: 9.5});

// ===============
// Location stuff

_dsSecret = "8b1e17c579604c79e577e00cf7a7fdcd";

var weather = {};

async function getWeatherByLL(geoLat, geoLng) {
    var proxy = "https://cors-anywhere.herokuapp.com/"
    var dsAPI = "https://api.darksky.net/forecast/";
    var dsKey = _dsSecret + "/";
    var dsParams = "?exclude=minutely,flags&units=" + app.units;
    //Concatenate API Variables into a URLRequest
    var URLRequest = proxy + dsAPI + dsKey + String(geoLat) + "," + String(geoLng) + dsParams;
    var reverseLocationRequest = proxy + "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + geoLat + "&lon=" + geoLng;
    //Make the request
    axios.get(URLRequest)
    .then(response => {
        data = response.data;

        weather = data;

        var wSummary = data.currently.summary;
        var wTemperature = data.currently.temperature.toFixed(0);

        var tempHigh = data.daily.data[0].apparentTemperatureHigh.toFixed(1);
        var tempLow = data.daily.data[0].apparentTemperatureLow.toFixed(1);

        app.weather_desc = wSummary;
        app.city_temp_now = wTemperature;
        app.city_temp_high = tempHigh;
        app.city_temp_low = tempLow;

        let now = new Date();
        let forecastTime = new Date(now);

        for (day in data.daily.data) {
            dailydata = data.daily.data[day]
            let displayedDay = forecastTime.getTime() == now.getTime() ? "Today" : (forecastTime.getMonth() + 1) + "/" + forecastTime.getDate();

            app.dailydata[day] = {
                "day": displayedDay,
                "temp": dailydata.temperatureLow.toFixed(0) + app.temp_unit + " ~ " + dailydata.temperatureHigh.toFixed(0) + app.temp_unit,
                "icon": dailydata.icon
            };

            forecastTime.setDate(forecastTime.getDate() + 1);
        }

        var current_icons = document.getElementsByClassName("weather-icon-current")

        for (let i =0; i < current_icons.length; i++) {
            skycons.set(current_icons[i], data.currently.icon);
            fitToContainerWidth(current_icons[i]);
        }

        axios.get(reverseLocationRequest)
        .then(response => {
            data = response.data;

            app.city_name = data.address.city;
        })

        fitty('.text-fit');
    });
}

var liveMarker;
var userLocation;

function onLocationFound(e) {
    userLocation = e;

    var geoLat = e.latitude;
    var geoLng = e.longitude;
    var geoAcc = e.accuracy;

    getWeatherByLL(geoLat, geoLng);

    moveLiveMarker(e);
}

var berkeley = {
    latitude: 37.8707703,
    longitude: -122.3359993,
    accuracy: 1.0,
    latlng: {
        lat: 37.8707703,
        lng: -122.3359993
    }
};

onLocationFound(berkeley);

map.setView(berkeley.latlng, 9.5, {});

async function moveLiveMarker(e) {
    if (liveMarker) {
        liveMarker.setLatLng(e.latlng);
    } else {
        liveMarker = L.marker(e.latlng);
        liveMarker.addTo(map);    
    }
}

map.on('locationfound', onLocationFound);

// When the user clicks the button, open the modal 
city_card = document.getElementById("city-card");
city_details = document.getElementById("city-details");
city_details_card = document.getElementById("city-details-card");
temperature_hourly_forecast = document.getElementById("temp-hourly-forecast");

city_card.onclick = function() {
    fitty('.text-fit');
    city_details.style.top = 0;

    var current_icons = document.getElementsByClassName("weather-icon-current")
    for (let i =0; i < current_icons.length; i++) {
        fitToContainerWidth(current_icons[i]);
    }

    temperature_hourly_forecast.style.width = city_details_card.offsetWidth + "px";
    drawHourlyForecast();
}
  
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == city_details) {
        city_details.style.top = "100%";
    }
}

location_button = document.getElementById("location");

location_button.onclick = function(event) {
    map.locate({setView: true, enableHighAccuracy: true, maxZoom: 9.5});
}

// attaching function on map click
map.on('click', onMapClick);
map.on('move', ensureLiveMarker);

function onMove() {
    ensureLiveMarker();
}

function ensureLiveMarker() {
    if (liveMarker) {
        liveMarker.setLatLng(userLocation.latlng);
    }
}

// Script for moving liveMarker on map click
function onMapClick(e) {

    var geojsonFeature = {
        "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Point",
                "coordinates": [e.latlng.lat, e.latlng.lng]
        }
    }

    userLocation = e;

    getWeatherByLL(e.latlng.lat, e.latlng.lng);

    moveLiveMarker(e);
}

async function drawHourlyForecast() {
    temperature_hourly_forecast.innerHTML = "";

    // data for the sparklines that appear below header area
    var sparklineData = [];

    for (let i = 0; i < 12; i++) {
        var hourlyData = weather.hourly.data[i];

        sparklineData.push(hourlyData.temperature.toFixed(0))
    }

    var sparkLineTemps = {
        chart: {
            type: 'area',
            height: 96,
            parentHeightOffset: 15,
            sparkline: {
                enabled: true
            },
            dropShadow: {
                enabled: true,
                enabledOnSeries: undefined,
                top: 0,
                left: 0,
                blur: 3,
                color: '#000',
                opacity: 0.2
            },
            fontFamily: 'Scope One, serif'
        },
        stroke: {
            curve: 'smooth'
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 1.0,
                stops: [0, 90, 100],
                colorStops: [
                    {
                      offset: 0,
                      color: "#3ca1ff",
                      opacity: 0.7
                    },
                    {
                      offset: 100,
                      color: "rgba(255,255,255,0)",
                      opacity: 1
                    }
                ]
            }
        },
        series: [{
            data: sparklineData
        }],
        yaxis: {
            max: (max) => { return max + 4; },
            min: (min) => { return min - 4; }
        },
        colors: ['#7ab6EC']
    }

    var sparkLineTemps = new ApexCharts(temperature_hourly_forecast, sparkLineTemps);
    sparkLineTemps.render();
}

var drawer = {
    touchStartY: undefined,
    touchEndY: undefined,
    page1: undefined,
    pageAfter: undefined,
    viewportHeight: undefined,
    startTime: undefined,
    vertPosY: 0,
    init: function() {
        this.page1 = document.getElementById("main-page");
        this.pageAfter = document.getElementById("city-list-page");
        this.viewportHeight = visualViewport.height

        this.page1.ontouchstart = (event) => { this.ontouchstart(event) };
        this.page1.ontouchmove = (event) => { this.ontouchmove(event) };
        this.page1.ontouchend = (event) => { this.ontouchend(event) };
    },
    ontouchstart: function(event) {
        let touch = event.touches[0]
        this.touchStartY = touch.screenY;

        this.startTime = Date.now();

        this.page1.classList.remove("animate");
    },
    ontouchend: function(event) {
        this.page1.classList.add("animate");

        let delta = (this.touchEndY - this.touchStartY);

        let elapsedTime = (Date.now() - this.startTime) / 1000.0;
        let velocity = (delta / this.viewportHeight * 3.0) / elapsedTime;
        delta += 0.5 * Math.abs(velocity) * velocity;

        let newVertPosY = this.vertPosY + delta;
        let bias = this.viewportHeight * 0.2;

        if (this.vertPosY >= 0) {
            // Map page
            if (delta < -bias) {
                this.vertPosY = -this.viewportHeight;
            } else {
                this.vertPosY = 0;
            }
        } else {
            // List page
            if (newVertPosY < -this.pageAfter.offsetHeight) {
                this.vertPosY = -this.pageAfter.offsetHeight;
            } else if (newVertPosY < -this.viewportHeight) {
                this.vertPosY = newVertPosY;
            } else {
                this.vertPosY = 0;
            }
        }

        this.page1.style.transform = "translate3d(0, " + this.vertPosY + "px, 0)";
    },
    ontouchmove: function(event) {
        let touch = event.touches[0]

        this.touchEndY = touch.screenY;
        let offset = this.vertPosY + (this.touchEndY - this.touchStartY);

        this.page1.style.transform = "translate3d(0, " + offset + "px, 0)";
    }
};

drawer.init();

function createCalendar() {
    let now = new Date();
    let monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let offset = monthStart.getDay();
    monthStart.setDate(monthStart.getDate() - offset);

    for (let i = 0; i < 42; i++) {
        app.month.push(monthStart.getDate());
        monthStart.setDate(monthStart.getDate() + 1);
    }
}

createCalendar();