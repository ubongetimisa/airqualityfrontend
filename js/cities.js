// frontend/js/cities.js
// Global cities database with 50+ major cities

class CitiesManager {
    constructor() {
        this.cities = [
            // Asia
            { name: 'Beijing', country: 'China', region: 'Asia' },
            { name: 'Shanghai', country: 'China', region: 'Asia' },
            { name: 'Delhi', country: 'India', region: 'Asia' },
            { name: 'Mumbai', country: 'India', region: 'Asia' },
            { name: 'Bangalore', country: 'India', region: 'Asia' },
            { name: 'Tokyo', country: 'Japan', region: 'Asia' },
            { name: 'Bangkok', country: 'Thailand', region: 'Asia' },
            { name: 'Singapore', country: 'Singapore', region: 'Asia' },
            { name: 'Seoul', country: 'South Korea', region: 'Asia' },
            { name: 'Hanoi', country: 'Vietnam', region: 'Asia' },
            { name: 'Ho Chi Minh City', country: 'Vietnam', region: 'Asia' },
            { name: 'Manila', country: 'Philippines', region: 'Asia' },
            { name: 'Kuala Lumpur', country: 'Malaysia', region: 'Asia' },
            { name: 'Jakarta', country: 'Indonesia', region: 'Asia' },
            { name: 'Karachi', country: 'Pakistan', region: 'Asia' },
            { name: 'Lahore', country: 'Pakistan', region: 'Asia' },
            { name: 'Dhaka', country: 'Bangladesh', region: 'Asia' },
            { name: 'Hong Kong', country: 'Hong Kong', region: 'Asia' },
            { name: 'Tel Aviv', country: 'Israel', region: 'Asia' },
            
            // Europe
            { name: 'London', country: 'United Kingdom', region: 'Europe' },
            { name: 'Paris', country: 'France', region: 'Europe' },
            { name: 'Berlin', country: 'Germany', region: 'Europe' },
            { name: 'Madrid', country: 'Spain', region: 'Europe' },
            { name: 'Rome', country: 'Italy', region: 'Europe' },
            { name: 'Moscow', country: 'Russia', region: 'Europe' },
            { name: 'Istanbul', country: 'Turkey', region: 'Europe' },
            { name: 'Amsterdam', country: 'Netherlands', region: 'Europe' },
            { name: 'Brussels', country: 'Belgium', region: 'Europe' },
            { name: 'Vienna', country: 'Austria', region: 'Europe' },
            { name: 'Prague', country: 'Czech Republic', region: 'Europe' },
            { name: 'Warsaw', country: 'Poland', region: 'Europe' },
            { name: 'Stockholm', country: 'Sweden', region: 'Europe' },
            { name: 'Zurich', country: 'Switzerland', region: 'Europe' },
            { name: 'Geneva', country: 'Switzerland', region: 'Europe' },
            { name: 'Athens', country: 'Greece', region: 'Europe' },
            { name: 'Lisbon', country: 'Portugal', region: 'Europe' },
            { name: 'Dublin', country: 'Ireland', region: 'Europe' },
            
            // Americas
            { name: 'New York', country: 'USA', region: 'Americas' },
            { name: 'Los Angeles', country: 'USA', region: 'Americas' },
            { name: 'Chicago', country: 'USA', region: 'Americas' },
            { name: 'Houston', country: 'USA', region: 'Americas' },
            { name: 'San Francisco', country: 'USA', region: 'Americas' },
            { name: 'Toronto', country: 'Canada', region: 'Americas' },
            { name: 'Vancouver', country: 'Canada', region: 'Americas' },
            { name: 'Mexico City', country: 'Mexico', region: 'Americas' },
            { name: 'São Paulo', country: 'Brazil', region: 'Americas' },
            { name: 'Rio de Janeiro', country: 'Brazil', region: 'Americas' },
            { name: 'Buenos Aires', country: 'Argentina', region: 'Americas' },
            
            // Africa
            { name: 'Cairo', country: 'Egypt', region: 'Africa' },
            { name: 'Lagos', country: 'Nigeria', region: 'Africa' },
            { name: 'Johannesburg', country: 'South Africa', region: 'Africa' },
            { name: 'Cape Town', country: 'South Africa', region: 'Africa' },
            { name: 'Nairobi', country: 'Kenya', region: 'Africa' },
            { name: 'Accra', country: 'Ghana', region: 'Africa' },
            { name: 'Casablanca', country: 'Morocco', region: 'Africa' },
            
            // Oceania
            { name: 'Sydney', country: 'Australia', region: 'Oceania' },
            { name: 'Melbourne', country: 'Australia', region: 'Oceania' },
            { name: 'Brisbane', country: 'Australia', region: 'Oceania' },
            { name: 'Auckland', country: 'New Zealand', region: 'Oceania' }
        ];
        
        this.sortedCities = this.cities.sort((a, b) => a.name.localeCompare(b.name));
        this.init();
    }

    init() {
        this.populateCityDropdown();
    }

    populateCityDropdown() {
        const citySelect = document.getElementById('citySelect');
        if (!citySelect) return;

        // Clear existing options except the first one
        while (citySelect.options.length > 1) {
            citySelect.remove(1);
        }

        // Group cities by region
        const regions = {};
        this.sortedCities.forEach(city => {
            if (!regions[city.region]) {
                regions[city.region] = [];
            }
            regions[city.region].push(city);
        });

        // Create optgroups for each region
        Object.keys(regions).sort().forEach(region => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = region;

            regions[region].forEach(city => {
                const option = document.createElement('option');
                option.value = city.name;  // Store only the city name
                option.textContent = `${city.name}, ${city.country}`;
                optgroup.appendChild(option);
            });

            citySelect.appendChild(optgroup);
        });

        // Add change event listener
        citySelect.addEventListener('change', (e) => this.onCitySelected(e));
    }

    onCitySelected(event) {
        const selectedCity = event.target.value;
        if (selectedCity) {
            // Find the city data to get country
            const cityData = this.sortedCities.find(city => city.name === selectedCity);
            if (cityData) {
                const countryInput = document.getElementById('countrySelect');
                countryInput.value = cityData.country;
            }
        }
    }

    getCityCount() {
        return this.cities.length;
    }

    getCities() {
        return this.sortedCities;
    }

    getCitiesByCountry(country) {
        return this.cities.filter(city => city.country === country);
    }

    getCitiesByRegion(region) {
        return this.cities.filter(city => city.region === region);
    }
}

// Initialize cities manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.citiesManager = new CitiesManager();
});
