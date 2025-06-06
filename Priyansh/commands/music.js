const axios = require("axios");

module.exports = {
  name: "music",
  description: "Kisi bhi gaane ka audio bheje",
  usage: "<song name>",
  async execute(api, event, args) {
    if (!args.length) return api.sendMessage("Gaane ka naam do!", event.threadID, event.messageID);

    const songName = args.join(" ");
    const apiUrl = `https://rudra-music.onrender.com/download?song=${encodeURIComponent(songName)}`;

    try {
      const response = await axios.get(apiUrl);
      if (response.data && response.data.url) {
        const audioUrl = `https://rudra-music.onrender.com${response.data.url}`;

        // Facebook API se direct audio bhejna
        api.sendMessage({
          attachment: { url: audioUrl }
        }, event.threadID, event.messageID);
      } else {
        api.sendMessage("Gaana nahi mila.", event.threadID, event.messageID);
      }
    } catch (error) {
      api.sendMessage("Error aaya: " + error.message, event.threadID, event.messageID);
    }
  }
};
