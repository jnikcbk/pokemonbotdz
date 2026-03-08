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
// Dữ liệu lưu tạm
let pkAuto = {}; 
let db = {}; 
let currentGlobalPokemon = null; // CẦN THÊM DÒNG NÀY

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
 // ================= [ LỆNH !PKAUTO - AUTO SPAWN 30S ] =================
if (command === 'pkauto') {
    const channelId = message.channel.id;

    // Nếu đang bật thì tắt
    if (pkAuto[channelId]) {
        clearInterval(pkAuto[channelId]);
        delete pkAuto[channelId];
        return message.reply({ embeds: [
            new EmbedBuilder()
                .setDescription("🛑 **HỆ THỐNG AUTO SPAWN ĐÃ DỪNG**")
                .setColor('#ff0000')
        ]});
    }

    // Thông báo bắt đầu
    const startEmbed = new EmbedBuilder()
        .setTitle("🚀 KÍCH HOẠT CHẾ ĐỘ AUTO SPAWN")
        .setDescription("Cứ mỗi **30 giây**, một Pokémon sẽ xuất hiện. Ai gõ `!bat [tên]` nhanh nhất sẽ sở hữu!")
        .setColor('#2ecc71')
        .setFooter({ text: "Gõ !pkauto lần nữa để tắt chế độ này" });

    message.channel.send({ embeds: [startEmbed] });
    
    // Bắt đầu vòng lặp 30 giây
    pkAuto[channelId] = setInterval(async () => {
        // 1. Xóa tin nhắn Pokemon cũ nếu chưa ai bắt để sạch kênh chat
        if (currentGlobalPokemon && currentGlobalPokemon.message) {
            currentGlobalPokemon.message.delete().catch(() => {});
        }

        const randomId = Math.floor(Math.random() * 898) + 1;
        const randomLevel = Math.floor(Math.random() * 100) + 1;

        try {
            const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
            const pokeName = res.data.name;
            const pokeType = res.data.types[0].type.name;

            // Bảng màu theo hệ cho chuyên nghiệp
            const typeColors = {
                fire: '#ff421c', water: '#1c93ff', grass: '#1cff42', 
                electric: '#ffee1c', psychic: '#ff1cb3', ice: '#1cffff'
            };

            const autoEmbed = new EmbedBuilder()
                .setAuthor({ name: "⚡ POKÉMON HOANG DÃ XUẤT HIỆN!", iconURL: "https://i.imgur.com/399vA7N.png" })
                .setTitle(`✨ ${pokeName.toUpperCase()} ✨`)
                .setColor(typeColors[pokeType] || '#ffcb05')
                .addFields(
                    { name: '🆙 Cấp độ', value: `\`Lvl ${randomLevel}\``, inline: true },
                    { name: '🧬 Hệ', value: `\`${pokeType.toUpperCase()}\``, inline: true }
                )
                .setImage(res.data.sprites.other['official-artwork'].front_default)
                .setFooter({ text: "Nhanh tay gõ !bat [tên] để thu phục!" })
                .setTimestamp();

            const sMsg = await message.channel.send({ embeds: [autoEmbed] });

            // Lưu thông tin con Pokemon hiện tại vào biến toàn cục
            currentGlobalPokemon = { 
                name: pokeName.toLowerCase(), 
                level: randomLevel, 
                message: sMsg 
            };

        } catch (e) { 
            console.log("Lỗi hệ thống Spawn: " + e.message); 
        }
    }, 30000); // 30000ms = 30 giây
}
    if (command === 'dau' || command === 'pvp') {
        const target = message.mentions.users.first();
        const myPokeName = args[1]?.toLowerCase();

        if (!target || target.id === userId) return message.reply("Tag đối thủ để thách đấu!");
        if (!myPokeName) return message.reply("Cú pháp: `!dau @user [tên_pokemon_của_ông]`");

        // Tìm Pokemon trong Hộp của mình
        const myIdx = db[userId].hop.findIndex(p => p.name.toLowerCase() === myPokeName);
        if (myIdx === -1) return message.reply(`Ông không có ${myPokeName} trong Hộp!`);
        
        const myPoke = db[userId].hop[myIdx];

        message.channel.send(`⚔️ **${message.author.username}** thách đấu **${target.username}** bằng **${myPoke.name.toUpperCase()}** (Lvl ${myPoke.level})!\n👉 <@${target.id}> gõ \`dongy [tên_pokemon_của_ông]\` để tiếp chiêu!`);

        const filter = m => m.author.id === target.id && m.content.toLowerCase().startsWith('dongy');
        const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

        collector.on('collect', m => {
            const opponentPokeName = m.content.split(' ')[1]?.toLowerCase();
            if (!db[target.id]) return m.reply("Ông chưa có Pokemon nào!");
            
            const targetIdx = db[target.id].hop.findIndex(p => p.name.toLowerCase() === opponentPokeName);
            if (targetIdx === -1) return m.reply(`Ông không có con ${opponentPokeName} nào cả!`);

            const theirPoke = db[target.id].hop[targetIdx];

            // Logic chiến đấu (Ai level cao hơn + 1 chút may mắn sẽ thắng)
            const myPower = myPoke.level + Math.floor(Math.random() * 20);
            const theirPower = theirPoke.level + Math.floor(Math.random() * 20);

            let winner, loser, winMoney = 500;
            if (myPower > theirPower) {
                winner = message.author; loser = target;
                db[userId].money += winMoney;
            } else {
                winner = target; loser = message.author;
                db[target.id].money += winMoney;
            }

            const battleEmbed = new EmbedBuilder()
                .setTitle('🥊 KẾT QUẢ TRẬN ĐẤU')
                .setColor('#e74c3c')
                .setDescription(`**${myPoke.name.toUpperCase()}** (Lvl ${myPoke.level}) vs **${theirPoke.name.toUpperCase()}** (Lvl ${theirPoke.level})`)
                .addFields({ name: '🏆 NGƯỜI THẮNG', value: `${winner.username} nhận được \`${winMoney} xu\`!` })
                .setTimestamp();

            message.channel.send({ embeds: [battleEmbed] });
        });
    }
   if (command === 'bat' || command === 'batpokemon') {
        if (!currentGlobalPokemon) return message.reply("❌ Hết con để bắt rồi! Đợi đợt spawn tiếp theo nhé.");

        const guestName = args[0]?.toLowerCase();
        
        if (guestName === currentGlobalPokemon.name) {
            // Đảm bảo db[userId] luôn tồn tại
            if (!db[userId]) {
                db[userId] = { money: 5000, hop: [], catchCount: 0 };
            }

            db[userId].hop.push({
                name: currentGlobalPokemon.name,
                level: currentGlobalPokemon.level
            });

            db[userId].money += 200;
            db[userId].catchCount += 1;

            if (currentGlobalPokemon.message) {
                currentGlobalPokemon.message.delete().catch(() => {});
            }

            message.reply(`🎯 **${message.author.username}** đã bắt được **${currentGlobalPokemon.name.toUpperCase()}** (Lvl ${currentGlobalPokemon.level})!`);
            
            currentGlobalPokemon = null; 
        } else {
            message.reply("❌ Sai tên rồi!");
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
