import { Canvas, Image, createCanvas } from "canvas";
import path from "path";
import fs from "fs";

const squareSize = 1080;

const getCroppedImageCoordinates = (canvas: Canvas) => {
  const { width: canvasWidth, height: canvasHeight } = canvas;
  const context = canvas.getContext("2d");
  const data = context.getImageData(0, 0, canvasWidth, canvasHeight).data;
  let top = 0,
    right = 0,
    bottom = 0,
    left = 0;

  let edgeFound = false;
  for (let y = 0; y < canvasHeight; y++) {
    if (edgeFound) break;
    for (let x = 0; x < canvasWidth; x++) {
      const index = (y * canvasWidth + x) * 4;
      if (data[index + 3] > 0) {
        top = y;
        edgeFound = true;
        break;
      }
    }
  }

  edgeFound = false;
  for (let x = 0; x < canvasWidth; x++) {
    if (edgeFound) break;
    for (let y = 0; y < canvasHeight; y++) {
      const index = (y * canvasWidth + x) * 4;
      if (data[index + 3] > 0) {
        left = x;
        edgeFound = true;
        break;
      }
    }
  }

  edgeFound = false;
  for (let y = canvasHeight - 1; y >= 0; y--) {
    if (edgeFound) break;
    for (let x = canvasWidth - 1; x >= 0; x--) {
      const index = (y * canvasWidth + x) * 4;
      if (data[index + 3] > 0) {
        bottom = y;
        edgeFound = true;
        break;
      }
    }
  }

  edgeFound = false;
  for (let x = canvasWidth - 1; x >= 0; x--) {
    if (edgeFound) break;
    for (let y = canvasHeight - 1; y >= 0; y--) {
      const index = (y * canvasWidth + x) * 4;
      if (data[index + 3] > 0) {
        right = x;
        edgeFound = true;
        break;
      }
    }
  }

  return { top, right, bottom, left };
};

const loadImage = (imageName: string): Promise<Image> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (err) => reject(err);
    image.src = path.join(__dirname, imageName);
  });
};

const loadImages = async () => {
  try {
    return await Promise.all([loadImage("yellow.png"), loadImage("white.png")]);
  } catch (err) {
    console.log(err);
  }
};

const storeEgg = (buffer: Buffer, name: string) => {
  const eggDirectory = path.join(__dirname, "eggs");
  if (!fs.existsSync(eggDirectory)) fs.mkdirSync(eggDirectory);
  const eggPath = path.join(eggDirectory, `${name}.png`);
  fs.writeFileSync(eggPath, buffer);
  return eggPath;
};

const generateEgg = (): Promise<{ buffer: Buffer, name: string }> => {
  return new Promise(async (resolve, reject) => {
    try {
      const loadedImages = await loadImages();
      const drawingPos = { x: 0, y: 0 };

      const name = (Math.floor(Math.random() * (Math.pow(2, 29) - 1 + 1)) + 1)
        .toString(2)
        .replace(/0/g, "e")
        .replace(/1/g, "g");

      const canvas = createCanvas(squareSize, squareSize);
      const context = canvas.getContext("2d");
      const { width: canvasWidth, height: canvasHeight } = canvas;

      for (let i = 0; i < name.length; i++) {
        const image = loadedImages[name[i] === "e" ? 0 : 1];
        const { width: imageWidth } = image;

        if (drawingPos.x + imageWidth > Math.ceil(canvasWidth / 3)) {
          drawingPos.x = 0;
          drawingPos.y += loadedImages[0].height;
        } else drawingPos.x += 10;

        context.drawImage(image, drawingPos.x, drawingPos.y);
      }

      const { top, right, bottom, left } = getCroppedImageCoordinates(canvas);
      const width = right - left;
      const height = bottom - top;

      const finalCanvas = createCanvas(squareSize, canvasHeight);
      const finalContext = finalCanvas.getContext("2d");
      finalContext.putImageData(
        context.getImageData(left, top, width, height),
        Math.ceil(squareSize - width) / 2,
        Math.ceil(squareSize - height) / 2
      );

      const buffer = finalCanvas.toBuffer("image/png");
      resolve({ buffer, name });
    } catch (err) {
      reject(err);
    }
  })
};

export { generateEgg, storeEgg };