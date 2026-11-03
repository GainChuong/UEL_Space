const fs = require('fs');
const path = require('path');

const avatars = [
  {
    name: 'seller_techpark.svg',
    initials: 'KG',
    title: 'Kim Giang',
    bgStart: '#002D5C',
    bgEnd: '#00509E',
    accent: '#38BDF8',
    sub: 'TechPark'
  },
  {
    name: 'seller_innovate.svg',
    initials: 'HL',
    title: 'Hoàng Long',
    bgStart: '#0369A1',
    bgEnd: '#0284C7',
    accent: '#7DD3FC',
    sub: 'Innovate'
  },
  {
    name: 'seller_landmark.svg',
    initials: 'MK',
    title: 'Minh Khoa',
    bgStart: '#1E293B',
    bgEnd: '#334155',
    accent: '#94A3B8',
    sub: 'Landmark'
  },
  {
    name: 'seller_green.svg',
    initials: 'MA',
    title: 'Mai Anh',
    bgStart: '#065F46',
    bgEnd: '#059669',
    accent: '#6EE7B7',
    sub: 'GreenHub'
  },
  {
    name: 'seller_startup.svg',
    initials: 'QH',
    title: 'Quốc Huy',
    bgStart: '#B45309',
    bgEnd: '#D97706',
    accent: '#FDE68A',
    sub: 'Startup'
  },
  {
    name: 'seller_uel.svg',
    initials: 'UEL',
    title: 'UEL Smart Campus',
    bgStart: '#001D3D',
    bgEnd: '#003566',
    accent: '#FFC300',
    sub: 'Admin'
  },
  {
    name: 'user_avatar_1.svg',
    initials: 'VA',
    title: 'Văn An',
    bgStart: '#1E3A8A',
    bgEnd: '#2563EB',
    accent: '#93C5FD',
    sub: 'User'
  },
  {
    name: 'user_avatar_2.svg',
    initials: 'TB',
    title: 'Thị Bích',
    bgStart: '#047857',
    bgEnd: '#10B981',
    accent: '#A7F3D0',
    sub: 'User'
  },
  {
    name: 'user_avatar_3.svg',
    initials: 'MT',
    title: 'Minh Tâm',
    bgStart: '#475569',
    bgEnd: '#64748B',
    accent: '#CBD5E1',
    sub: 'User'
  },
  {
    name: 'user_avatar_4.svg',
    initials: 'KN',
    title: 'Kim Ngân',
    bgStart: '#0F766E',
    bgEnd: '#14B8A6',
    accent: '#99F6E4',
    sub: 'User'
  },
  {
    name: 'default_avatar.svg',
    initials: 'US',
    title: 'UEL Space',
    bgStart: '#001428',
    bgEnd: '#002B49',
    accent: '#38BDF8',
    sub: 'Member'
  }
];

function createSvg(av) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="grad-${av.initials}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${av.bgStart}"/>
      <stop offset="100%" stop-color="${av.bgEnd}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.25"/>
    </filter>
  </defs>
  <!-- Background circle -->
  <rect width="200" height="200" rx="100" fill="url(#grad-${av.initials})" />
  <!-- Inner subtle border -->
  <circle cx="100" cy="100" r="95" fill="none" stroke="${av.accent}" stroke-width="3" stroke-opacity="0.35" />
  <!-- Initials Text -->
  <text x="100" y="${av.initials.length > 2 ? 108 : 114}" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${av.initials.length > 2 ? 46 : 64}" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1" filter="url(#shadow)">
    ${av.initials}
  </text>
  <!-- Sub label badge -->
  <rect x="50" y="146" width="100" height="24" rx="12" fill="${av.bgStart}" fill-opacity="0.8" stroke="${av.accent}" stroke-width="1.5" stroke-opacity="0.5"/>
  <text x="100" y="162" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="${av.accent}" text-anchor="middle" letter-spacing="1" text-transform="uppercase">
    ${av.sub}
  </text>
</svg>`;
}

const targetDirs = [
  path.join(__dirname, '../../public/images/avatars'),
  path.join(__dirname, '../../../frontend/public/images/avatars')
];

for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  for (const av of avatars) {
    const filePath = path.join(dir, av.name);
    fs.writeFileSync(filePath, createSvg(av), 'utf8');
    console.log('Created:', filePath);
  }
}
console.log('All local avatars generated successfully!');

