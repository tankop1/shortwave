const ROLE_HUES = {
  Director: 28,
  Writer: 28,
  DP: 200,
  Gaffer: 200,
  Editor: 150,
  Sound: 150,
  Producer: 300,
  Grip: 200,
  Colorist: 150,
  Lead: 28,
  '1st AD': 300,
  'Prod. Design': 300,
  Cast: 28,
}

export function roleChip(role) {
  const h = ROLE_HUES[role] ?? 40
  return {
    border: `oklch(0.62 0.11 ${h} / .45)`,
    bg: `oklch(0.62 0.11 ${h} / .13)`,
    color: `oklch(0.82 0.11 ${h})`,
  }
}

export function stripe(h, a) {
  return `repeating-linear-gradient(${a}deg, oklch(0.26 0.035 ${h}), oklch(0.26 0.035 ${h}) 9px, oklch(0.21 0.028 ${h}) 9px, oklch(0.21 0.028 ${h}) 18px)`
}

export function avatar(h) {
  return `linear-gradient(150deg, oklch(0.42 0.06 ${h}), oklch(0.24 0.03 ${h}))`
}

const still = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`

export const FILMS = [
  {
    id: 'caliche',
    title: 'Caliche',
    maker: 'Jules Fontaine',
    genre: 'Drama',
    dur: '14:22',
    year: '2026',
    hue: 40,
    ang: 112,
    poster: still('photo-1509316785289-025f5b846b35'),
    label: 'still — dry riverbed at dusk',
    logline:
      "A brother and sister drive their father's truck to the county line to sell it, and spend the whole way there not saying the thing.",
    credits: [
      ['Jules Fontaine', 'Director'],
      ['Maya Reyes', 'Gaffer'],
      ['Tobi Adeyemi', 'DP'],
      ['Priya Nair', 'Editor'],
      ['Sam Ordoñez', 'Sound'],
      ['Elena Vasquez', 'Cast'],
    ],
    yourRole: 'Gaffer',
  },
  {
    id: 'pecan',
    title: 'Pecan Street, 4 A.M.',
    maker: 'Maya Reyes',
    genre: 'Doc',
    dur: '08:51',
    year: '2026',
    hue: 70,
    ang: 96,
    poster: still('photo-1519608487953-e999c86e7455'),
    label: 'still — wet asphalt, neon',
    logline: 'The taco truck crew who feed downtown after last call, told in one continuous shift.',
    credits: [
      ['Maya Reyes', 'Director'],
      ['Tobi Adeyemi', 'DP'],
      ['Sam Ordoñez', 'Sound'],
      ['Priya Nair', 'Editor'],
    ],
  },
  {
    id: 'redriver',
    title: 'Red River Runs Both Ways',
    maker: 'Tobi Adeyemi',
    genre: 'Thriller',
    dur: '19:04',
    year: '2026',
    hue: 20,
    ang: 128,
    poster: still('photo-1514565131-fce0801e5785'),
    label: 'still — headlights on a bridge',
    logline: 'A rideshare driver realizes her 2 a.m. fare has been in her car before.',
    credits: [
      ['Tobi Adeyemi', 'Director'],
      ['Dana Whitlock', 'DP'],
      ['Jules Fontaine', '1st AD'],
      ['Maya Reyes', 'Gaffer'],
      ['Ruth Kim', 'Prod. Design'],
    ],
    yourRole: 'Gaffer',
  },
  {
    id: 'tuesday',
    title: 'Every Tuesday Is Fine',
    maker: 'Priya Nair',
    genre: 'Comedy',
    dur: '06:33',
    year: '2026',
    hue: 100,
    ang: 88,
    poster: still('photo-1545173168-9f1947eebb7f'),
    label: 'still — laundromat interior',
    logline: 'Two roommates weaponize a chore wheel. Escalation follows.',
    credits: [
      ['Priya Nair', 'Director'],
      ['Ruth Kim', 'DP'],
      ['Elena Vasquez', 'Cast'],
      ['Marco Diaz', 'Editor'],
    ],
  },
  {
    id: 'heat',
    title: 'Heat Index',
    maker: 'Dana Whitlock',
    genre: 'Doc',
    dur: '11:47',
    year: '2026',
    hue: 55,
    ang: 104,
    poster: still('photo-1502672260266-1c1ef2d93688'),
    label: 'still — window unit, 104°F',
    logline: 'August in a fourth-floor walk-up with no AC and one working fan.',
    credits: [
      ['Dana Whitlock', 'Director'],
      ['Sam Ordoñez', 'Sound'],
      ['Priya Nair', 'Editor'],
    ],
  },
  {
    id: 'kolache',
    title: 'Kolache Wars',
    maker: 'Marco Diaz',
    genre: 'Comedy',
    dur: '09:12',
    year: '2025',
    hue: 85,
    ang: 120,
    poster: still('photo-1509440159596-0249088772ff'),
    label: 'still — bakery counter, 6 a.m.',
    logline: 'Two Czech bakeries, one small town, forty years of grievance.',
    credits: [
      ['Marco Diaz', 'Director'],
      ['Ruth Kim', 'DP'],
      ['Jules Fontaine', 'Editor'],
    ],
  },
  {
    id: 'lamar',
    title: 'Under Lamar',
    maker: 'Ruth Kim',
    genre: 'Experimental',
    dur: '04:38',
    year: '2026',
    hue: 250,
    ang: 100,
    poster: still('photo-1480714378408-67cf0d13bc1b'),
    label: 'still — bats leaving the bridge',
    logline: 'Ninety seconds of bats, stretched to four minutes and scored for cello.',
    credits: [
      ['Ruth Kim', 'Director'],
      ['Sam Ordoñez', 'Sound'],
    ],
  },
  {
    id: 'sixmonths',
    title: 'Six Months of Sundays',
    maker: 'Elena Vasquez',
    genre: 'Drama',
    dur: '16:09',
    year: '2025',
    hue: 15,
    ang: 116,
    poster: still('photo-1438032005730-c779502df39b'),
    label: 'still — church parking lot',
    logline: 'A woman visits her mother every Sunday for six months, and once for the last time.',
    credits: [
      ['Elena Vasquez', 'Director'],
      ['Tobi Adeyemi', 'DP'],
      ['Marco Diaz', 'Editor'],
      ['Dana Whitlock', 'Gaffer'],
    ],
  },
  {
    id: 'greenbelt',
    title: 'Greenbelt',
    maker: 'Sam Ordoñez',
    genre: 'Drama',
    dur: '12:55',
    year: '2026',
    hue: 145,
    ang: 92,
    poster: still('photo-1432405972618-c60b0225b8f9'),
    label: 'still — limestone creek bed',
    logline: 'Three friends swim at Barton Springs the day before one of them leaves for good.',
    credits: [
      ['Sam Ordoñez', 'Director'],
      ['Maya Reyes', 'DP'],
      ['Priya Nair', 'Editor'],
    ],
  },
]

export function decorateFilm(film) {
  return {
    ...film,
    stripe: stripe(film.hue, film.ang),
    meta: `${film.maker} · ${film.dur} · ${film.genre} · ${film.year}`,
    credits: film.credits.map(([name, role]) => ({
      name,
      role,
      stripe: avatar(ROLE_HUES[role] ?? 40),
      ...roleChip(role),
    })),
  }
}

export const GENRES = ['Drama', 'Doc', 'Comedy', 'Thriller', 'Experimental']

export const NAV = [
  {
    section: 'Watch',
    items: [
      { id: 'home', label: 'Home', icon: 'home' },
      { id: 'browse', label: 'Browse', icon: 'compass' },
    ],
  },
  {
    section: 'Make',
    items: [
      { id: 'projects', label: 'My Projects', icon: 'folder' },
      { id: 'upload', label: 'Upload', icon: 'plus' },
    ],
  },
  {
    section: 'You',
    items: [
      { id: 'portfolio', label: 'Portfolio', icon: 'clapper' },
      { id: 'saved', label: 'Your list', icon: 'heart' },
    ],
  },
]

export const MENU_ITEMS = [
  'Profile & roles',
  'Portfolio settings',
  'Credit requests · 2',
  'Account settings',
]
