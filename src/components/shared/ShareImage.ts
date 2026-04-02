export async function generateShareImage(options: {
  levelTitle: string;
  levelOrder: number;
  act: number;
  stars: number;
  commandCount: number;
  stageName: string;
  stageColor: string;
  completedLevels: number;
  totalLevels: number;
  playerName?: string;
}): Promise<Blob> {
  const W = 1200;
  const H = 630;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // --- Background ---
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid pattern
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x <= W; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // --- Border frame ---
  ctx.strokeStyle = '#2a2a4e';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  // Inner accent lines
  ctx.strokeStyle = '#ffa300';
  ctx.lineWidth = 1;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  // --- Top bar: GITVANA title ---
  const retroFont = '"Press Start 2P", monospace';
  const monoFont = '"JetBrains Mono", monospace';

  ctx.textAlign = 'center';
  ctx.font = `36px ${retroFont}`;
  ctx.fillStyle = '#ffa300';
  ctx.fillText('GITVANA', W / 2, 90);

  // Divider line under title
  ctx.strokeStyle = '#ffa30066';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 115);
  ctx.lineTo(W - 100, 115);
  ctx.stroke();

  // --- Center: STAGE CLEAR! ---
  ctx.font = `32px ${retroFont}`;
  ctx.fillStyle = '#00ff41';
  ctx.fillText('STAGE CLEAR!', W / 2, 190);

  // Level info
  ctx.font = `18px ${monoFont}`;
  ctx.fillStyle = '#c2c3c7';
  const levelLine = `Act ${options.act} — Level ${options.levelOrder}: ${options.levelTitle}`;
  ctx.fillText(levelLine, W / 2, 240);

  // Stars
  const earnedStars = '★'.repeat(options.stars);
  const emptyStars = '☆'.repeat(3 - options.stars);
  const starString = earnedStars + emptyStars;

  ctx.font = `60px ${monoFont}`;
  // Draw earned stars in gold
  const fullStarText = starString;
  const totalWidth = ctx.measureText(fullStarText).width;
  const starStartX = (W - totalWidth) / 2;

  // Earned stars
  ctx.fillStyle = '#ffa300';
  ctx.textAlign = 'left';
  const earnedWidth = ctx.measureText(earnedStars).width;
  ctx.fillText(earnedStars, starStartX, 330);

  // Empty stars
  ctx.fillStyle = '#5f574f';
  ctx.fillText(emptyStars, starStartX + earnedWidth, 330);

  // Command count
  ctx.textAlign = 'center';
  ctx.font = `16px ${monoFont}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(
    `Solved in ${options.commandCount} command${options.commandCount !== 1 ? 's' : ''}`,
    W / 2,
    380
  );

  // Player name
  if (options.playerName) {
    ctx.textAlign = 'center';
    ctx.font = `14px ${monoFont}`;
    ctx.fillStyle = '#5f9ea0';
    ctx.fillText(`Achieved by ${options.playerName}`, W / 2, 415);
  }

  // --- Bottom divider ---
  ctx.strokeStyle = '#2a2a4e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, 440);
  ctx.lineTo(W - 100, 440);
  ctx.stroke();

  // --- Bottom bar ---
  const bottomY = 500;

  // Stage badge (left)
  ctx.textAlign = 'left';
  // Colored dot
  ctx.fillStyle = options.stageColor;
  ctx.beginPath();
  ctx.arc(120, bottomY - 4, 8, 0, Math.PI * 2);
  ctx.fill();
  // Stage name
  ctx.font = `14px ${retroFont}`;
  ctx.fillStyle = options.stageColor;
  ctx.fillText(options.stageName, 140, bottomY);

  // Progress (center)
  ctx.textAlign = 'center';
  ctx.font = `14px ${monoFont}`;
  ctx.fillStyle = '#c2c3c7';
  ctx.fillText(
    `${options.completedLevels}/${options.totalLevels} levels`,
    W / 2,
    bottomY
  );

  // URL (right)
  ctx.textAlign = 'right';
  ctx.font = `14px ${monoFont}`;
  ctx.fillStyle = '#5f574f';
  ctx.fillText('gitvana.pixari.dev', W - 120, bottomY);

  // Convert to blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate share image'));
    }, 'image/png');
  });
}
