import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

// Load from .env file (recommended)
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const CHECK_INTERVAL = 30000; // every 30 seconds

// Track stock
let stockStatus = {
  seeds: { "Carrot Seed": false, "Sunflower Seed": false },
  tools: { "Watering Can": false, "Hoe": false },
  eggs: { "Mystery Egg": false, "Golden Egg": false }
};

// Simulated stock checker
async function fetchStock() {
  return {
    seeds: {
      "Carrot Seed": Math.random() < 0.4,
      "Sunflower Seed": Math.random() < 0.3
    },
    tools: {
      "Watering Can": Math.random() < 0.3,
      "Hoe": Math.random() < 0.2
    },
    eggs: {
      "Mystery Egg": Math.random() < 0.25,
      "Golden Egg": Math.random() < 0.1
    }
  };
}

// Stock checker loop
async function checkAndNotifyStock() {
  const newStock = await fetchStock();
  const channel = await client.channels.fetch(CHANNEL_ID);

  for (const category in newStock) {
    for (const item in newStock[category]) {
      const availableNow = newStock[category][item];
      const wasAvailable = stockStatus[category][item];

      if (availableNow && !wasAvailable) {
        await channel.send(`🌱 **${item}** (${category.toUpperCase()}) is now in stock!`);
      }

      stockStatus[category][item] = availableNow;
    }
  }
}

// Slash command registration
const commands = [
  new SlashCommandBuilder()
    .setName('stock')
    .setDescription('View the current stock status')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);
await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });

// Respond to slash command
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'stock') {
    let message = '🪴 **Current Stock Status:**\n';
    for (const category in stockStatus) {
      message += `\n__${category.toUpperCase()}__\n`;
      for (const item in stockStatus[category]) {
        const icon = stockStatus[category][item] ? '✅' : '❌';
        message += `${item}: ${icon}\n`;
      }
    }
    await interaction.reply({ content: message, ephemeral: true });
  }
});

// On ready
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  setInterval(checkAndNotifyStock, CHECK_INTERVAL);
});

client.login(TOKEN);
