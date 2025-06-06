const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "music",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Rudra x ChatGPT",
  description: "Download JioSaavn song and send as audio",
  commandCategory: "music",
  usages: "[song name]",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const songName = args.join(" ");
  if (!songName) return api.sendMessage("🎵 Please provide a song name.\n\nExample: +music tum hi ho", event.threadID, event.messageID);

  const msg = await api.sendMessage(`🔍 Searching "${songName}" on JioSaavn...`, event.threadID);

  try {
    const res = await axios.get(`https://saavn.me/search/songs?query=${encodeURIComponent(songName)}`);
    const song = res.data?.data?.results?.[0];

    if (!song) return api.sendMessage("❌ Song not found.", event.threadID, event.messageID);

    const songDetail = await axios.get(`https://saavn.me/songs?id=${song.id}`);
    const audioUrl = songDetail.data?.data?.[0]?.downloadUrl?.[1]?.link;

    if (!audioUrl) return api.sendMessage("❌ MP3 link not found.", event.threadID, event.messageID);

    const filename = path.join(__dirname, "cache", `${Date.now()}.mp3`);
    const writer = fs.createWriteStream(filename);

    const audioRes = await axios.get(audioUrl, { responseType: 'stream' });
    audioRes.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage({
        body: `🎧 Now Playing: ${song.name}\n👤 Artist: ${song.primaryArtists}`,
        attachment: fs.createReadStream(filename)
      }, event.threadID, () => fs.unlinkSync(filename), event.messageID);
    });

    writer.on("error", err => {
      console.log("File write error:", err);
      api.sendMessage("❌ Error saving the song.", event.threadID, event.messageID);
    });

  } catch (e) {
    console.error("Music error:", e.message);
    api.sendMessage("❌ Something went wrong, please try again.", event.threadID, event.messageID);
  }
};
