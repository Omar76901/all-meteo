export const metNorwayFixture = {
  properties: {
    timeseries: [
      {
        time: '2026-07-15T12:00:00Z',
        data: {
          instant: { details: {
            air_temperature: 21.0, relative_humidity: 56,
            wind_speed: 2.5, wind_speed_of_gust: 4.5, wind_from_direction: 185,
            air_pressure_at_sea_level: 1013.2, ultraviolet_index_clear_sky: 3.1,
          } },
          next_1_hours: {
            summary: { symbol_code: 'partlycloudy_day' },
            details: { precipitation_amount: 0 },
          },
        },
      },
      {
        time: '2026-07-15T13:00:00Z',
        data: {
          instant: { details: { air_temperature: 21.8, wind_speed: 3.0, wind_from_direction: 190 } },
          next_1_hours: { summary: { symbol_code: 'lightrain' }, details: { precipitation_amount: 0.4 } },
        },
      },
      { // punto senza next_1_hours (code lontane nel tempo): niente precipitazione/codice
        time: '2026-07-18T12:00:00Z',
        data: { instant: { details: { air_temperature: 19.0 } } },
      },
    ],
  },
};
