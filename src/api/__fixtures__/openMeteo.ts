export const openMeteoFixture = {
  latitude: 45.46, longitude: 9.19, timezone: 'Europe/Rome',
  hourly: {
    time: [1784116800, 1784120400, 1784124000],
    temperature_2m: [21.4, 22.1, 22.8],
    apparent_temperature: [20.1, 20.9, 21.5],
    precipitation: [0, 0.2, 0],
    precipitation_probability: [10, 35, 20],
    wind_speed_10m: [8.4, 9.2, 10.1],
    wind_gusts_10m: [15.3, 17.0, 19.2],
    wind_direction_10m: [180, 190, 200],
    relative_humidity_2m: [55, 52, 50],
    surface_pressure: [1013.0, 1012.5, 1012.0],
    uv_index: [3.2, 4.0, 4.5],
    weather_code: [1, 2, 2],
  },
  daily: {
    time: [1784073600],
    temperature_2m_min: [16.2],
    temperature_2m_max: [24.8],
    precipitation_sum: [1.2],
    precipitation_probability_max: [45],
    wind_speed_10m_max: [14.2],
    weather_code: [2],
    sunrise: [1784088000],
    sunset: [1784142600],
  },
};

/** Come sopra ma con chiavi suffissate dal modello e senza uv_index (caso ECMWF). */
export const openMeteoSuffixedFixture = {
  latitude: 45.46, longitude: 9.19, timezone: 'Europe/Rome',
  hourly: {
    time: [1784116800],
    temperature_2m_ecmwf_ifs025: [21.0],
    precipitation_ecmwf_ifs025: [0],
    weather_code_ecmwf_ifs025: [1],
  },
  daily: { time: [1784073600], temperature_2m_max_ecmwf_ifs025: [24.0] },
};
