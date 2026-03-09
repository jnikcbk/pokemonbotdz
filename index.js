const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs'); // <--- PHẢI CÓ CÁI NÀY ĐỂ LƯU FILE

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

// --- PHẦN QUAN TRỌNG: ĐỌC DỮ LIỆU TỪ FILE ---
let db = {};
const DB_PATH = './db.json';
// Tìm chỗ khai báo let db = {}; rồi dán đoạn này ngay dưới:
function saveDB() {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 4));
}
if (fs.existsSync(DB_PATH)) {
    try {
        const rawData = fs.readFileSync(DB_PATH, 'utf-8');
        db = JSON.parse(rawData);
        console.log("📂 Đã tải dữ liệu người chơi thành công!");
    } catch (e) {
        console.log("⚠️ File db.json bị lỗi, khởi tạo mới!");
        db = {};
    }
}

// Hàm lưu dữ liệu (Dùng sau mỗi lần thay đổi tiền hoặc túi đồ)
function saveDB() {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 4));
}

let pkAuto = null; // Quản lý 1 vòng lặp duy nhất
let currentGlobalPokemon = null; 
let spawnChannelId = null;

const PREFIX = "!";

client.on('ready', () => {
    console.log(`✅ Pokemon Bot đã sẵn sàng: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

    // Khởi tạo dữ liệu người dùng (Chỉ làm nếu chưa có trong db đã đọc)
    if (!db[userId]) {
        db[userId] = { 
            money: 5000, 
            hop: [], 
            catchCount: 0 
        };
        saveDB(); // Lưu ngay người dùng mới vào file
    }
const MARKET_PATH = './market.json';
let market = [];
if (fs.existsSync(MARKET_PATH)) {
    market = JSON.parse(fs.readFileSync(MARKET_PATH, 'utf-8'));
}
function saveMarket() {
    fs.writeFileSync(MARKET_PATH, JSON.stringify(market, null, 4));
}
    // ================= [ LỆNH !PKSHINY - BẢNG VÀNG SHINY TOÀN SERVER ] =================
    if (command === 'pkshiny' || command === 'allshiny') {
        let allShiny = [];

        // 1. Duyệt qua tất cả người dùng trong Database
        for (const userId in db) {
            const userData = db[userId];
            if (userData.hop && Array.isArray(userData.hop)) {
                // Lọc ra các con Shiny trong túi của người này
                const userShinies = userData.hop.filter(p => p.shiny === true);
                
                // Thêm vào danh sách tổng kèm tên chủ sở hữu
                userShinies.forEach(p => {
                    allShiny.push({
                        name: p.name,
                        level: p.level,
                        ownerId: userId,
                        // Nếu không có ngày bắt thì để "Không rõ"
                        date: p.date || p.catchDate || "Đã lâu"
                    });
                });
            }
        }

        if (allShiny.length === 0) {
            return message.reply("😭 Server này chưa ai đủ nhân phẩm để bắt được **Shiny** cả!");
        }

        // 2. Sắp xếp: Con nào Level cao nhất lên đầu
        allShiny.sort((a, b) => b.level - a.level);

        const page = parseInt(args[0]) || 1;
        const itemsPerPage = 10;
        const totalPages = Math.ceil(allShiny.length / itemsPerPage);
        const start = (page - 1) * itemsPerPage;
        const currentList = allShiny.slice(start, start + itemsPerPage);

        if (currentList.length === 0) return message.reply("Trang này trống!");

        const displayList = currentList.map((p, i) => {
            return `\`${start + i + 1}.\` ✨ **${p.name.toUpperCase()}** (Lvl ${p.level})\n└ Chủ sở hữu: <@${p.ownerId}>`;
        }).join("\n\n");

        const allShinyEmbed = new EmbedBuilder()
            .setTitle('🏆 BẢNG VÀNG POKÉMON SHINY SERVER 🏆')
            .setColor('#f1c40f')
            .setThumbnail('https://i.imgur.com/vHdfZfC.png')
            .setDescription(`Tổng cộng server đã săn được: **${allShiny.length}** con Shiny!\n\n${displayList}`)
            .setFooter({ text: `Trang ${page}/${totalPages} | Những kẻ may mắn nhất server` })
            .setTimestamp();

        return message.reply({ embeds: [allShinyEmbed] });
    }
  // ================= [ LỆNH !PHELP - CẬP NHẬT FULL OPTION + CHỢ ĐEN ] =================
    if (command === 'phelp') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🎮 POKÉMON BOT - CẨM NANG TOÀN TẬP')
            .setColor('#e74c3c')
            .setThumbnail('https://i.imgur.com/vHdfZfC.png')
            .setDescription('Chào mừng ông đến với thế giới Pokémon! Dưới đây là danh sách lệnh đã được nâng cấp hệ thống **Shiny** và **Chợ Đen**:')
            .addFields(
                { 
                    name: '🐾 SĂN BẮT & PHÁT TRIỂN', 
                    value: '`!pkauto`: Bật/Tắt tự động xuất hiện Pokémon.\n`!bat [tên]`: Thu phục Pokémon (Có tỉ lệ **Shiny ✨**).\n`!hop [trang]`: Xem túi đồ, số dư và trạng thái Shiny.\n`!train [tên]`: Huấn luyện (Max Lvl 1000).' 
                },
                { 
                    name: '🛒 THƯƠNG MẠI (CHỢ ĐEN)', 
                    value: '`!choden`: Xem danh sách Pokémon hiếm đang bán.\n`!mua [mã_số]`: Mua Pokémon từ Chợ Đen bằng xu.' 
                },
                { 
                    name: '⚔️ ĐẤU TRƯỜNG & TIỆN ÍCH', 
                    value: '`!dau @user [tên]`: Thách đấu PvP.\n`!ev [tên]`: Tiến hóa Pokémon.\n`!daily`: Nhận xu miễn phí mỗi ngày.' 
                },
                { 
                    name: '🛡️ QUYỀN HẠN ADMIN', 
                    value: '`!adsale [tên] [giá] [lvl] [shiny]`: Treo hàng lên Chợ Đen.\n`!addpk @user [tên] [lvl] [shiny]`: Tặng Pokémon.\n`!adclear`: Dọn sạch vật phẩm trên Chợ Đen.' 
                }
            )
            .addFields({ 
                name: '💡 Mẹo Nhỏ', 
                value: 'Pokémon **Shiny ✨** có giá trị rất cao trên Chợ Đen và hiển thị lấp lánh trong túi đồ và gõ !pkshiny để biết thêm trong server có bao nhiêu pokemon shiny đã được bắt!' 
            })
            .setFooter({ text: `Yêu cầu bởi ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.reply({ embeds: [helpEmbed] });
    }
// ================= [ LỆNH !PKAUTO - SPEED 20S + FULL OPTION ] =================
    if (command === 'pkauto') {
        if (!message.member.permissions.has("ManageMessages")) return message.reply("❌ Cút! Quyền Admin mới bật được máy dò Pokémon.");

        if (pkAuto) {
            clearInterval(pkAuto);
            pkAuto = null;
            return message.reply("🛑 **Đã TẮT** tự động xuất hiện Pokémon.");
        }

        const spawnChannel = message.channel;
        message.reply(`✅ **Đã BẬT** máy dò siêu tốc (20 giây/con) tại <#${spawnChannel.id}>!`);

        pkAuto = setInterval(async () => {
            // 1. Dọn dẹp tin nhắn cũ để kênh không bị rác
            if (currentGlobalPokemon && currentGlobalPokemon.message) {
                currentGlobalPokemon.message.delete().catch(() => {});
            }

            // 2. Random: ID (1-898), Level (Max 50 khi spawn), Tỉ lệ Shiny (1/50)
            const randomId = Math.floor(Math.random() * 898) + 1;
            const randomLevel = Math.floor(Math.random() * 50) + 1; // Giới hạn Lv 50
            const isShiny = Math.random() < 1/50;

            try {
                const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
                const pokeName = res.data.name;
                const types = res.data.types.map(t => t.type.name).join(", ").toUpperCase();
                
                // Lấy ảnh Artwork xịn, nếu không có lấy ảnh Pixel thay thế
                let spriteUrl = isShiny 
                    ? res.data.sprites.other['official-artwork'].front_shiny 
                    : res.data.sprites.other['official-artwork'].front_default;
                
                if (!spriteUrl) {
                    spriteUrl = isShiny ? res.data.sprites.front_shiny : res.data.sprites.front_default;
                }

                // 3. Thiết kế Embed chi tiết
                const autoEmbed = new EmbedBuilder()
                    .setTitle(`${isShiny ? '✨ SHINY ' : '🐾'} POKÉMON XUẤT HIỆN! ✨`)
                    .setColor(isShiny ? '#f1c40f' : '#3498db')
                    .setDescription(isShiny 
                        ? `🌟 **CỰC HIẾM!** Một con **${pokeName.toUpperCase()}** lấp lánh vừa lộ diện!` 
                        : `Một con **${pokeName.toUpperCase()}** hoang dã vừa nhảy ra!`)
                    .addFields(
                        { name: '🆔 Tên', value: `\`${pokeName.toUpperCase()}\``, inline: true },
                        { name: '🆙 Cấp độ', value: `\`Lvl ${randomLevel}\``, inline: true },
                        { name: '🧬 Hệ', value: `\`${types}\``, inline: true },
                        { name: '💎 Độ hiếm', value: `\`${isShiny ? 'SHINY (Siêu hiếm ✨)' : 'Thường'}\``, inline: false }
                    )
                    .setImage(spriteUrl)
                    .setThumbnail(isShiny ? 'https://i.imgur.com/vHdfZfC.png' : null)
                    .setFooter({ text: "Gõ !bat [tên] để bắt! | Max Spawn: Lvl 50" })
                    .setTimestamp();

                // 4. Gửi tin nhắn (Tag @here nếu là Shiny cho mọi người tranh)
                const content = isShiny ? "📢 **HÀNG HIẾM @here! MAU LÊN!**" : null;
                const sMsg = await spawnChannel.send({ content: content, embeds: [autoEmbed] });

                // 5. Lưu dữ liệu cho lệnh !bat sử dụng
                currentGlobalPokemon = { 
                    name: pokeName.toLowerCase(), 
                    level: randomLevel, 
                    isShiny: isShiny,
                    message: sMsg 
                };

            } catch (error) {
                console.error("Lỗi API:", error.message);
            }
        }, 20000); // <--- Đã chỉnh chuẩn 20 giây (20000ms)
    }
    // ================= [ LỆNH ADMIN: TREO BÁN ĐỒ CHỢ ĐEN - FULL CHI TIẾT ] =================
    if (command === 'adsale') {
        // 1. Kiểm tra quyền Admin
        if (!message.member.permissions.has("ManageMessages")) {
            return message.reply("❌ Cút! Chợ Đen chỉ dành cho Trùm (Admin) treo hàng.");
        }

        const pokeNameInput = args[0]?.toLowerCase();
        const price = parseInt(args[1]);
        const level = parseInt(args[2]) || 1;
        const typeInput = args[3]?.toLowerCase(); 
        const isShiny = typeInput === 'shiny'; // Kiểm tra xem có gõ chữ 'shiny' không

        if (!pokeNameInput || isNaN(price)) {
            return message.reply("📝 **Cú pháp:** `!adsale [tên] [giá] [level] [shiny/thuong]`\nVí dụ: `!adsale mewtwo 100000 500 shiny` ");
        }

        try {
            // Gọi API để lấy thông tin chi tiết và ảnh
            const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokeNameInput}`);
            const realName = res.data.name;
            const pokeType = res.data.types.map(t => t.type.name).join(", ").toUpperCase();
            const saleId = Math.floor(Math.random() * 9000) + 1000;

            // Lấy ảnh đúng loại (Shiny hoặc Thường) để hiển thị trong Embed
            const spriteUrl = isShiny 
                ? res.data.sprites.other['official-artwork'].front_shiny 
                : res.data.sprites.other['official-artwork'].front_default;

            const newItem = {
                saleId: saleId,
                name: realName,
                price: price,
                level: level,
                shiny: isShiny,
                type: pokeType,
                seller: "HỆ THỐNG ADMIN"
            };

            // Lưu vào danh sách chợ
            market.push(newItem);
            saveMarket();

            // Tạo Embed thông báo treo bán cực đẹp
            const saleEmbed = new EmbedBuilder()
                .setTitle(isShiny ? '✨ [CHỢ ĐEN] NIÊM YẾT HÀNG HIẾM ✨' : '📦 [CHỢ ĐEN] NIÊM YẾT HÀNG MỚI')
                .setColor(isShiny ? '#f1c40f' : '#2ecc71')
                .setThumbnail(isShiny ? 'https://i.imgur.com/vHdfZfC.png' : null)
                .setDescription(`Admin vừa đưa một mặt hàng mới lên sàn giao dịch!`)
                .addFields(
                    { name: '👾 Pokémon', value: `**${realName.toUpperCase()}**`, inline: true },
                    { name: '🆔 Mã số', value: `\`#${saleId}\``, inline: true },
                    { name: '📊 Cấp độ', value: `\`Lvl ${level}\``, inline: true },
                    { name: '🧬 Hệ', value: `\`${pokeType}\``, inline: true },
                    { name: '💎 Loại', value: `\`${isShiny ? 'SHINY ✨' : 'THÔNG THƯỜNG'}\``, inline: true },
                    { name: '💰 Giá bán', value: `**${price.toLocaleString()} xu**`, inline: true }
                )
                .setImage(spriteUrl) // Hiển thị hình ảnh Pokémon ngay khi treo bán
                .setFooter({ text: `Dùng !mua ${saleId} để sở hữu ngay!` })
                .setTimestamp();

            message.channel.send({ embeds: [saleEmbed] });

        } catch (e) {
            console.log(e);
            message.reply("❌ Không tìm thấy Pokémon này! Kiểm tra lại tên nhé ông.");
        }
    }
    // ================= [ LỆNH MEMBER: XEM CHỢ ĐEN - GIAO DIỆN VIP ] =================
    if (command === 'choden' || command === 'blackmarket') {
        if (market.length === 0) {
            const emptyEmbed = new EmbedBuilder()
                .setTitle('🕶️ THỊ TRƯỜNG CHỢ ĐEN')
                .setColor('#2c3e50')
                .setDescription('🛒 *Hiện tại không có món hàng lậu nào được niêm yết. Quay lại sau nhé sếp!*')
                .setTimestamp();
            return message.reply({ embeds: [emptyEmbed] });
        }

        // Tạo danh sách hàng hóa đẹp mắt
        const marketList = market.map((item) => {
            const shinyTag = item.shiny ? "✨ **[SHINY]** " : "🐾 **[THƯỜNG]** ";
            const priceTag = `💰 Giá: \`${item.price.toLocaleString()}\` xu`;
            const stats = `📊 Cấp độ: \`Lvl ${item.level}\` ┃ Mã: \`#${item.saleId}\``;
            
            return `${shinyTag}**${item.name.toUpperCase()}**\n╰ ${stats}\n╰ ${priceTag}\n──────────────────`;
        }).join("\n");

        const marketEmbed = new EmbedBuilder()
            .setAuthor({ name: 'HỆ THỐNG GIAO DỊCH NGẦM', iconURL: 'https://i.imgur.com/vHdfZfC.png' })
            .setTitle('🕶️ DANH SÁCH HÀNG LẬU ĐANG BÀY BÁN')
            .setColor('#2f3136') // Màu tối đặc trưng chợ đen
            .setThumbnail('https://i.imgur.com/6S3Yt6p.png') // Icon túi tiền hoặc pokemon
            .setDescription(`*Chào mừng HLV đến với nơi giao dịch của các Trùm. Hãy chọn món hàng ưng ý và chốt đơn nhanh kẻo lỡ!*\n\n${marketList}`)
            .addFields({ 
                name: '💡 Hướng dẫn mua hàng', 
                value: 'Gõ `!mua [mã_số]` (Ví dụ: `!mua 1234`) để thanh toán và nhận Pokémon ngay lập tức!' 
            })
            .setFooter({ text: `Tổng cộng: ${market.length} mặt hàng đang chờ chủ mới` })
            .setTimestamp();

        message.channel.send({ embeds: [marketEmbed] });
    }

    // ================= [ LỆNH MEMBER: MUA HÀNG - GIAO DIỆN CHỐT ĐƠN VIP ] =================
    if (command === 'mua' || command === 'buy') {
        const saleId = parseInt(args[0]);
        if (!saleId) return message.reply("📝 Nhập mã số món hàng ông muốn mua! (Ví dụ: `!mua 1234`) ");

        const itemIdx = market.findIndex(i => i.saleId === saleId);
        if (itemIdx === -1) return message.reply("❌ Mã hàng này không tồn tại hoặc đã có đại gia khác hốt mất rồi!");

        const item = market[itemIdx];

        // Khởi tạo dữ liệu người mua nếu chưa có
        if (!db[userId]) db[userId] = { money: 5000, hop: [], catchCount: 0 };

        // Kiểm tra số dư
        if (db[userId].money < item.price) {
            return message.reply(`💸 **Nghèo quá sếp ơi!** Ông cần thêm \`${(item.price - db[userId].money).toLocaleString()} xu\` nữa mới đủ chốt con này.`);
        }

        try {
            // Thực hiện trừ tiền và thêm vào túi
            db[userId].money -= item.price; 
            
            const newPokemon = {
                name: item.name,
                level: item.level,
                shiny: item.shiny || false,
                type: item.type || "Chưa rõ",
                date: new Date().toLocaleDateString('vi-VN')
            };
            
            db[userId].hop.push(newPokemon);

            // Xóa khỏi danh sách chợ đen
            market.splice(itemIdx, 1);
            
            // Lưu dữ liệu vào cả 2 file
            saveDB();    
            saveMarket();

            // Lấy ảnh Pokemon để hiển thị trong thông báo chúc mừng
            const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${item.name.toLowerCase()}`);
            const spriteUrl = item.shiny 
                ? res.data.sprites.other['official-artwork'].front_shiny 
                : res.data.sprites.other['official-artwork'].front_default;

            // Thiết kế Embed chúc mừng
            const successEmbed = new EmbedBuilder()
                .setTitle(item.shiny ? '🌟 SIÊU PHẨM ĐÃ CÓ CHỦ! 🌟' : '✅ GIAO DỊCH THÀNH CÔNG!')
                .setColor(item.shiny ? '#f1c40f' : '#2ecc71')
                .setThumbnail(item.shiny ? 'https://i.imgur.com/vHdfZfC.png' : 'https://i.imgur.com/6S3Yt6p.png')
                .setDescription(`Chúc mừng **${message.author.username}** vừa sở hữu một Pokémon cực chất từ **Chợ Đen**!`)
                .addFields(
                    { name: '👾 Pokémon', value: `**${item.name.toUpperCase()}**`, inline: true },
                    { name: '📊 Cấp độ', value: `\`Lvl ${item.level}\``, inline: true },
                    { name: '💎 Loại', value: `\`${item.shiny ? 'SHINY ✨' : 'Thường'}\``, inline: true },
                    { name: '💰 Tổng chi', value: `\`-${item.price.toLocaleString()} xu\``, inline: true },
                    { name: '💳 Số dư còn lại', value: `\`${db[userId].money.toLocaleString()} xu\``, inline: true }
                )
                .setImage(spriteUrl)
                .setFooter({ text: 'Kiểm tra ngay trong !hop của ông nhé!' })
                .setTimestamp();

            return message.channel.send({ content: `<@${userId}>`, embeds: [successEmbed] });

        } catch (e) {
            console.log(e);
            message.reply("🎉 Giao dịch thành công! (Nhưng không lấy được ảnh Pokémon từ API)");
        }
    }
    // ================= [ LỆNH ADMIN: DỌA CHỢ (XÓA HÀNG) ] =================
    if (command === 'adclear') {
        if (!message.member.permissions.has("ManageMessages")) return;
        market = [];
        saveMarket();
        message.reply("🧹 Đã dọn sạch Chợ Đen!");
    }
    if (command === 'hop' || command === 'check') {
    const target = message.mentions.users.first() || message.author;
    if (!db[target.id]) {
        db[target.id] = { money: 5000, hop: [], catchCount: 0 };
        saveDB();
    }

    const userData = db[target.id];
    if (!userData.hop || userData.hop.length === 0) {
        return message.reply(`❌ **${target.username}** chưa có Pokémon nào. Mau đi bắt đi ông!`);
    }

    const page = parseInt(args[0]) || 1;
    const itemsPerPage = 5; // Để 5 con 1 trang cho đẹp và thoáng
    const totalPages = Math.ceil(userData.hop.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const currentItems = userData.hop.slice(start, start + itemsPerPage);

    if (currentItems.length === 0) return message.reply(`Trang này trống rỗng!`);

    const pokemonList = currentItems.map((p, i) => {
        // Thanh Level đẹp mắt
        const progress = Math.floor((p.level / 100) * 10);
        const bar = "▶️" + "▬".repeat(progress) + "🔘" + "▬".repeat(10 - progress);
        const shinyTag = p.shiny ? "✨ **[SHINY]** " : "🐾 ";
        
        return `${shinyTag}**${p.name.toUpperCase()}** (ID: \`#${start + i + 1}\`)\n\`LV. ${p.level}\` ${bar}\n`;
    }).join("\n");

    const hopEmbed = new EmbedBuilder()
        .setAuthor({ name: `HỒ SƠ HUẤN LUYỆN VIÊN`, iconURL: target.displayAvatarURL() })
        .setTitle(`🎒 TÚI ĐỒ CỦA ${target.username.toUpperCase()}`)
        .setColor(target.id === message.author.id ? '#3498db' : '#e74c3c')
        .addFields(
            { name: '💳 Tài chính', value: `\`${userData.money.toLocaleString()} xu\``, inline: true },
            { name: '🏆 Kỷ lục', value: `\`${userData.catchCount} con\``, inline: true }
        )
        .setDescription(`--- **DANH SÁCH POKÉMON** ---\n\n${pokemonList}`)
        .setFooter({ text: `Trang ${page}/${totalPages} | Tổng: ${userData.hop.length} Pokémon` })
        .setTimestamp();

    return message.reply({ embeds: [hopEmbed] });
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
    message.delete().catch(() => {}); 

    if (!currentGlobalPokemon) return;

    const guess = args[0]?.toLowerCase();
    
    if (guess === currentGlobalPokemon.name) {
        if (!db[userId]) db[userId] = { money: 5000, hop: [], catchCount: 0 };

        const isShiny = currentGlobalPokemon.isShiny || false;
        
        // Lưu vào túi đồ với đầy đủ thuộc tính
        db[userId].hop.push({
            name: currentGlobalPokemon.name,
            level: currentGlobalPokemon.level,
            shiny: isShiny,
            catchDate: new Date().toLocaleDateString('vi-VN')
        });

        const reward = isShiny ? 1500 : 200; // Shiny thưởng đậm hơn
        db[userId].money += reward;
        db[userId].catchCount += 1;
        saveDB();

        const successEmbed = new EmbedBuilder()
            .setTitle(isShiny ? '🌟 SIÊU PHẨM SHINY! 🌟' : '✅ THU PHỤC THÀNH CÔNG!')
            .setColor(isShiny ? '#f1c40f' : '#2ecc71')
            .setDescription(`Chúc mừng **${message.author.username}** đã bắt được **${currentGlobalPokemon.name.toUpperCase()}**!`)
            .addFields(
                { name: '📊 Chỉ số', value: `\`Lvl ${currentGlobalPokemon.level}\` | \`${isShiny ? 'Hệ: Shiny ✨' : 'Hệ: Thường'}\``, inline: true },
                { name: '💰 Thưởng', value: `\`+${reward.toLocaleString()} xu\``, inline: true }
            )
            .setThumbnail(isShiny ? 'https://i.imgur.com/vHdfZfC.png' : null) // Thêm icon nhỏ nếu muốn
            .setFooter({ text: 'Check túi đồ bằng lệnh !hop' });

        const sMsg = await message.channel.send({ embeds: [successEmbed] });
        
        currentGlobalPokemon = null; 
        setTimeout(() => sMsg.delete().catch(() => {}), 10000); // 10s sau tự xóa cho sạch
    }
}
   // ================= [ LỆNH !BUYPKVIP - TỰ TẠO ROLE ] =================
    if (command === 'buypkvip' || command === 'vip') {
        const vipPrice = 100000; 
        const vipRoleName = "⭐ BẬC THẦY VIP"; // Tên Role tự động tạo

        if (!db[userId]) db[userId] = { money: 5000, hop: [], catchCount: 0 };

        // Hàm hỗ trợ tìm hoặc tạo Role
        const getOrCreateRole = async () => {
            let role = message.guild.roles.cache.find(r => r.name === vipRoleName);
            if (!role) {
                // Nếu không thấy thì Bot tự tạo Role mới
                role = await message.guild.roles.create({
                    name: vipRoleName,
                    color: '#f1c40f', // Màu vàng Gold
                    permissions: [],
                    reason: 'Hệ thống tự động tạo Role VIP cho người chơi',
                });
            }
            return role;
        };

        // --- TRƯỜNG HỢP 1: ADMIN TẶNG ROLE ---
        if (message.member.permissions.has("ManageMessages") && message.mentions.users.first()) {
            const targetMember = message.mentions.members.first();
            const role = await getOrCreateRole();

            await targetMember.roles.add(role);
            return message.channel.send(`🛡️ **Admin** đã đặc cách tạo và cấp Role **${vipRoleName}** cho <@${targetMember.id}>!`);
        }

        // --- TRƯỜNG HỢP 2: MEMBER TỰ MUA ---
        if (message.member.roles.cache.some(r => r.name === vipRoleName)) {
            return message.reply("👑 Ông đã sở hữu đặc quyền **VIP** rồi!");
        }

        if (db[userId].money < vipPrice) {
            return message.reply(`💸 Thiếu tiền! Giá VIP là \`${vipPrice.toLocaleString()} xu\`.`);
        }

        // Thực hiện trừ tiền và cấp Role
        const role = await getOrCreateRole();
        db[userId].money -= vipPrice;
        await message.member.roles.add(role);

        // Lưu dữ liệu
        fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));

        const vipEmbed = new EmbedBuilder()
            .setTitle('🌟 KÍCH HOẠT ĐẶC QUYỀN VIP 🌟')
            .setColor('#f1c40f')
            .setDescription(`Chúc mừng **${message.author.username}** đã trở thành **VIP**!`)
            .addFields(
                { name: '💰 Chi phí', value: `\`-${vipPrice.toLocaleString()} xu\``, inline: true },
                { name: '✨ Trạng thái', value: `\`Đã cấp Role tự động\``, inline: true }
            )
            .setFooter({ text: "Hệ thống đã tự động thiết lập quyền hạn VIP cho ông." })
            .setTimestamp();

        message.channel.send({ embeds: [vipEmbed] });
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
    if (command === 'addpk') {
    if (!message.member.permissions.has("ManageMessages")) return message.reply("Cút! Lệnh này chỉ dành cho Admin.");

    const target = message.mentions.users.first();
    const pokeInput = args[1]; 
    const level = parseInt(args[2]) || 5;
    const typeAttr = args[3]?.toLowerCase(); // Nhận 'shiny' hoặc 'thuong'

    if (!target || !pokeInput) return message.reply("Cú pháp: `!addpk @user [tên] [level] [shiny/thuong]`");

    try {
        const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokeInput.toLowerCase()}`);
        const isShiny = typeAttr === 'shiny';
        const realName = res.data.name;

        if (!db[target.id]) db[target.id] = { money: 5000, hop: [], catchCount: 0 };

        db[target.id].hop.push({
            name: realName,
            level: level,
            shiny: isShiny,
            type: res.data.types[0].type.name
        });
        saveDB();

        // Lấy ảnh đúng loại (Shiny hoặc Default)
        const pokeImg = isShiny 
            ? res.data.sprites.other['official-artwork'].front_shiny 
            : res.data.sprites.other['official-artwork'].front_default;

        const addEmbed = new EmbedBuilder()
            .setTitle('🎁 ĐẶC ÂN TỪ ADMIN')
            .setColor(isShiny ? '#f1c40f' : '#2ecc71')
            .setDescription(`Admin đã tặng **${isShiny ? '✨ SHINY ' : ''}${realName.toUpperCase()}** cho <@${target.id}>!`)
            .setThumbnail(pokeImg)
            .addFields(
                { name: '📊 Cấp độ', value: `\`Lvl ${level}\``, inline: true },
                { name: '🧬 Loại', value: `\`${isShiny ? 'Hàng hiếm (Shiny)' : 'Hàng thường'}\``, inline: true }
            );

        message.channel.send({ embeds: [addEmbed] });
    } catch (e) {
        message.reply("❌ Không tìm thấy Pokémon này! Kiểm tra lại tên xem ông.");
    }
}
    // ================= [ LỆNH !ADDXUVANG - CHỈ ADMIN ] =================
    if (command === 'addxuvang' || command === 'addxuvang312312312312') {
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
saveDB();
        message.reply(`🕊️ Ông đã thả **${name.toUpperCase()}** về tự nhiên và nhận được \`100 xu\`!`);
    }
  // ================= [ LỆNH !TRAIN - NÂNG CẤP MAX LVL 1000 & SHINY ] =================
    if (command === 'train') {
        const name = args[0]?.toLowerCase();
        if (!name) return message.reply("Chọn con nào để huấn luyện? (Ví dụ: `!train pikachu`) ");

        if (!db[userId] || !db[userId].hop) return message.reply("Ông chưa có dữ liệu, đi bắt Pokemon trước đi!");

        const idx = db[userId].hop.findIndex(p => p.name.toLowerCase() === name);
        if (idx === -1) return message.reply("Con này không có trong Hộp của ông!");

        const pokemon = db[userId].hop[idx];
        const currentLvl = pokemon.level;
        const isShiny = pokemon.shiny || false; // Kiểm tra xem có phải Shiny không

        // Nâng giới hạn lên Level 1000
        if (currentLvl >= 1000) return message.reply(`🔥 **${name.toUpperCase()}** đã đạt cấp tối thượng (Lvl 1000)!`);

        // Tính toán giá nâng cấp (Công thức điều chỉnh để không bị quá lạm phát ở lvl 1000)
        const baseCost = 500;
        const upgradeCost = baseCost + (currentLvl * 150); 

        if (db[userId].money < upgradeCost) {
            return message.reply(`💸 Không đủ tiền! Cần \`${upgradeCost.toLocaleString()} xu\` để huấn luyện cấp độ này.`);
        }

        // --- CẬP NHẬT DỮ LIỆU ---
        db[userId].money -= upgradeCost; 
        
        // Tăng level (Random từ 1-5 level cho nhanh đạt 1000)
        let lvGain = Math.floor(Math.random() * 5) + 1; 
        if (db[userId].hop[idx].level + lvGain > 1000) {
            db[userId].hop[idx].level = 1000;
        } else {
            db[userId].hop[idx].level += lvGain;
        }

        // Lưu vào file bằng hàm saveDB đã có sẵn trong code của ông
        saveDB(); 

        const trainEmbed = new EmbedBuilder()
            .setTitle(isShiny ? '✨ PHÒNG TẬP GYM SHINY ✨' : '⚔️ PHÒNG TẬP GYM POKÉMON')
            .setColor(isShiny ? '#f1c40f' : '#e67e22') // Màu vàng nếu là Shiny
            .setDescription(`Huấn luyện thành công **${isShiny ? '✨ ' : ''}${name.toUpperCase()}**!`)
            .addFields(
                { name: '📈 Cấp độ', value: `\`Lvl ${currentLvl}\` ➡️ \`Lvl ${db[userId].hop[idx].level}\``, inline: true },
                { name: '💰 Chi phí', value: `\`-${upgradeCost.toLocaleString()} xu\``, inline: true },
                { name: '⭐ Trạng thái', value: `\`${isShiny ? 'Shiny (X5 EXP)' : 'Thường'}\``, inline: true }
            )
            .setFooter({ text: `Ví tiền: ${db[userId].money.toLocaleString()} xu | Max Lvl: 1000` })
            .setTimestamp();

        message.channel.send({ embeds: [trainEmbed] });
    }
    if (command === 'daily') {
        // Lưu ý: Do dùng biến db trong RAM nên reset bot là có thể gõ lại được ngay
        db[userId].money += 1000;
        saveDB();
        message.reply("💰 Ông đã nhận được quà điểm danh: \`1,000 xu\`!");
    }
    if (command === 'ev') {
        const name = args[0]?.toLowerCase();
        const evolutionMap = {
            "pichu": "pikachu", "pikachu": "raichu",
            "bulbasaur": "ivysaur", "ivysaur": "venusaur",
            "charmander": "charmeleon", "charmeleon": "charizard",
            "squirtle": "wartortle", "wartortle": "blastoise",
            "caterpie": "metapod", "metapod": "butterfree",
            "weedle": "kakuna", "kakuna": "beedrill",
            "pidgey": "pidgeotto", "pidgeotto": "pidgeot",
            "rattata": "raticate", "spearow": "fearow",
            "ekans": "arbok", "sandshrew": "sandslash"
        };

        // 1. Kiểm tra túi đồ (Phải có db[userId] trước)
        if (!db[userId] || !db[userId].hop) return message.reply("Ông chưa có Pokémon nào!");

        const idx = db[userId].hop.findIndex(p => p.name.toLowerCase() === name);
        if (idx === -1) return message.reply(`❌ Con **${name?.toUpperCase() || "này"}** không có trong Hộp!`);

        const nextForm = evolutionMap[name];
        if (!nextForm) return message.reply("⚠️ Con này không thể tiến hóa hoặc chưa cập nhật chuỗi tiến hóa!");

        // 2. Kiểm tra Level
        if (db[userId].hop[idx].level < 30) {
            return message.reply(`🚫 Cần đạt \`Lvl 30\` mới tiến hóa được! (Hiện tại: Lvl ${db[userId].hop[idx].level})`);
        }

        // 3. THỰC HIỆN ĐỔI TÊN
        const oldName = name.toUpperCase();
        db[userId].hop[idx].name = nextForm;

        // 4. KHÔNG ĐƯỢC QUÊN DÒNG NÀY - LƯU VÀO FILE NGAY!
        saveDB(); 

        // 5. HIỆN THÔNG BÁO "IB"
        const evoEmbed = new EmbedBuilder()
            .setTitle('🧬 TIẾN HÓA THÀNH CÔNG!')
            .setColor('#9b59b6')
            .setDescription(`**${oldName}** của ông đã chuyển hóa thành **${nextForm.toUpperCase()}**!`)
            .setFooter({ text: "Dữ liệu đã được đồng bộ vào hệ thống." })
            .setTimestamp();

        return message.reply({ embeds: [evoEmbed] });
    }
});

client.login(process.env.TOKEN);
