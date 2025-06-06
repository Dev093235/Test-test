const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "music",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Rudra x ChatGPT",
  description: "Download and send JioSaavn song as MP3",
  commandCategory: "music",
  usages: "[song name]",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const songName = args.join(" ");
  if (!songName) return api.sendMessage("🎶 Please type a song name.\n\nExample: +music tum hi ho", event.threadID, event.messageID);

  const tempMsg = await api.sendMessage(`🔎 Searching for "${songName}" on JioSaavn...`, event.threadID);

  try {
    const search = await axios.get(`https://saavn.me/search/songs?query=${encodeURIComponent(songName)}`);
    const song = search.data?.data?.results?.[0];

    if (!song) return api.sendMessage("❌ Song not found.", event.threadID, event.messageID);

    const details = await axios.get(`https://saavn.me/songs?id=${song.id}`);
    const audioUrl = details.data?.data?.[0]?.downloadUrl?.[1]?.link;

    if (!audioUrl) return api.sendMessage("❌ Couldn't get MP3 link.", event.threadID, event.messageID);

    const cachePath = path.join(__dirname, "cache");
    await fs.ensureDir(cachePath);

    const fileName = `${Date.now()}.mp3`;
    const filePath = path.join(cachePath, fileName);
    const writer = fs.createWriteStream(filePath);

    const response = await axios.get(audioUrl, { responseType: "stream" });
    response.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage({
        body: `🎧 Now Playing: ${song.name}\n👤 Artist: ${song.primaryArtists}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
    });

    writer.on("error", (err) => {
      console.error("Write error:", err);
      api.sendMessage("❌ Error writing the file.", event.threadID, event.messageID);
    });

  } catch (err) {
    console.error("❌ Music error:", err.message);
    api.sendMessage("❌ Something went wrong while fetching the song.", event.threadID, event.messageID);
  }
};
