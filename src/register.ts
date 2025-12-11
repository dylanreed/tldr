import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const clientId = process.env.DISCORD_CLIENT_ID!;
const token = process.env.DISCORD_TOKEN!;

if (!clientId || !token) {
  console.error('Missing DISCORD_CLIENT_ID or DISCORD_TOKEN in environment');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('tldr')
    .setDescription('Get a summary of recent channel activity')
    .addStringOption((option) =>
      option
        .setName('range')
        .setDescription('Time range (e.g., 24h, 3d, 1w)')
        .setRequired(true)
    )
    .toJSON(),
];

const rest = new REST().setToken(token);

async function register() {
  try {
    console.log('Registering slash commands...');

    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log('Successfully registered commands!');
    console.log('');
    console.log('Install the bot to your account with this URL:');
    console.log(
      `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=applications.commands`
    );
  } catch (error) {
    console.error('Error registering commands:', error);
    process.exit(1);
  }
}

register();
