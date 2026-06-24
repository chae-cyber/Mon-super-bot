```javascript
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

// Liste officielle de tes 4 chaînes pour le bot Chae
const CHAINES_REQUISES = [
    "https://whatsapp.com/channel/0029VbCs3Ub23n3h58EbrD1X",
    "https://whatsapp.com/channel/0029Vb8j6PB8V0tt8YQ1vm0I",
    "https://whatsapp.com/channel/0029Vb6NwJpI7BeKn6EDup0W",
    "https://whatsapp.com/channel/0029Vb6h7z5I7Be9DZHshO0O"
];

async function lancerBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ['Chae Bot', 'Safari', '3.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.clear();
            console.log("=== QR CODE DISPONIBLE ===");
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const codeSuffix = lastDisconnect?.error?.output?.statusCode;
            if (codeSuffix !== DisconnectReason.loggedOut) {
                console.log('🔄 Reconnexion de Chae...');
                lancerBot();
            }
        } else if (connection === 'open') {
            console.log('✅ ÉTAPE 1 RÉUSSIE : Chae Bot est en ligne sur le Cloud !');
        }
    });

    sock.ev.on('messages.upsert', async m => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const type = Object.keys(msg.message)[0];
            
            let body = '';
            if (type === 'conversation') body = msg.message.conversation;
            else if (type === 'extendedTextMessage') body = msg.message.extendedTextMessage.text;

            const prefix = '.';
            if (!body.startsWith(prefix)) return;

            const args = body.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            // 1. COMMANDE .MENU
            if (command === 'menu') {
                let texteMenu = `✨ *BIENVENUE SUR CHAE BOT* ✨\n\n`;
                texteMenu += `📢 *Chaînes obligatoires :*\n`;
                CHAINES_REQUISES.forEach((lien, i) => {
                    texteMenu += `👉 Chaîne ${i+1} : ${lien}\n`;
                });
                texteMenu += `\n⚙️ *Commandes disponibles :*\n`;
                texteMenu += `│ ➔ \`.menu\` : Afficher cette liste\n`;
                texteMenu += `│ ➔ \`.hidetag <texte>\` : Mentionner tout le groupe\n`;
                texteMenu += `│ ➔ \`.tg <lien>\` : Convertir des stickers (Jour 2)\n`;
                texteMenu += `└─────────────────────────`;
                
                await sock.sendMessage(from, { text: texteMenu });
            }

            // 2. COMMANDE .HIDETAG (Mentions invisibles pour les admins)
            if (command === 'hidetag') {
                if (!isGroup) return;
                
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants;
                const jids = participants.map(p => p.id);
                
                const texte = args.join(' ') || '📢 Annonce générale !';
                
                await sock.sendMessage(from, { 
                    text: texte, 
                    mentions: jids 
                });
            }

            // 3. COMMANDE .TG (Stickers Telegram)
            if (command === 'tg') {
                const link = args[0];
                if (!link) return await sock.sendMessage(from, { text: '❌ Envoie le lien : .tg https://t.me/addstickers/Nom' });
                await sock.sendMessage(from, { text: '⏳ Chae vérifie le pack Telegram... (Configuré au Jour 2)' });
            }

        } catch (error) {
            console.error(error.message);
        }
    });
}

lancerBot().catch(err => console.error(err));
