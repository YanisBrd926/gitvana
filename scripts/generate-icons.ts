import { Resvg } from '@resvg/resvg-js';

const sizes = [192, 512];

for (const size of sizes) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.1}" fill="#0a0a0a"/>
    <rect x="${size * 0.05}" y="${size * 0.05}" width="${size * 0.9}" height="${size * 0.9}" rx="${size * 0.08}" fill="none" stroke="#2a2a4e" stroke-width="${size * 0.01}"/>
    <text x="${size / 2}" y="${size * 0.45}" text-anchor="middle" font-family="monospace" font-size="${size * 0.18}" font-weight="bold" fill="#ffa300">GIT</text>
    <text x="${size / 2}" y="${size * 0.72}" text-anchor="middle" font-family="monospace" font-size="${size * 0.13}" fill="#00ff41">VANA</text>
  </svg>`;

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  await Bun.write(`public/icon-${size}.png`, png);
  console.log(`Generated icon-${size}.png`);
}
