import { prepareOutputDirectory, downloadFile, createChunk, getChunkWriter, getChunkInfoWriter } from './utils/file';

interface Attachment {
  id: string;
  filename: string;
  size: number;
  url: string;
  proxy_url: string;
  content_type: string | null;
}

interface Message {
  id: string;
  type: number;
  content: string;
  timestamp: string;
  attachments: Attachment[];
  pinned: boolean;
  author: {
    id: string;
    username: string;
  };
}

const MESSAGES_PER_REQUEST = 100;

const getAPIData = async <T>(endpoint: string): Promise<T> => {
  const res = await fetch(`${Bun.env.API_ENDPOINT}${endpoint}`, {
   headers: {
    'Authorization': Bun.env.API_TOKEN || '',
   },
  });
  const data = await res.json();
  return data;
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const datePart = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  const timePart = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  return `${datePart} ${timePart}`;
};

const getAuthorNickFromAuthorId = (authorId: string): string => {
  if (authorId === Bun.env.AUTHOR_ONE_ID) return Bun.env.AUTHOR_ONE_NICK || '';
  return Bun.env.AUTHOR_TWO_NICK || '';
}

(async () => {
  await prepareOutputDirectory();
  let lastMessageId = Bun.env.FIRST_MESSAGE_ID;
  let lastTimestamp = '';

  const chunkInfoWriter = await getChunkInfoWriter();

  for (let i = 0; i < Number(Bun.env.MAX_CHUNK_PASSES) || 0; i++) {
    await createChunk(i);
    const chunkWriter = await getChunkWriter(i);
    const requestsPerChunk = Math.floor((Number(Bun.env.MESSAGES_PER_CHUNK) || 0) / MESSAGES_PER_REQUEST);
    
    let firstTimestamp = '';

    for (let reqNum = 0; reqNum < requestsPerChunk; reqNum++) {
      const messages = (await getAPIData<Message[]>(
        `/channels/${Bun.env.DM_CHANNEL_ID}/messages?after=${lastMessageId}&limit=${MESSAGES_PER_REQUEST}`,
      )).reverse();
      if (messages.length === 0) return;
      for (const message of messages) {
        if (!firstTimestamp) firstTimestamp = message.timestamp;
        const nick = getAuthorNickFromAuthorId(message.author.id);
        if (message.content) {
          chunkWriter.write(`[${formatTimestamp(message.timestamp)}][${nick}] ${message.content}\n`);
        }
        if (message.attachments) {
          for (const attachment of message.attachments) {
            chunkWriter.write(`[${formatTimestamp(message.timestamp)}][${nick}] <${message.id}_${attachment.filename}>\n`);
            await downloadFile(attachment.url, `${message.id}_${attachment.filename}`, attachment.content_type || '');
          }
        }
        lastMessageId = message.id;
        lastTimestamp = message.timestamp;
      }

      console.log(`Chunk ${i} written; last message on: ${formatTimestamp(lastTimestamp)}`);
    }

    chunkInfoWriter.write(`Chunk ${i}: ${formatTimestamp(firstTimestamp)} - ${formatTimestamp(lastTimestamp)}\n`);

    chunkWriter.flush();
    chunkWriter.end();
  }

  chunkInfoWriter.flush();
  chunkInfoWriter.end();
})();
