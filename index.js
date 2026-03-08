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
let activeSpawns = {};
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

    // ================= [ LỆNH !PHELP - FULL OPTION ] =================
    if (command === 'phelp') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🎮 POKÉMON BOT - HƯỚNG DẪN CHI TIẾT')
            .setColor('#ff0000')
            .setThumbnail('https://i.imgur.com/vHdfZfC.png')
            .setDescription('Chào mừng ông đến với thế giới Pokémon! Dưới đây là bộ lệnh đầy đủ để trở thành bậc thầy:')
            .addFields(
                { 
                    name: '🐾 Săn Bắt & Thu Phục', 
                    value: '`!spawn`: Gọi Pokemon xuất hiện.\n`!bat [tên]`: Đoán tên để bắt Pokemon.' 
                },
                { 
                    name: '📦 Quản Lý Hộp (Storage)', 
                    value: '`!hop`: Xem Pokemon và tiền cá nhân.\n`!check @user`: Xem Hộp của người khác.\n`!phongsinh [tên]`: Thả Pokemon để lấy `100 xu`.' 
                },
                { 
                    name: '📈 Phát Triển Pokémon', 
                    value: '`!train [tên]`: Tốn `500 xu` để tăng cấp (Level).\n`!ev [tên]`: Tiến hóa Pokemon khi đủ cấp (Lvl 30+).' 
                },
                { 
                    name: '🤝 Cộng Đồng & Kinh Tế', 
                    value: '`!trade @user [tên_mình] [tên_họ]`: Trao đổi đồ.\n`!toppk`: Bảng xếp hạng đại gia Pokemon.\n`!daily`: Nhận `1,000 xu` quà mỗi ngày.' 
                }
            )
            .setFooter({ text: 'Mẹo: Hãy chăm chỉ !train để đạt cấp độ tiến hóa cao hơn!', iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.reply({ embeds: [helpEmbed] });
    }
   // ================= [ LỆNH !SPAWN RIÊNG BIỆT ] =================
    if (command === 'spawn') {
        // Kiểm tra xem người này đã có con nào đang chờ chưa
        if (activeSpawns[userId]) {
            return message.reply("❌ Ông đang có một con Pokémon chờ bắt rồi! Bắt nó đi đã.");
        }

        const randomId = Math.floor(Math.random() * 898) + 1;
        const randomLevel = Math.floor(Math.random() * 100) + 1;

        try {
            const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
            const pokeName = res.data.name.toLowerCase();

            const spawnEmbed = new EmbedBuilder()
                .setTitle(`🐾 POKÉMON RIÊNG CỦA ${message.author.username.toUpperCase()}`)
                .setColor('#ffcb05')
                .addFields(
                    { name: '⭐ Pokémon', value: `**${pokeName.toUpperCase()}**`, inline: true },
                    { name: '🆙 Cấp', value: `\`Lvl ${randomLevel}\``, inline: true }
                )
                .setImage(res.data.sprites.other['official-artwork'].front_default)
                .setFooter({ text: "Gõ !bat [tên] để thu phục vào Hộp!" });

            const sMsg = await message.channel.send({ content: `<@${userId}>`, embeds: [spawnEmbed] });

            // Lưu vào danh sách riêng của người dùng này
            activeSpawns[userId] = {
                name: pokeName,
                level: randomLevel,
                message: sMsg
            };

            // Sau 2 phút không bắt thì tự xóa slot của người đó
            setTimeout(() => {
                if (activeSpawns[userId]) {
                    activeSpawns[userId].message.delete().catch(() => {});
                    delete activeSpawns[userId];
                }
            }, 120000);

        } catch (err) {
            message.reply("❌ Lỗi gọi Pokémon rồi cha nội!");
        }
    }
   // ================= [ LỆNH !BAT RIÊNG BIỆT ] =================
    if (command === 'bat' || command === 'batpokemon') {
        const userSpawn = activeSpawns[userId];

        if (!userSpawn) {
            return message.reply("❌ Ông chưa gọi con Pokémon nào ra cả! Hãy dùng `!spawn` trước.");
        }

        const guestName = args[0]?.toLowerCase();
        
        if (guestName === userSpawn.name) {
            // 1. Lưu vào Hộp
            db[userId].hop.push({
                name: userSpawn.name,
                level: userSpawn.level
            });
            db[userId].money += 200;
            db[userId].catchCount += 1;

            // 2. Xóa tin nhắn spawn riêng của người đó
            userSpawn.message.delete().catch(() => {});

            // 3. Thông báo và dọn dẹp bộ nhớ
            message.reply(`🎯 Chúc mừng **${message.author.username}** đã thu phục thành công **${userSpawn.name.toUpperCase()}** (Lvl ${userSpawn.level})!`);
            
            delete activeSpawns[userId]; // Xóa slot chờ để có thể spawn tiếp
        } else {
            message.reply("❌ Sai tên rồi, nhìn kỹ lại xem!");
        }
    }
    // ================= [ LỆNH !HOP / !CHECK - BẢN ĐẸP ] =================
    if (command === 'hop' || command === 'check') {
        const target = message.mentions.users.first() || message.author;
        const userData = db[target.id];

        if (!userData || !userData.hop) return message.reply("Người này chưa có dữ liệu Pokémon!");

        // Xử lý danh sách: Hiển thị Tên + Level
        const pokemonList = userData.hop.length > 0 
            ? userData.hop.map((p, i) => `\`${i + 1}.\` **${p.name.toUpperCase()}** (Lvl ${p.level})`).join("\n") 
            : "Hộp đang trống không!";

        const hopEmbed = new EmbedBuilder()
            .setTitle(`📦 HỘP POKÉMON: ${target.username.toUpperCase()}`)
            .setColor('#3498db')
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '💰 Tiền mặt', value: `\`${userData.money.toLocaleString()} xu\``, inline: true },
                { name: '📊 Tổng bắt', value: `\`${userData.catchCount} con\``, inline: true }
            )
            .addFields(
                { name: '📋 Danh sách Pokémon hiện có', value: pokemonList.length > 1024 ? "Hộp quá nhiều Pokémon, không thể hiển thị hết!" : pokemonList }
            )
            .setFooter({ text: `Yêu cầu bởi ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.reply({ embeds: [hopEmbed] });
    }
   // ================= [ LỆNH !TRADE - NÂNG CẤP ] =================
    if (command === 'trade') {
        const target = message.mentions.users.first();
        if (!target || target.id === userId) return message.reply("Tag người muốn trade cùng!");

        const myPokeName = args[1]?.toLowerCase();
        const theirPokeName = args[2]?.toLowerCase();

        if (!myPokeName || !theirPokeName) return message.reply("Cú pháp: `!trade @user [tên_mình] [tên_họ]`");

        if (!db[target.id]) return message.reply("Người kia chưa có dữ liệu Pokémon!");

        // Tìm vị trí Pokemon trong Hộp (Xử lý Object)
        const myIdx = db[userId].hop.findIndex(p => p.name.toLowerCase() === myPokeName);
        const theirIdx = db[target.id].hop.findIndex(p => p.name.toLowerCase() === theirPokeName);

        if (myIdx === -1) return message.reply(`Ông không có Pokémon nào tên **${myPokeName.toUpperCase()}** trong Hộp!`);
        if (theirIdx === -1) return message.reply(`**${target.username}** không có Pokémon nào tên **${theirPokeName.toUpperCase()}** trong Hộp!`);

        // Lấy dữ liệu Pokemon ra để hiển thị Level cho chuẩn
        const myPokeData = db[userId].hop[myIdx];
        const theirPokeData = db[target.id].hop[theirIdx];

        const tradeEmbed = new EmbedBuilder()
            .setTitle('🤝 GIAO DỊCH HỘP POKÉMON')
            .setColor('#e67e22')
            .setDescription(`<@${target.id}> ơi, **${message.author.username}** muốn trao đổi Pokémon với ông!`)
            .addFields(
                { 
                    name: `📦 ${message.author.username} đưa:`, 
                    value: `**${myPokeData.name.toUpperCase()}**\n\`Lvl ${myPokeData.level}\``, 
                    inline: true 
                },
                { 
                    name: `↔️`, 
                    value: `\u200B`, 
                    inline: true 
                },
                { 
                    name: `📦 ${target.username} đưa:`, 
                    value: `**${theirPokeData.name.toUpperCase()}**\n\`Lvl ${theirPokeData.level}\``, 
                    inline: true 
                }
            )
            .setFooter({ text: 'Gõ "ok" để chốt đơn | Hết hạn sau 30s' });

        message.channel.send({ content: `<@${target.id}>`, embeds: [tradeEmbed] });

        const filter = m => m.author.id === target.id && m.content.toLowerCase() === 'ok';
        const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

        collector.on('collect', () => {
            // Kiểm tra lại lần nữa trước khi swap (Tránh lỗi nếu dữ liệu thay đổi trong lúc chờ)
            const checkMyIdx = db[userId].hop.findIndex(p => p.name.toLowerCase() === myPokeName);
            const checkTheirIdx = db[target.id].hop.findIndex(p => p.name.toLowerCase() === theirPokeName);

            if (checkMyIdx !== -1 && checkTheirIdx !== -1) {
                // Lấy data ra
                const p1 = db[userId].hop.splice(checkMyIdx, 1)[0];
                const p2 = db[target.id].hop.splice(checkTheirIdx, 1)[0];

                // Đổi chỗ
                db[userId].hop.push(p2);
                db[target.id].hop.push(p1);

                return message.channel.send(`✅ **GIAO DỊCH THÀNH CÔNG!**\n**${message.author.username}** nhận được ${p2.name.toUpperCase()} (Lvl ${p2.level})\n**${target.username}** nhận được ${p1.name.toUpperCase()} (Lvl ${p1.level})`);
            } else {
                return message.channel.send("❌ Giao dịch thất bại! Một trong hai người không còn giữ Pokémon đó nữa.");
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                message.channel.send(`⏰ Hết thời gian giao dịch giữa **${message.author.username}** và **${target.username}**.`);
            }
        });
    }
    if (command === 'toppk') {
        const topList = Object.entries(db)
            .sort(([, a], [, b]) => b.catchCount - a.catchCount)
            .slice(0, 10)
            .map(([id, data], index) => `${index + 1}. <@${id}>: \`${data.catchCount} con\``)
            .join('\n');

        const topEmbed = new EmbedBuilder()
            .setTitle('🏆 BXH BẬC THẦY POKÉMON')
            .setColor('#f1c40f')
            .setDescription(topList || "Chưa có ai trên bảng xếp hạng!")
            .setTimestamp();

        message.channel.send({ embeds: [topEmbed] });
    }
    if (command === 'phongsinh') {
        const name = args[0]?.toLowerCase();
        if (!name) return message.reply("Ghi tên con muốn phóng sinh cha nội!");

        const idx = db[userId].hop.findIndex(p => p.name.toLowerCase() === name);
        if (idx === -1) return message.reply("Làm gì có con đó trong Hộp!");

        db[userId].hop.splice(idx, 1);
        db[userId].money += 100; // Thưởng 100 xu khi phóng sinh

        message.reply(`🕊️ Ông đã thả **${name.toUpperCase()}** về tự nhiên và nhận được \`100 xu\`!`);
    }
    if (command === 'train') {
        const name = args[0]?.toLowerCase();
        if (!name) return message.reply("Chọn con nào để huấn luyện?");

        const idx = db[userId].hop.findIndex(p => p.name.toLowerCase() === name);
        if (idx === -1) return message.reply("Con này không có trong Hộp!");

        if (db[userId].money < 500) return message.reply("Không đủ 500 xu để huấn luyện!");

        db[userId].money -= 500;
        db[userId].hop[idx].level += Math.floor(Math.random() * 5) + 1; // Tăng 1-5 level

        message.reply(`⚔️ **${name.toUpperCase()}** vừa hoàn thành khóa huấn luyện! Cấp hiện tại: \`Lvl ${db[userId].hop[idx].level}\``);
    }
    if (command === 'daily') {
        // Lưu ý: Do dùng biến db trong RAM nên reset bot là có thể gõ lại được ngay
        db[userId].money += 1000;
        message.reply("💰 Ông đã nhận được quà điểm danh: \`1,000 xu\`!");
    }
    if (command === 'ev') {
        const name = args[0]?.toLowerCase();
        const evolutionMap = {
            "pichu": "pikachu",
            "pikachu": "raichu",
            "bulbasaur": "ivysaur",
            "ivysaur": "venusaur",
            "charmander": "charmeleon",
            "charmeleon": "charizard",
            "squirtle": "wartortle",
            "wartortle": "blastoise"
        };

        const idx = db[userId].hop.findIndex(p => p.name.toLowerCase() === name);
        if (idx === -1) return message.reply("Con này không có trong Hộp!");

        const nextForm = evolutionMap[name];
        if (!nextForm) return message.reply("Con này không thể tiến hóa hoặc chưa cập nhật!");

        if (db[userId].hop[idx].level < 30) return message.reply(`Cần đạt \`Lvl 30\` mới tiến hóa được! (Hiện tại: ${db[userId].hop[idx].level})`);

        db[userId].hop[idx].name = nextForm;
        message.reply(`✨ Chúc mừng! **${name.toUpperCase()}** của ông đã tiến hóa thành **${nextForm.toUpperCase()}**!`);
    }
});

client.login(process.env.TOKEN);
