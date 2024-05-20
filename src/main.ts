interface Attachment {
  id: string;
  filename: string;
  size: number;
  url: string;
  proxy_url: string;
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
  const messages = (await getAPIData<Message[]>(
    `/channels/${Bun.env.DM_CHANNEL_ID}/messages?after=${Bun.env.FIRST_MESSAGE_ID}&limit=${Bun.env.MESSAGE_LIMIT}`,
  )).reverse();
  messages.forEach((message) => {
    const nick = getAuthorNickFromAuthorId(message.author.id);
    if (message.content) {
      console.log(`[${formatTimestamp(message.timestamp)}][${nick}] ${message.content}`);
    }
    message.attachments?.forEach((attachment) => {
      console.log(`[${formatTimestamp(message.timestamp)}][${nick}] <${message.id}_${attachment.filename}>`);
      return;
    });
  });
})();
