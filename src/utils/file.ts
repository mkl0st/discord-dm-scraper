import { mkdir } from 'node:fs/promises';

import type { FileSink } from 'bun';

export const prepareOutputDirectory = async () => {
  await mkdir('output/chunks', { recursive: true });
  await mkdir('output/voice', { recursive: true });
  await mkdir('output/images', { recursive: true });
  await mkdir('output/videos', { recursive: true });
  await mkdir('output/other', { recursive: true });
  await Bun.write('output/chunk-info.txt', '');
};

export const createChunk = async (chunkId: number): Promise<void> => {
  await Bun.write(`output/chunks/chunk-${chunkId}.txt`, '');
};

export const getChunkWriter = async (chunkId: number): Promise<FileSink> => {
  const file = Bun.file(`output/chunks/chunk-${chunkId}.txt`);
  const writer = file.writer({ highWaterMark: 1024 * 1024 * 16 });
  return writer;
};

export const getChunkInfoWriter = async (): Promise<FileSink> => {
  const file = Bun.file(`output/chunk-info.txt`);
  const writer = file.writer({ highWaterMark: 1024 * 1024 });
  return writer;
};

export const downloadFile = async (url: string, fileName: string, type: string): Promise<void> => {
  const file = await fetch(url);
  try {
    switch (type) {
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        await Bun.write(`output/images/${String(fileName)}`, file);
        break;
      case 'video/mp4':
        await Bun.write(`output/videos/${String(fileName)}`, file);
        break;
      case 'audio/ogg':
        await Bun.write(`output/voice/${String(fileName)}`, file);
        break;
      default:
        await Bun.write(`output/other/${String(fileName)}`, file);
        break;
    }
  } catch (error) {
    console.error(error);
  }
};
