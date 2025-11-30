require('dotenv').config();
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    PermissionsBitField
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ==== SADECE BURAYI DEĞİŞTİR ====
const SAHIB_ID         = '1213754527111450644';     // Senin Discord ID
const ADMIN_ROL_ID     = '1444049378481406093';      // Admin rol ID (yoksa sil)
const TEST_KANALI_ID   = '1443975123559256125';     // Test kanalı ID
const KAYIT_KANALI_ID  = '1444559764380979260';     // Kayıt yapılacak kanal ID
const KAYIT_ROL_ID     = '1443985323884544264';     // Kayıt yazana verilecek KALICI ROL ID
const TEST_ROLE_ID     = '1444624117553823754';     // Test rolü
const SONUC_KANALI_ID  = '1444060080512176158';     // Sonuç kanalı

let kuyrukAktif = false;
let testPanel = null;
let kuyruk = [];
let kayitAktif = false;  // Kayıt sistemi açık mı?

client.once('ready', () => {
    console.log(`GADOŞ BOTU HAZIR → ${client.user.tag}`);
    client.user.setActivity('gadoş yardım | kayıt yaz → rol al', { type: 3 });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const content = message.content.toLowerCase().trim();

    const isAdmin = message.author.id === SAHIB_ID ||
                    message.member?.roles.cache.has(ADMIN_ROL_ID) ||
                    message.member?.permissions.has(PermissionsBitField.Flags.Administrator);

    // GADOŞ YARDIM
    if (content === 'gadoş' || content === 'gadoş yardım') {
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('Gadoş Bot Komutları')
            .addFields(
                { name: 'Test Aç', value: '`gadoş testaç`', inline: false },
                { name: 'Test Kapat', value: '`gadoş testkapat`', inline: false },
                { name: 'Kayıt Aç', value: '`gadoş kayıtaç`', inline: false },
                { name: 'Kayıt Kapat', value: '`gadoş kayıtkapat` → roller gitmez!', inline: false },
                { name: 'Tier Ekle', value: '`gadoş add S oyuncu1 oyuncu2`', inline: false },
                { name: 'Kanal Kilitle/Aç', value: '`gadoş testkanal kilitle` / `aç`', inline: false },
                { name: 'Katıl / Ayrıl', value: '**katıl** | **ayrıl**', inline: false },
                { name: 'Kayıt Ol', value: '**kayıt** yaz → rol al (kalıcı)', inline: false }
            );
        return message.reply({ embeds: [embed] });
    }

    // TEST AÇ
    if (content === 'gadoş testaç' || content === 'gadoş testac') {
        if (!isAdmin) return message.reply('Sadece yetkili açabilir!');
        if (kuyrukAktif) return message.reply('Zaten açık!');
        kuyrukAktif = true; kuyruk = [];
        const embed = new EmbedBuilder().setColor('#ff3366').setTitle('TEST KUYRUĞU AÇILDI!').setDescription('**katıl** yaz → rol al\n**ayrıl** yaz → çık');
        testPanel = await message.channel.send({ content: '@everyone', embeds: [embed] });
        return message.reply('Test açıldı gadoş!');
    }

    // TEST KAPAT
    if (content === 'gadoş testkapat') {
        if (!isAdmin || !kuyrukAktif) return;
        kuyrukAktif = false;
        for (const p of kuyruk) {
            const member = await message.guild.members.fetch(p.id).catch(() => null);
            if (member?.roles.cache.has(TEST_ROLE_ID)) member.roles.remove(TEST_ROLE_ID).catch(() => {});
        }
        kuyruk = [];
        if (testPanel) testPanel.edit({ embeds: [new EmbedBuilder().setColor('#ff0000').setTitle('TEST KAPANDI')] });
        return message.reply('Test kapandı!');
    }

    // KAYIT AÇ
    if (content === 'gadoş kayıtaç') {
        if (!isAdmin) return message.reply('Sadece yetkili!');
        if (kayitAktif) return message.reply('Zaten açık!');
        kayitAktif = true;
        const kanal = message.guild.channels.cache.get(KAYIT_KANALI_ID);
        if (kanal) {
            kanal.send({ content: '@everyone', embeds: [new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('KAYIT AÇILDI!')
                .setDescription('`kayıt` yazarak kalıcı rol alabilirsin!\nKapatılsa bile rolün gitmez!')
            ]});
        }
        return message.reply('Kayıt sistemi açıldı! Artık `kayıt` yazanlar rol alır.');
    }

    // KAYIT KAPAT (ROLLER KALIR!)
    if (content === 'gadoş kayıtkapat') {
        if (!isAdmin) return;
        if (!kayitAktif) return message.reply('Zaten kapalı!');
        kayitAktif = false;
        const kanal = message.guild.channels.cache.get(KAYIT_KANALI_ID);
        if (kanal) {
            kanal.send({ embeds: [new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('KAYIT KAPANDI')
                .setDescription('Artık kayıt alınmıyor ama verilen roller **kalıcıdır!**')
            ]});
        }
        return message.reply('Kayıt kapatıldı. Roller gitmedi!');
    }

    // KAYIT YAZINCAK → KALICI ROL VER
    if (content === 'kayıt' && message.channel.id === KAYIT_KANALI_ID) {
        if (!kayitAktif) return message.reply('Kayıt şu anda kapalı!');
        if (message.member.roles.cache.has(KAYIT_ROL_ID)) return message.reply('Zaten kayıtlısın gadoş!');
        
        await message.member.roles.add(KAYIT_ROL_ID).catch(() => {});
        return message.reply(`Tebrikler! <@&${KAYIT_ROL_ID}> rolün kalıcı olarak verildi!`);
    }

    // KANAL KİLİTLE / AÇ
    if (content === 'gadoş testkanal kilitle') {
        if (!isAdmin) return;
        const kanal = message.guild.channels.cache.get(TEST_KANALI_ID);
        if (kanal) kanal.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
        message.reply(`<#${TEST_KANALI_ID}> kilitlendi!`);
    }
    if (content === 'gadoş testkanalı aç' || content === 'gadoş testkanal aç') {
        if (!isAdmin) return;
        const kanal = message.guild.channels.cache.get(TEST_KANALI_ID);
        if (kanal) kanal.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
        message.reply(`<#${TEST_KANALI_ID}> açıldı!`);
    }

    // TIER EKLE
    if (content.startsWith('gadoş add ')) {
        if (!isAdmin) return;
        const args = content.split(' ').slice(2);
        const tier = args[0]?.toUpperCase();
        const players = args.slice(1);
        if (!tier || players.length === 0) return message.reply('Örnek: `gadoş add S qwnzxx DarkSoul`');
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(`${tier} TIER`)
            .setDescription(players.map(p => `**${p}**`).join(' • '))
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
        const sonuc = message.guild.channels.cache.get(SONUC_KANALI_ID);
        if (sonuc) sonuc.send({ embeds: [embed] });
    }

    // KATIL / AYRIL
    if (content === 'katıl') {
        if (!kuyrukAktif) return message.reply('Test kapalı!');
        if (kuyruk.some(p => p.id === message.author.id)) return message.reply('Zaten girdin!');
        await message.member.roles.add(TEST_ROLE_ID).catch(() => {});
        kuyruk.push({ id: message.author.id, username: message.author.username });
        message.reply(`Kuyruğa girdin! Sıra: **${kuyruk.length}**`);
        await guncelleKuyruk();
    }

    if (content === 'ayrıl') {
        if (!kuyrukAktif) return message.reply('Test kapalı!');
        const index = kuyruk.findIndex(p => p.id === message.author.id);
        if (index === -1) return message.reply('Kuyrukta değilsin!');
        await message.member.roles.remove(TEST_ROLE_ID).catch(() => {});
        kuyruk.splice(index, 1);
        message.reply(`Çıktın! Kalan: **${kuyruk.length}**`);
        await guncelleKuyruk();
    }
});

async function guncelleKuyruk() {
    const liste = kuyruk.length ? kuyruk.map((p, i) => `${i+1}. **${p.username}** (<@${p.id}>)`).join('\n') : 'Kimse yok';
    const embed = new EmbedBuilder()
        .setColor('#ff3366')
        .setTitle('TEST KUYRUĞU - CANLI')
        .addFields({ name: `Katılanlar (${kuyruk.length} kişi)`, value: liste })
        .setTimestamp();
    if (testPanel) testPanel.edit({ embeds: [embed] });
}

client.login(process.env.TOKEN);
