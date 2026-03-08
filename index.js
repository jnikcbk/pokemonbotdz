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

    // ================= [ LỆNH !PHELP - CẬP NHẬT FULL OPTION ] =================
    if (command === 'phelp') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🎮 POKÉMON BOT - CẨM NANG TOÀN TẬP')
            .setColor('#e74c3c')
            .setThumbnail('https://i.imgur.com/vHdfZfC.png')
            .setDescription('Chào mừng ông đến với thế giới Pokémon! Dưới đây là danh sách lệnh đã được nâng cấp:')
            .addFields(
                { 
                    name: '🐾 SĂN BẮT & TRA CỨU', 
                    value: '`!pkauto`: Bật/Tắt tự động xuất hiện Pokémon.\n`!bat [tên]`: Thu phục Pokémon đang xuất hiện.\n`!pokedex [trang]`: Xem danh sách ID và tên Pokémon.' 
                },
                { 
                    name: '📦 QUẢN LÝ & PHÁT TRIỂN', 
                    value: '`!hop`: Kiểm tra túi đồ và số dư.\n`!train [tên]`: Huấn luyện tăng cấp (Phí tăng theo Level).\n`!ev [tên]`: Tiến hóa khi đạt cấp độ yêu cầu.\n`!phongsinh [tên]`: Thả Pokémon nhận lại xu.' 
                },
                { 
                    name: '⚔️ ĐẤU TRƯỜNG & BXH', 
                    value: '`!dau @user [tên]`: Thách đấu PvP cực kịch tính.\n`!toppk`: Bảng xếp hạng những cao thủ săn bắt hàng đầu.\n`!daily`: Điểm danh nhận quà hàng ngày.' 
                },
                { 
                    name: '🛡️ QUYỀN HẠN ADMIN (QUẢN TRỊ)', 
                    value: '`!addpk @user [Tên/ID] [Lvl]`: Tặng Pokémon cho người chơi.\n`!addxu @user [số_tiền]`: Cấp thêm xu vàng vào tài khoản.' 
                }
            )
            .addFields({ 
                name: '💡 Mẹo Nhỏ', 
                value: 'Sử dụng `!pokedex` để biết ID Pokémon, sau đó Admin có thể dùng ID đó để `!addpk` cực nhanh!' 
            })
            .setFooter({ text: `Yêu cầu bởi ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.reply({ embeds: [helpEmbed] });
    }
// ================= [ LỆNH !PKAUTO - FIX 1 KÊNH CỐ ĐỊNH ] =================
if (command === 'pkauto') {
    // Nếu đang chạy thì tắt hẳn
    if (pkAuto) {
        clearInterval(pkAuto);
        pkAuto = null;
        currentGlobalPokemon = null;
        return message.channel.send("🛑 **ĐÃ TẮT CHẾ ĐỘ TỰ ĐỘNG SPAWN.**");
    }

    // Lưu đúng cái kênh ông vừa gõ lệnh vào một biến
    const spawnChannel = message.channel;

    message.channel.send(`🚀 **BẮT ĐẦU SPAWN TẠI KÊNH:** ${spawnChannel}\n⏱️ Chu kỳ: **20 giây/con**`);

    pkAuto = setInterval(async () => {
        // Xóa con cũ nếu có
        if (currentGlobalPokemon && currentGlobalPokemon.message) {
            currentGlobalPokemon.message.delete().catch(() => {});
        }

        const randomId = Math.floor(Math.random() * 898) + 1;
        const randomLevel = Math.floor(Math.random() * 100) + 1;

        try {
            const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
            const pokeName = res.data.name;
            const pokeType = res.data.types[0].type.name;

            const autoEmbed = new EmbedBuilder()
                .setTitle(`✨ POKÉMON XUẤT HIỆN: ${pokeName.toUpperCase()} ✨`)
                .setColor('#f1c40f')
                .addFields(
                    { name: '🆙 Cấp độ', value: `\`Lvl ${randomLevel}\``, inline: true },
                    { name: '🧬 Hệ', value: `\`${pokeType.toUpperCase()}\``, inline: true },
                    { name: '📊 Chỉ số', value: `❤️ HP: \`${50 + randomLevel * 2}\` | ⚔️ ATK: \`${10 + Math.floor(randomLevel * 1.2)}\`` }
                )
                .setImage(res.data.sprites.other['official-artwork'].front_default)
                .setFooter({ text: "Gõ !bat [tên] để thu phục!" })
                .setTimestamp();

            // LUÔN GỬI VÀO CÁI KÊNH ĐÃ SETUP
            const sMsg = await spawnChannel.send({ embeds: [autoEmbed] });

            currentGlobalPokemon = { 
                name: pokeName.toLowerCase(), 
                level: randomLevel, 
                message: sMsg 
            };

        } catch (e) {
            console.log("Lỗi spawn: " + e.message);
        }
    }, 20000); // Chu kỳ 20 giây
}
    // ================= [ LỆNH !DAU - CHI TIẾT CỰC HẠN ] =================
    if (command === 'dau' || command === 'pvp') {
        const target = message.mentions.users.first();
        const myPokeName = args[1]?.toLowerCase();

        if (!target || target.id === userId) return message.reply("Tag đối thủ để thách đấu!");
        if (!myPokeName) return message.reply("Cú pháp: `!dau @user [tên_pokemon]`");

        const myIdx = db[userId].hop.findIndex(p => p.name.toLowerCase() === myPokeName);
        if (myIdx === -1) return message.reply(`Ông không có ${myPokeName} trong Hộp!`);
        
        const myPoke = db[userId].hop[myIdx];

        const inviteEmbed = new EmbedBuilder()
            .setTitle('⚔️ LỜI THÁCH ĐẤU TỪ CAO THỦ')
            .setColor('#f1c40f')
            .setThumbnail(message.author.displayAvatarURL())
            .setDescription(`**${message.author.username}** vung PokeBall chọn **${myPoke.name.toUpperCase()}**!\n\n> <@${target.id}>, ông có dám tiếp chiêu không?`)
            .addFields(
                { name: '📊 Thông số đối thủ', value: `\`Lvl: ${myPoke.level}\` | \`Hệ: ${myPoke.type || 'Thường'}\`` },
                { name: '📝 Cách trả lời', value: 'Gõ `dongy [tên_pokemon]` để ra trận!' }
            )
            .setFooter({ text: "Thời gian chờ: 30 giây" });

        message.channel.send({ content: `<@${target.id}>`, embeds: [inviteEmbed] });

        const filter = m => m.author.id === target.id && m.content.toLowerCase().startsWith('dongy');
        const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

        collector.on('collect', async m => {
            const opponentPokeName = m.content.split(' ')[1]?.toLowerCase();
            if (!db[target.id]) return m.reply("Ông chưa có dữ liệu Pokémon!");
            
            const targetIdx = db[target.id].hop.findIndex(p => p.name.toLowerCase() === opponentPokeName);
            if (targetIdx === -1) return m.reply(`Ông không có con **${opponentPokeName?.toUpperCase()}** này!`);

            const theirPoke = db[target.id].hop[targetIdx];

            // --- TÍNH TOÁN CHỈ SỐ CHI TIẾT ---
            const myHP = 100 + (myPoke.level * 5);
            const theirHP = 100 + (theirPoke.level * 5);
            
            // Tính toán may mắn và sát thương
            const myLuck = Math.floor(Math.random() * 20);
            const theirLuck = Math.floor(Math.random() * 20);
            
            const myTotalPower = myPoke.level + myLuck;
            const theirTotalPower = theirPoke.level + theirLuck;

            // Dẫn truyện trận đấu
            const battleLog = [
                `🔥 **${myPoke.name.toUpperCase()}** tung chiêu nộ kích!`,
                `🌪️ **${theirPoke.name.toUpperCase()}** phản công mạnh mẽ!`,
                `✨ Cả hai bên đều đang dốc hết sức bình sinh...`
            ];

            let winner, loser, winMoney = 1000;
            if (myTotalPower > theirTotalPower) {
                winner = message.author; loser = target;
                db[userId].money += winMoney;
            } else {
                winner = target; loser = message.author;
                db[target.id].money += winMoney;
            }

            const resultEmbed = new EmbedBuilder()
                .setTitle('🥊 ĐẤU TRƯỜNG SINH TỬ - KẾT QUẢ')
                .setColor(myTotalPower > theirTotalPower ? '#3498db' : '#e74c3c')
                .setDescription(`${battleLog[Math.floor(Math.random() * battleLog.length)]}`)
                .addFields(
                    { 
                        name: `🔵 ${message.author.username}`, 
                        value: `Pokémon: **${myPoke.name.toUpperCase()}**\nCấp: \`${myPoke.level}\`\nLực chiến: \`${myTotalPower}\``, 
                        inline: true 
                    },
                    { name: '⚡ VS ⚡', value: '\u200B', inline: true },
                    { 
                        name: `🔴 ${target.username}`, 
                        value: `Pokémon: **${theirPoke.name.toUpperCase()}**\nCấp: \`${theirPoke.level}\`\nLực chiến: \`${theirTotalPower}\``, 
                        inline: true 
                    },
                    { 
                        name: '🏆 KẾT LUẬN', 
                        value: `**${winner.username}** giành chiến thắng và nhận ngay **${winMoney} xu**!` 
                    }
                )
                .setImage('https://i.imgur.com/G9L6RGo.gif') // Link gif đấu nhau nếu có
                .setFooter({ text: "Trận đấu đã được ghi vào lịch sử server!" })
                .setTimestamp();

            message.channel.send({ embeds: [resultEmbed] });
        });
    }
   if (command === 'bat' || command === 'batpokemon') {
    message.delete().catch(() => {}); // Xóa lệnh gõ cho sạch

    if (!currentGlobalPokemon) return;

    const guess = args[0]?.toLowerCase();
    
    if (guess === currentGlobalPokemon.name) {
        if (!db[userId]) db[userId] = { money: 5000, hop: [], catchCount: 0 };

        db[userId].hop.push({
            name: currentGlobalPokemon.name,
            level: currentGlobalPokemon.level
        });

        db[userId].money += 200;
        db[userId].catchCount += 1;

        // Xóa ảnh Pokemon
        if (currentGlobalPokemon.message) {
            currentGlobalPokemon.message.delete().catch(() => {});
        }

        const success = await message.channel.send(`✨ **${message.author.username}** bắt được **${currentGlobalPokemon.name.toUpperCase()}**! (+200 xu)`);
        
        currentGlobalPokemon = null; // Reset để chờ con sau
        setTimeout(() => success.delete().catch(() => {}), 3000);
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
  // ================= [ LỆNH !TOPPK - PHIÊN BẢN ĐẠI GIA ] =================
    if (command === 'toppk') {
        const sortedEntries = Object.entries(db)
            .sort(([, a], [, b]) => b.catchCount - a.catchCount); // Sắp xếp theo số lượng bắt

        const top10 = sortedEntries.slice(0, 10);
        
        // Tìm vị trí của người gõ lệnh trong bảng xếp hạng
        const userRank = sortedEntries.findIndex(([id]) => id === userId) + 1;

        const medals = ['🥇', '🥈', '🥉', '🏅']; // Icon cho các thứ hạng

        const topList = top10.map(([id, data], index) => {
            const medal = index < 3 ? medals[index] : `\`#${index + 1}\``;
            return `${medal} <@${id}> — **${data.catchCount}** con | \`${data.money.toLocaleString()} xu\``;
        }).join('\n');

        const topEmbed = new EmbedBuilder()
            .setAuthor({ name: "BẢNG VÀNG CAO THỦ POKÉMON", iconURL: "https://i.imgur.com/vHdfZfC.png" })
            .setTitle('🏆 NHỮNG BẬC THẦY SĂN ĐUỔI HÀNG ĐẦU')
            .setColor('#f1c40f')
            .setThumbnail('https://i.imgur.com/399vA7N.png') // Ảnh trang trí
            .setDescription(topList || "🌵 *Chưa có ai tham gia săn bắt...*")
            .addFields({ 
                name: '👤 Thứ hạng của ông', 
                value: userRank > 0 ? `Ông đang đứng thứ **#${userRank}** trên toàn server!` : "Ông chưa có tên trên bảng vàng." 
            })
            .setFooter({ text: `Yêu cầu bởi ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        message.channel.send({ embeds: [topEmbed] });
    }
    // ================= [ LỆNH !POKEDEX - TRA CỨU DANH SÁCH ] =================
    if (command === 'pokedex' || command === 'dex') {
        const page = parseInt(args[0]) || 1; // Mặc định trang 1
        const limit = 20; // Mỗi trang hiện 20 con
        const offset = (page - 1) * limit;

        try {
            // Lấy danh sách từ API theo trang
            const res = await axios.get(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
            const pokemonList = res.data.results;
            
            if (pokemonList.length === 0) return message.reply("❌ Trang này không có Pokémon nào đâu ông!");

            const listString = pokemonList.map((p, i) => {
                const id = offset + i + 1;
                return `\`#${id.toString().padStart(3, '0')}\` **${p.name.toUpperCase()}**`;
            }).join('\n');

            const dexEmbed = new EmbedBuilder()
                .setTitle('📚 THƯ VIỆN POKÉMON (POKÉDEX)')
                .setColor('#3498db')
                .setThumbnail('https://i.imgur.com/399vA7N.png')
                .setDescription(`Đang hiển thị danh sách từ **#${offset + 1}** đến **#${offset + pokemonList.length}**\n\n${listString}`)
                .addFields({ name: '📖 Hướng dẫn', value: `Gõ \`!pokedex ${page + 1}\` để xem trang tiếp theo.` })
                .setFooter({ text: `Trang ${page} | Tổng cộng: 1000+ Pokémon` })
                .setTimestamp();

            message.channel.send({ embeds: [dexEmbed] });

        } catch (e) {
            message.reply("❌ Lỗi khi lấy danh sách Pokémon!");
        }
    }
    if (command === 'addpokemon' || command === 'addpk') {
        if (!message.member.permissions.has("ManageMessages")) return message.reply("Cút!");

        const target = message.mentions.users.first();
        const input = args[1]; // Có thể là tên "pikachu" hoặc số "25"
        const level = parseInt(args[2]) || 1;

        if (!target || !input) return message.reply("Dùng: `!addpokemon @user [Tên hoặc ID] [Level]`");

        try {
            // Check API bằng ID hoặc Tên đều được
            const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${input.toLowerCase()}`);
            const realName = res.data.name;

            if (!db[target.id]) db[target.id] = { money: 5000, hop: [], catchCount: 0 };

            db[target.id].hop.push({
                name: realName,
                level: level,
                type: res.data.types[0].type.name
            });

            const addEmbed = new EmbedBuilder()
                .setTitle('🎁 ADMIN TẶNG POKÉMON')
                .setColor('#2ecc71')
                .setDescription(`Đã tặng **${realName.toUpperCase()}** cho **${target.username}**`)
                .setThumbnail(res.data.sprites.other['official-artwork'].front_default)
                .addFields({ name: '🆙 Cấp độ', value: `\`Lvl ${level}\`` });

            message.channel.send({ embeds: [addEmbed] });
        } catch (e) {
            message.reply("❌ ID hoặc Tên Pokémon không tồn tại!");
        }
    }
    // ================= [ LỆNH !ADDXUVANG - CHỈ ADMIN ] =================
    if (command === 'addxuvang' || command === 'addxu') {
        // Chỉ những người có quyền Quản lý tin nhắn mới được dùng
        if (!message.member.permissions.has("ManageMessages")) {
            return message.reply("❌ Quyền hạn không đủ! Chỉ Admin mới được cấp xu vàng.");
        }

        const target = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!target || isNaN(amount)) {
            return message.reply("⚠️ Sai cú pháp rồi sếp! Dùng: `!addxuvang @user [số_tiền]`");
        }

        // Khởi tạo dữ liệu nếu người đó chưa từng chơi
        if (!db[target.id]) {
            db[target.id] = { money: 5000, hop: [], catchCount: 0 };
        }

        // Cộng tiền
        db[target.id].money += amount;

        const xuEmbed = new EmbedBuilder()
            .setTitle('💰 NGÂN KHU ĐÃ GIẢI NGÂN')
            .setColor('#f1c40f')
            .setThumbnail('https://i.imgur.com/399vA7N.png')
            .setDescription(`Admin **${message.author.username}** đã chuyển xu vàng cho **${target.username}**!`)
            .addFields(
                { name: '💵 Số lượng', value: `\`+${amount.toLocaleString()} xu\``, inline: true },
                { name: '💳 Số dư hiện tại', value: `\`${db[target.id].money.toLocaleString()} xu\``, inline: true }
            )
            .setFooter({ text: "Tiền đã được cộng vào tài khoản!" })
            .setTimestamp();

        message.channel.send({ embeds: [xuEmbed] });
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
    // ================= [ LỆNH !TRAIN - LEVEL CÀNG CAO GIÁ CÀNG CHÁT ] =================
    if (command === 'train') {
        const name = args[0]?.toLowerCase();
        if (!name) return message.reply("Chọn con nào để huấn luyện? (Ví dụ: `!train pikachu`) ");

        const idx = db[userId].hop.findIndex(p => p.name.toLowerCase() === name);
        if (idx === -1) return message.reply("Con này không có trong Hộp của ông!");

        const pokemon = db[userId].hop[idx];
        const currentLvl = pokemon.level;

        // --- CÔNG THỨC TÍNH GIÁ ĐỘNG ---
        // Level càng cao, phí càng tăng. Cấp 100 thì khỏi train nữa.
        if (currentLvl >= 100) return message.reply(`🔥 **${name.toUpperCase()}** đã đạt cấp tối đa (Lvl 100), không thể huấn luyện thêm!`);

        const baseCost = 500;
        const upgradeCost = baseCost + (currentLvl * 100); // Công thức: 500 + (Lvl * 100)

        if (db[userId].money < upgradeCost) {
            return message.reply(`💸 Không đủ tiền rồi! Để huấn luyện **${name.toUpperCase()}** (Lvl ${currentLvl}) ông cần tới \`${upgradeCost.toLocaleString()} xu\`.`);
        }

        // Thực hiện trừ tiền và tăng level
        db[userId].money -= upgradeCost;
        const lvGain = Math.floor(Math.random() * 3) + 1; // Giảm xuống tăng 1-3 level cho quý giá
        db[userId].hop[idx].level += lvGain;

        const trainEmbed = new EmbedBuilder()
            .setTitle('⚔️ PHÒNG TẬP GYM POKÉMON')
            .setColor('#e67e22')
            .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
            .setDescription(`Huấn luyện thành công **${name.toUpperCase()}**!`)
            .addFields(
                { name: '📈 Level mới', value: `\`Lvl ${currentLvl}\` ➡️ \`Lvl ${db[userId].hop[idx].level}\``, inline: true },
                { name: '💰 Phí huấn luyện', value: `\`-${upgradeCost.toLocaleString()} xu\``, inline: true }
            )
            .setFooter({ text: `Số dư còn lại: ${db[userId].money.toLocaleString()} xu` })
            .setTimestamp();

        message.channel.send({ embeds: [trainEmbed] });
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
