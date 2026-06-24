const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');

const CHAINES_REQUISES = [
    "[https://whatsapp.com/channel/0029VbCs3Ub23n3h58EbrD1X](https://whatsapp.com/channel/0029VbCs3Ub23n3h58EbrD1X)",
    "[https://whatsapp.com/channel/0029Vb8j6PB8V0tt8YQ1vm0I](https://whatsapp.com/channel/0029Vb8j6PB8V0tt8YQ1vm0I)",
    "[https://whatsapp.com/channel/0029Vb6NwJpI7BeKn6EDup0W](https://whatsapp.com/channel/0029Vb6NwJpI7BeKn6EDup0W)",
    "[https://whatsapp.com/channel/0029Vb6h7z5I7Be9DZHshO0O](https://whatsapp.com/channel/0029Vb6h7z5I7Be9DZHshO0O)"
];

const NUMERO_BOT = "242064668526"; 

async function lancerBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Ubuntu', 'Chrome', '20.0.04']
    });

    if (!sock.authState.creds.registered) {
        await delay(3000);
        try {
            let code = await sock.requestPairingCode(NUMERO_BOT);
            code = code?.match(/.{1,4}/g)?.join('-') || code;
            console.log(`\n🔑 TON PAIRING CODE CHAE : ${code}\n`);
        } catch (error) {
            console.error("Erreur :", error.message);
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                lancerBot();
            }
        } else if (connection === 'open') {
            console.log('✅ Chae Bot connecté !');
        }
    });
}

lancerBot();
               
