// frontend/js/map.js
class AirQualityMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.currentPollutant = 'pm25';
        this.init();
    }

    init() {
        this.createMap();
        this.loadMapData();
        this.setupEventListeners();
    }

    createMap() {
        this.map = L.map('globalMap').setView(CONFIG.DEFAULT_MAP_CENTER, CONFIG.DEFAULT_MAP_ZOOM);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add Mapbox styles for better visualization (optional)
        L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=${CONFIG.MAPBOX_ACCESS_TOKEN}`, {
            attribution: '© Mapbox'
        }).addTo(this.map);
    }

    async loadMapData() {
        try {
            const cityData = await apiService.getCitiesGeoData();
            this.renderCityMarkers(cityData);
            this.updateMapLegend();
        } catch (error) {
            console.error('Failed to load map data:', error);
        }
    }

    renderCityMarkers(cityData) {
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        cityData.forEach(city => {
            if (city.coordinates && city.coordinates.lat && city.coordinates.lng) {
                const marker = this.createCityMarker(city);
                marker.addTo(this.map);
                this.markers.push(marker);
            }
        });
    }

    createCityMarker(city) {
        const pm25Level = city.avg_pm25 || 0;
        const riskLevel = this.getRiskLevel(pm25Level);
        const color = this.getColorForRisk(riskLevel);
        
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    background-color: ${color};
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    cursor: pointer;
                "></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const marker = L.marker([city.coordinates.lat, city.coordinates.lng], { icon });
        
        marker.bindPopup(`
            <div class="map-popup">
                <h3>${city._id.city}, ${city._id.country}</h3>
                <p><strong>Average PM2.5:</strong> ${pm25Level.toFixed(2)} µg/m³</p>
                <p><strong>Risk Level:</strong> ${riskLevel}</p>
                <p><strong>Predictions:</strong> ${city.prediction_count}</p>
                <p><strong>Last Updated:</strong> ${new Date(city.latest_prediction).toLocaleDateString()}</p>
            </div>
        `);

        return marker;
    }

    getRiskLevel(pm25) {
        if (pm25 <= 12) return 'Good';
        if (pm25 <= 35.4) return 'Moderate';
        if (pm25 <= 55.4) return 'Unhealthy for Sensitive Groups';
        if (pm25 <= 150.4) return 'Unhealthy';
        return 'Very Unhealthy';
    }

    getColorForRisk(riskLevel) {
        const colors = {
            'Good': '#00e400',
            'Moderate': '#ffff00',
            'Unhealthy for Sensitive Groups': '#ff7e00',
            'Unhealthy': '#ff0000',
            'Very Unhealthy': '#8f3f97'
        };
        return colors[riskLevel] || '#cccccc';
    }

    updateMapLegend() {
        const legend = document.getElementById('mapLegend');
        legend.innerHTML = `
            <div class="map-legend-content">
                <h4>Air Quality Index</h4>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #00e400"></span>
                    <span>Good (0-12)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #ffff00"></span>
                    <span>Moderate (12-35.4)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #ff7e00"></span>
                    <span>Unhealthy for Sensitive Groups (35.4-55.4)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #ff0000"></span>
                    <span>Unhealthy (55.4-150.4)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #8f3f97"></span>
                    <span>Very Unhealthy (150.4+)</span>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        document.getElementById('pollutantFilter')?.addEventListener('change', (e) => {
            this.currentPollutant = e.target.value;
            this.loadMapData();
        });

        document.getElementById('dateFilter')?.addEventListener('change', (e) => {
            // Implement date-based filtering
            this.loadMapData();
        });
    }
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.airQualityMap = new AirQualityMap();
});