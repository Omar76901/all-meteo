export const geocodingFixture = {
  results: [
    { name: 'Milano', latitude: 45.4643, longitude: 9.1895, country: 'Italia', admin1: 'Lombardia' },
    { name: 'Milano', latitude: 45.6, longitude: 9.3, country: 'Italia' }, // senza admin1
  ],
};
export const reverseFixture = { city: 'Milano', locality: 'Brera', principalSubdivision: 'Lombardia' };
export const rainviewerFixture = {
  host: 'https://tilecache.rainviewer.com',
  radar: {
    past: [
      { time: 1789470000, path: '/v2/radar/1789470000' },
      { time: 1789470600, path: '/v2/radar/1789470600' },
    ],
    nowcast: [{ time: 1789471200, path: '/v2/radar/nowcast_abc' }],
  },
};
