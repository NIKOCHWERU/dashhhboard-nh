// Web Worker for background eraser auto-detection & flood fill
self.onmessage = (e: MessageEvent) => {
  const { type, imageData, tolerance, startX, startY, width, height } = e.data;

  if (type === "auto-detect") {
    const d = imageData.data;
    const corners = [
      [0, 0],
      [width - 1, 0],
      [0, height - 1],
      [width - 1, height - 1],
    ];

    const bgColors = corners.map(([x, y]) => {
      const idx = (y * width + x) * 4;
      return [d[idx], d[idx + 1], d[idx + 2]];
    });

    const tolSq = (tolerance * 2.5) ** 2;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      let isBg = false;
      for (let j = 0; j < bgColors.length; j++) {
        const [br, bg, bb] = bgColors[j];
        const distSq = (r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2;
        if (distSq <= tolSq) {
          isBg = true;
          break;
        }
      }
      if (isBg) {
        d[i + 3] = 0;
      }
    }

    self.postMessage({ type: "auto-detect-complete", imageData }, [imageData.data.buffer]);
  } else if (type === "magic-eraser") {
    const d = imageData.data;
    const startIdx = (startY * width + startX) * 4;
    const targetR = d[startIdx];
    const targetG = d[startIdx + 1];
    const targetB = d[startIdx + 2];

    const visited = new Uint8Array(width * height);
    const stack = [startX, startY];
    const tolSq = (tolerance * 2.5) ** 2;

    while (stack.length > 0) {
      const y = stack.pop()!;
      const x = stack.pop()!;
      const pos = y * width + x;
      const idx = pos * 4;

      if (x < 0 || x >= width || y < 0 || y >= height || visited[pos]) continue;
      visited[pos] = 1;

      const r = d[idx], g = d[idx + 1], b = d[idx + 2];
      const distSq = (r - targetR) ** 2 + (g - targetG) ** 2 + (b - targetB) ** 2;

      if (distSq <= tolSq) {
        d[idx + 3] = 0;
        stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
      }
    }

    self.postMessage({ type: "magic-eraser-complete", imageData, targetR, targetG, targetB }, [imageData.data.buffer]);
  }
};
