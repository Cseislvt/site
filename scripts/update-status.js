const fs = require('fs');
const { status } = require('minecraft-server-util');

const HOST = process.env.MC_HOST || 'mc.cseislvt.online';
const PORT = parseInt(process.env.MC_PORT || '25565', 10);

async function main() {
  const result = {
    host: HOST,
    port: PORT,
    online: false,
    players: { online: 0, max: 0, list: [] },
    motd: { raw: [], clean: [], html: [] },
    version: '',
    icon: null,
    updated_at: Date.now(),
  };

  try {
    // Прямой пинг сервера по протоколу Minecraft
    const data = await status(HOST, PORT, { timeout: 5000 });

    result.online = true;
    result.players.online = data.players?.online ?? 0;
    result.players.max = data.players?.max ?? 20;

    // Список игроков (если сервер отдаёт)
    if (Array.isArray(data.players?.sample)) {
      result.players.list = data.players.sample.map(p => p.name).filter(Boolean);
    }

    // MOTD
    const motd = data.motd;
    if (motd) {
      if (typeof motd === 'string') {
        result.motd.raw = [motd];
        result.motd.clean = [motd.replace(/§./g, '')];
        result.motd.html = [escapeHtml(motd.replace(/§./g, ''))];
      } else {
        result.motd.raw = motd.raw ?? [];
        result.motd.clean = motd.clean ?? [];
        result.motd.html = motd.html ?? motd.clean?.map(escapeHtml) ?? [];
      }
    }

    // Версия
    if (data.version) {
      result.version = data.version.name || '';
    }

    // Иконка
    if (data.favicon) {
      result.icon = data.favicon;
    }
  } catch (err) {
    console.error('Сервер недоступен или заблокировал пинг:', err.message);
  }

  fs.writeFileSync('status.json', JSON.stringify(result, null, 2));
  console.log('Статус записан:', JSON.stringify(result, null, 2));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

main();
