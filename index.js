const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

// Dữ liệu lưu tạm (Sẽ mất khi bot reset trên Railway)
let db = {}; 
let currentPokemon = null; 

const PREFIX = "!";

client.on('ready', () => {
    console.log(`✅ Pokemon Bot đã sẵn sàng: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

    // Khởi tạo dữ liệu người dùng
    if (!db[userId]) {
        db[userId] = { 
            money: 5000, 
            hop: [], 
            catchCount: 0 
        };
    }

    // ================= [ LỆNH !PHELP ] =================
    if (command === 'phelp') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🎮 POKÉMON BOT - HƯỚNG DẪN')
            .setColor('#ff0000')
            .setThumbnail('https://i.imgur.com/vHdfZfC.png')
            .setDescription('Chào mừng ông đến với thế giới Pokémon! Dưới đây là các lệnh để chơi:')
            .addFields(
                { name: '🐾 Săn Bắt', value: '`!spawn`: Gọi Pokemon xuất hiện.\n`!bat [tên]`: Đoán tên để bắt Pokemon vào Hộp.' },
                { name: '📦 Quản Lý', value: '`!hop`: Xem danh sách Pokemon và tiền.\n`!check @user`: Xem trộm hộp của người khác.' },
                { name: '🤝 Giao Dịch', value: '`!trade @user [tên_của_mình] [tên_của_họ]`: Trao đổi Pokemon với bạn bè.' },
                { name: '💰 Kinh Tế', value: 'Bắt đúng 1 con nhận `200 xu`. Dùng tiền để trade hoặc nâng cấp sau này.' }
            )
            .setFooter({ text: 'Bot phát triển cho cộng đồng Discord' });

        return message.reply({ embeds: [helpEmbed] });
    }

    // ================= [ LỆNH !SPAWN ] =================
    if (command === 'spawn') {
        const randomId = Math.floor(Math.random() * 898) + 1;
        try {
            const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
            currentPokemon = {
                name: res.data.name.toLowerCase(),
                image: res.data.sprites.other['official-artwork'].front_default
            };

            const spawnEmbed = new EmbedBuilder()
                .setTitle("🐾 MỘT POKÉMON XUẤT HIỆN!")
                .setDescription("Gõ `!bat [tên]` để thu phục nó vào Hộp!")
                .setImage(currentPokemon.image)
                .setColor('#ffcb05');

            message.channel.send({ embeds: [spawnEmbed] });
        } catch (err) {
            message.reply("Lỗi API rồi cha nội, thử lại sau đi!");
        }
    }

    // ================= [ LỆNH !BAT / !BATPOKEMON ] =================
    if (command === 'bat' || command === 'batpokemon') {
        if (!currentPokemon) return message.reply("Có con nào đâu mà bắt!");

        const guestName = args[0]?.toLowerCase();
        if (!guestName) return message.reply("Phải ghi tên nó ra chứ!");

        if (guestName === currentPokemon.name) {
            db[userId].hop.push(currentPokemon.name);
            db[userId].money += 200;
            db[userId].catchCount += 1;

            const catchEmbed = new EmbedBuilder()
                .setTitle('🎯 THU PHỤC THÀNH CÔNG!')
                .setColor('#43b581')
                .setDescription(`**${message.author.username}** đã bắt được **${currentPokemon.name.toUpperCase()}**!\n💰 Thưởng: \`200 xu\``)
                .setThumbnail(currentPokemon.image);

            message.reply({ embeds: [catchEmbed] });
            currentPokemon = null; 
        } else {
            message.reply("❌ Sai tên rồi, nhìn kỹ lại cái hình đi!");
        }
    }

    // ================= [ LỆNH !HOP / !CHECK ] =================
    if (command === 'hop' || command === 'check') {
        const target = message.mentions.users.first() || message.author;
        const userData = db[target.id];

        if (!userData) return message.reply("Người này chưa bắt con Pokemon nào cả!");

        const pokemonList = userData.hop.length > 0 
            ? userData.hop.map((p, i) => `\`${i + 1}.\` ${p.toUpperCase()}`).join("\n") 
            : "Trống không!";

        const hopEmbed = new EmbedBuilder()
            .setTitle(`📦 HỘP POKÉMON CỦA ${target.username.toUpperCase()}`)
            .setColor('#3498db')
            .addFields(
                { name: '💰 Tiền mặt', value: `\`${userData.money} xu\``, inline: true },
                { name: '📊 Đã bắt', value: `\`${userData.catchCount} con\``, inline: true },
                { name: '📋 Danh sách trong Hộp', value: pokemonList.length > 1024 ? "Hộp quá đầy, không hiện hết!" : pokemonList }
            );

        message.reply({ embeds: [hopEmbed] });
    }

    // ================= [ LỆNH !TRADE ] =================
    if (command === 'trade') {
        const target = message.mentions.users.first();
        if (!target || target.id === userId) return message.reply("Tag người muốn trade cùng!");

        const myPoke = args[1]?.toLowerCase();
        const theirPoke = args[2]?.toLowerCase();

        if (!myPoke || !theirPoke) return message.reply("Cú pháp: `!trade @user [tên_của_ông] [tên_của_họ]`");

        if (!db[target.id]) return message.reply("Người kia chưa có dữ liệu!");

        const myIdx = db[userId].hop.indexOf(myPoke);
        const theirIdx = db[target.id].hop.indexOf(theirPoke);

        if (myIdx === -1) return message.reply(`Ông không có ${myPoke} trong Hộp!`);
        if (theirIdx === -1) return message.reply(`${target.username} không có ${theirPoke} trong Hộp!`);

        const tradeEmbed = new EmbedBuilder()
            .setTitle('🤝 GIAO DỊCH HỘP POKÉMON')
            .setDescription(`**${message.author.username}** muốn đổi **${myPoke.toUpperCase()}** lấy **${theirPoke.toUpperCase()}** của **${target.username}**\n\n👉 <@${target.id}> gõ \`ok\` để chốt đơn!`)
            .setColor('#e67e22')
            .setFooter({ text: 'Hết hạn sau 30 giây' });

        message.channel.send({ content: `<@${target.id}>`, embeds: [tradeEmbed] });

        const filter = m => m.author.id === target.id && m.content.toLowerCase() === 'ok';
        const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

        collector.on('collect', () => {
            // Thực hiện đổi
            db[userId].hop.splice(myIdx, 1);
            db[target.id].hop.splice(theirIdx, 1);
            db[userId].hop.push(theirPoke);
            db[target.id].hop.push(myPoke);

            message.channel.send(`✅ **THÀNH CÔNG!** Hai ông đã đổi Pokemon cho nhau.`);
        });
    }
});

client.login(process.env.TOKEN);
