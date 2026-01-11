// ====================== ABONE SİSTEMİ KOMUTLARI ======================

// 1. Kanal Ayarlama
if (interaction.isChatInputCommand() && interaction.commandName === "abonekanalbelirle") {
    const kanal = interaction.options.getChannel("kanal");
    if (!CONFIG[interaction.guild.id]) CONFIG[interaction.guild.id] = {};
    CONFIG[interaction.guild.id].aboneKanalId = kanal.id;
    saveConfig();
    return interaction.reply({ content: `✅ Abone kanıt kanalı ${kanal} olarak ayarlandı!`, flags: [MessageFlags.Ephemeral] });
}

// 2. Rol Ayarlama
if (interaction.isChatInputCommand() && interaction.commandName === "abonerolbelirle") {
    const rol = interaction.options.getRole("rol");
    if (!CONFIG[interaction.guild.id]) CONFIG[interaction.guild.id] = {};
    CONFIG[interaction.guild.id].aboneRolId = rol.id;
    saveConfig();
    return interaction.reply({ content: `✅ Abone rolü ${rol} olarak ayarlandı!`, flags: [MessageFlags.Ephemeral] });
}

// 3. Fotoğraf Atıldığında Tetiklenme (MessageCreate içine)
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    const guildConfig = CONFIG[message.guild.id];
    if (!guildConfig || message.channel.id !== guildConfig.aboneKanalId) return;

    if (message.attachments.size > 0) {
        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("🔍 Abone Kanıtı İnceleniyor")
            .setDescription("Yetkililer Değerlendiriyor Lütfen Bekleyiniz\n\n**Gönderen:** " + message.author.toString())
            .setFooter({ text: "Abone Sistemi" });

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("abone_no_comment").setLabel("Yorum Yok").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("abone_no_video").setLabel("Video İçeriği İle İlgili Yorum Yok").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("abone_no_photo").setLabel("Fotoğraf Gözükmüyor").setStyle(ButtonStyle.Danger)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("abone_no_like").setLabel("Beğeni Yok").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("abone_no_sub").setLabel("Abone Yok").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("abone_correct_" + message.author.id).setLabel("Doğru").setStyle(ButtonStyle.Success)
        );

        await message.reply({ embeds: [embed], components: [row1, row2] });
    }
});

// 4. Buton İşlemleri (InteractionCreate içine)
if (interaction.isButton() && interaction.customId.startsWith("abone_")) {
    const guildConfig = CONFIG[interaction.guild.id];
    const isAuthorized = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) || 
                       (guildConfig?.yetkiliRolId && interaction.member.roles.cache.has(guildConfig.yetkiliRolId));

    if (!isAuthorized) return interaction.reply({ content: "❌ Bu butonları sadece yetkililer kullanabilir!", flags: [MessageFlags.Ephemeral] });

    const parts = interaction.customId.split("_");
    const action = parts[1]; // no_comment, correct vb.
    const targetUserId = parts[2]; // Fotoğrafı atan kişinin ID'si (Sadece correct butonunda var)

    const responses = {
        "no": {
            "comment": "❌ Yorum yapmamışsınız, lütfen tekrar atın.",
            "video": "❌ Yorumunuz video içeriğiyle ilgili değil.",
            "photo": "❌ Fotoğraf açılmıyor veya gözükmüyor.",
            "like": "❌ Videoyu beğenmemişsiniz.",
            "sub": "❌ Kanala abone olmamışsınız."
        }
    };

    if (action === "correct") {
        const roleId = guildConfig?.aboneRolId;
        if (!roleId) return interaction.reply({ content: "❌ Abone rolü ayarlanmamış! `/abonerolbelirle` kullanın.", flags: [MessageFlags.Ephemeral] });

        const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);
        if (member) {
            await member.roles.add(roleId).catch(e => console.error("Rol verme hatası:", e));
            await interaction.reply({ content: `✅ ${member} kullanıcısının abone kanıtı onaylandı ve rolü verildi!` });
            // Butonları devre dışı bırakmak için mesajı düzenle
            await interaction.message.edit({ components: [] }).catch(() => {});
        } else {
            await interaction.reply({ content: "❌ Kullanıcı sunucuda bulunamadı.", flags: [MessageFlags.Ephemeral] });
        }
    } else {
        // Hata butonları (Yorum yok vb.)
        const subAction = parts[2]; // comment, video vb.
        await interaction.reply({ content: `${responses.no[subAction]}` });
    }
}
