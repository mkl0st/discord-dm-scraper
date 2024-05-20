import { mkdir } from 'node:fs/promises';

export const prepareOutputDirectory = async () => {
  await mkdir('output/chunks', { recursive: true });
  await mkdir('output/voice', { recursive: true });
  await mkdir('output/images', { recursive: true });
  await mkdir('output/videos', { recursive: true });
  await mkdir('output/other', { recursive: true });
};

export const downloadFile = async (url: string, fileName: string, type: string): Promise<void> => {
  const file = await fetch(url);
  switch (type) {
    case 'image/jpeg':
    case 'image/png':
      await Bun.write(`output/images/${fileName}`, file);
      break;
    case 'video/mp4':
      await Bun.write(`output/videos/${fileName}`, file);
      break;
    case 'audio/ogg':
      await Bun.write(`output/voice/${fileName}`, file);
      break;
    default:
      await Bun.write(`output/other/${fileName}`, file);
      break;
  }
};
