interface Message {
  id: string;
  content: string;
  timestamp: string;
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

(async () => {
  const messages = await getAPIData<Message[]>(
    `/channels/${Bun.env.DM_CHANNEL_ID}/messages?after=${Bun.env.FIRST_MESSAGE_ID}&limit=${Bun.env.MESSAGE_LIMIT}`,
  );
  messages.forEach((message) => {
    console.log(message.content);
  });
})();
