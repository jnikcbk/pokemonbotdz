const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs'); // <--- PHẢI CÓ CÁI NÀY ĐỂ LƯU FILE

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});
const regions = [
    { name: "Kanto", champ: "Blue", cpoke: "Blastoise", elite: "Lance", epoke: "Dragonite", start: 10 },
    { name: "Johto", champ: "Red", cpoke: "Pikachu", elite: "Karen", epoke: "Umbreon", start: 110 },
    { name: "Hoenn", champ: "Steven", cpoke: "Metagross", elite: "Drake", epoke: "Salamence", start: 210 },
    { name: "Sinnoh", champ: "Cynthia", cpoke: "Garchomp", elite: "Lucian", epoke: "Alakazam", start: 310 },
    { name: "Unova", champ: "Iris", cpoke: "Haxorus", elite: "Shauntal", epoke: "Chandelure", start: 410 },
    { name: "Kalos", champ: "Diantha", cpoke: "Gardevoir", elite: "Malva", epoke: "Pyroar", start: 510 },
    { name: "Alola", champ: "Kukui", cpoke: "Incineroar", elite: "Hala", epoke: "Crabominable", start: 610 },
    { name: "Galar", champ: "Leon", cpoke: "Charizard", elite: "Raihan", epoke: "Duraludon", start: 710 },
    { name: "Paldea", champ: "Geeta", cpoke: "Glimmora", elite: "Hassel", epoke: "Baxcalibur", start: 810 }
];

const gymThemes = ["Đá", "Nước", "Điện", "Cỏ", "Độc", "Tâm Linh", "Lửa", "Đất", "Băng", "Rồng", "Thép", "Côn Trùng", "Ma", "Đấu Sĩ", "Bay", "Tiên", "Bóng Tối", "Thường"];
const gymData = [];

regions.forEach((reg) => {
    let themes = [...gymThemes].sort(() => 0.5 - Math.random());
    for (let i = 1; i <= 8; i++) {
        gymData.push({
            id: gymData.length + 1,
            region: reg.name,
            name: `Hội Quán ${themes[i-1]}`,
            leader: `Thủ Lĩnh ${reg.name} #${i}`,
            poke: "Eevee",
            lv: reg.start + (i * 10),
            reward: (reg.start + i * 10) * 150,
            type: "GYM"
        });
    }
    gymData.push({ id: gymData.length + 1, region: reg.name, name: `Điện Thờ Tứ Hoàng`, leader: `Elite ${reg.elite}`, poke: reg.epoke, lv: reg.start + 95, reward: (reg.start + 95) * 400, type: "ELITE" });
    gymData.push({ id: gymData.length + 1, region: reg.name, name: `Đấu Trường Vô Địch`, leader: `CHAMPION ${reg.champ}`, poke: reg.cpoke, lv: reg.start + 115, reward: (reg.start + 115) * 800, type: "CHAMP" });
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
    
    if (command === 'hop' || command === 'bag') {
        const userData = db[userId];
        if (!userData || !userData.hop || userData.hop.length === 0) {
            return message.reply("🎒 **Túi đồ trống rỗng!** Mau đi săn Pokémon đi sếp ơi!");
        }

        const pokemonList = userData.hop;

        // 1. EMBED TỔNG QUÁT (Thiết kế lại gọn gàng)
        const mainEmbed = new EmbedBuilder()
            .setAuthor({ name: `HÀNH TRANG CỦA ${message.author.username.toUpperCase()}`, iconURL: message.author.displayAvatarURL() })
            .setTitle('🎒 KHO POKÉMON CỦA BẠN')
            .setColor('#3498db')
            .setThumbnail('https://i.imgur.com/vHdfZfC.png')
            .setDescription(`💰 **Số dư:** \`${(userData.money || 0).toLocaleString()} xu\`\n🔥 **Tổng số:** \`${pokemonList.length}\` con\n\n**Danh sách 25 con đầu tiên:**`)
            .addFields({
                name: '📋 Danh sách:',
                value: pokemonList.slice(0, 25).map((p, i) => {
                    const icon = p.shiny ? '✨' : '🐾';
                    const catchDate = p.date || p.catchDate || new Date().toLocaleDateString('vi-VN');
                    return `\`${(i + 1).toString().padStart(2, '0')}.\` ${icon} **${p.name.toUpperCase()}** \`(Lvl ${p.level})\` 📅 \`${catchDate}\``;
                }).join('\n')
            })
            .setFooter({ text: "Sử dụng Menu bên dưới để xem chỉ số chiến đấu 👇" });

        // 2. MENU CHỌN (Thêm Icon cho đẹp)
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_pokemon')
            .setPlaceholder('🔍 Nhấn vào đây để xem chi tiết...')
            .addOptions(pokemonList.slice(0, 25).map((p, i) => ({
                label: `${i + 1}. ${p.name.toUpperCase()}`,
                description: `Cấp độ: ${p.level} | Ngày: ${p.date || p.catchDate || 'Mới'}`,
                value: i.toString(),
                emoji: p.shiny ? '✨' : '🐾'
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);
        const curMessage = await message.reply({ embeds: [mainEmbed], components: [row] });

        // 3. XỬ LÝ KHI NGƯỜI DÙNG BẤM CHỌN
        const collector = curMessage.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time: 60000 
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'select_pokemon') {
                const p = pokemonList[parseInt(i.values[0])];
                
                // --- CÔNG THỨC CHỈ SỐ CHI TIẾT ---
                const hp = 100 + (p.level * 10) + (p.shiny ? 50 : 0);
                const atk = 10 + (p.level * 5) + (p.shiny ? 20 : 0);
                const def = 8 + (p.level * 4);
                const spd = 12 + (p.level * 3);

                // Tạo thanh tiến trình giả cho đẹp (Stats Bar)
                const createBar = (val, max) => {
                    const length = 10;
                    const filled = Math.round((val / max) * length);
                    return "🟩".repeat(filled) + "⬜".repeat(length - filled);
                };

                const detailEmbed = new EmbedBuilder()
                    .setTitle(`${p.shiny ? '✨ SHINY' : '🐾'} ${p.name.toUpperCase()}`)
                    .setColor(p.shiny ? '#f1c40f' : '#2ecc71')
                    .setThumbnail(message.author.displayAvatarURL())
                    .addFields(
                        { name: '📊 THÔNG TIN', value: `🧬 **Cấp độ:** \`Lvl ${p.level}\`\n📅 **Ngày bắt:** \`${p.date || p.catchDate || 'Mới'}\`\n💎 **Loại:** \`${p.shiny ? 'Siêu hiếm' : 'Thường'}\``, inline: false },
                        { name: `❤️ Máu: ${hp}`, value: `\`${createBar(hp, 1500)}\``, inline: true },
                        { name: `⚔️ Tấn công: ${atk}`, value: `\`${createBar(atk, 800)}\``, inline: true },
                        { name: `🛡️ Phòng thủ: ${def}`, value: `\`${createBar(def, 600)}\``, inline: true },
                        { name: `⚡ Tốc độ: ${spd}`, value: `\`${createBar(spd, 500)}\``, inline: true }
                    )
                    .setImage(`https://img.pokemondb.net/artwork/large/${p.name.toLowerCase()}.jpg`) // Ảnh xịn hơn
                    .setFooter({ text: "Mẹo: Pokémon Shiny có chỉ số cao hơn hàng thường!" });

                await i.update({ embeds: [detailEmbed], components: [row] });
            }
        });

        collector.on('end', () => {
            curMessage.edit({ components: [] }).catch(() => {});
        });
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
  // ================= [ LỆNH !PHELP - TẤT CẢ LỆNH ] =================
    if (command === 'phelp' || command === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🎮 POKÉMON WORLD - DANH SÁCH LỆNH')
            .setColor('#3498db')
            .setThumbnail('https://i.imgur.com/vHdfZfC.png')
            .setDescription('Chào mừng HLV! Dưới đây là các lệnh đang hoạt động:')
            .addFields(
                { name: '🐾 SĂN BẮT & QUẢN LÝ', value: '`!bat [tên]`: Bắt Pokemon đang hiện.\n`!hop`: Xem túi đồ & Pokemon.\n`!phongsinh [tên]`: Thả Pokemon nhận 100 xu.' },
                { name: '⚔️ CHIẾN ĐẤU & PHÁT TRIỂN', value: '`!dau @user [tên]`: Thách đấu người khác.\n`!train [tên]`: Tăng Level (Max 1000).\n`!ev [tên]`: Tiến hóa (Lv 30+).', inline: false },
                { name: '💰 KINH TẾ', value: '`!daily`: Nhận trợ cấp hàng ngày.\n`!choden`: Xem chợ.\n`!mua [mã]`: Mua hàng.\n`!trade @user [tên_mình] [tên_họ]`: Trao đổi.', inline: false },
                { name: '📊 THỐNG KÊ', value: '`!pkshiny`: Bảng vàng Shiny.\n`!toppk`: BXH đại gia.\n`!pokedex`: Tra cứu danh sách.', inline: true },
                { name: '🛠️ ADMIN', value: '`!pkauto`: Bật máy dò.\n`!addpk`, `!addxuvang`, `!adclear`.', inline: true }
            )
            .setFooter({ text: `HLV: ${message.author.username}` })
            .setTimestamp();
        return message.reply({ embeds: [helpEmbed] });
    }
// ================= [ LỆNH PKAUTO - PHIÊN BẢN GỌN SẠCH ] =================
    if (command === 'pkauto') {
        if (!message.member.permissions.has("ManageMessages")) return message.reply("❌ ai hỏi mày à bảo thg admin bật cho ngu vl.");

        if (pkAuto) {
            clearInterval(pkAuto);
            pkAuto = null;
            return message.reply("🛑 **Hệ thống dò Pokémon đã TẮT.**");
        }

        const spawnChannel = message.channel;
        message.reply(`🚀 **KHỞI ĐỘNG MÁY DÒ SIÊU TỐC!** Pokémon sẽ xuất hiện mỗi 20 giây tại <#${spawnChannel.id}>.`);

        pkAuto = setInterval(async () => {
            // 1. DỌN DẸP: Xóa tin nhắn cũ ngay lập tức khi con mới xuất hiện
            if (currentGlobalPokemon && currentGlobalPokemon.message) {
                currentGlobalPokemon.message.delete().catch(() => {});
            }

            // 2. RANDOM THÔNG SỐ (Tăng tỉ lệ thú vị)
            const randomId = Math.floor(Math.random() * 898) + 1;
            const randomLevel = Math.floor(Math.random() * 100) + 1; // Cho max Lv 100 cho nó máu
            const isShiny = Math.random() < 1/80; // Tỉ lệ 1/80 để Shiny có giá trị hơn

            try {
                const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
                const pokeName = res.data.name;
                
                // Lấy ảnh Artwork (Nếu lỗi lấy ảnh thường)
                let spriteUrl = isShiny 
                    ? res.data.sprites.other['official-artwork'].front_shiny 
                    : res.data.sprites.other['official-artwork'].front_default;
                if (!spriteUrl) spriteUrl = res.data.sprites.front_default;

                // 3. THIẾT KẾ EMBED GỌN GÀNG (Không rác)
                const autoEmbed = new EmbedBuilder()
                    .setColor(isShiny ? '#f1c40f' : '#2ecc71')
                    .setTitle(`${isShiny ? '✨ SHINY' : '🐾'} POKÉMON HOANG DÃ`)
                    .setDescription(`Một con **${pokeName.toUpperCase()}** vừa xuất hiện!\n\n` + 
                                  `📊 **Cấp độ:** \`Lvl ${randomLevel}\`\n` +
                                  `🧬 **Hệ:** \`${res.data.types.map(t => t.type.name).join(", ").toUpperCase()}\`\n` +
                                  `━━━ Đang chờ thu phục ━━━`)
                    .setImage(spriteUrl)
                    .setThumbnail(isShiny ? 'https://i.imgur.com/vHdfZfC.png' : null)
                    .setFooter({ text: "Gõ !bat [tên] nhanh kẻo nó chạy mất!" })
                    .setTimestamp();

                // 4. GỬI TIN NHẮN (Dùng ping đúng lúc)
                const content = isShiny ? "⚠️ **HÀNG HIẾM @here!** ⚠️" : null;
                const sMsg = await spawnChannel.send({ content: content, embeds: [autoEmbed] });

                // 5. LƯU DỮ LIỆU
                currentGlobalPokemon = { 
                    name: pokeName.toLowerCase(), 
                    level: randomLevel, 
                    isShiny: isShiny,
                    message: sMsg 
                };

            } catch (error) {
                console.log("Lỗi máy dò: " + error.message);
            }
        }, 20000); // 20 Giây
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
        const level = currentGlobalPokemon.level;

        // --- HỆ THỐNG TÍNH CHỈ SỐ ĐỂ HIỂN THỊ NGAY ---
        const hp = 100 + (level * 10) + (isShiny ? 50 : 0);
        const dame = 10 + (level * 5) + (isShiny ? 20 : 0);
        const catchDate = new Date().toLocaleDateString('vi-VN');

        // Lưu vào túi đồ (đổi key thành 'date' cho khớp với lệnh !hop ở trên)
        db[userId].hop.push({
            name: currentGlobalPokemon.name,
            level: level,
            shiny: isShiny,
            date: catchDate,
            hp: hp,     // Lưu luôn chỉ số vào túi cho chắc
            dame: dame
        });

        const reward = isShiny ? 1500 : 200; 
        db[userId].money += reward;
        db[userId].catchCount += 1;
        saveDB();

        // Tạo Embed thông báo siêu chi tiết
        const successEmbed = new EmbedBuilder()
            .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
            .setTitle(isShiny ? '🌟 SIÊU PHẨM SHINY XUẤT HIỆN! 🌟' : '✅ THU PHỤC THÀNH CÔNG!')
            .setColor(isShiny ? '#f1c40f' : '#2ecc71')
            .setDescription(`Ông vừa ném Pokéball và bắt gọn **${currentGlobalPokemon.name.toUpperCase()}**!`)
            .addFields(
                { name: '📋 Thông tin sơ bộ', value: `🧬 **Phẩm chất:** ${isShiny ? '`Shiny ✨`' : '`Thường 🐾`'}\n📊 **Cấp độ:** \`Lvl ${level}\`\n📅 **Ngày bắt:** \`${catchDate}\``, inline: false },
                { name: '⚔️ Chỉ số cơ bản', value: `❤️ **HP:** \`${hp}\`\n⚔️ **ATK:** \`${dame}\``, inline: true },
                { name: '💰 Phần thưởng', value: `🪙 **Xu:** \`+${reward.toLocaleString()}\`\n📈 **Tổng bắt:** \`${db[userId].catchCount}\` con`, inline: true }
            )
            .setImage(isShiny ? 'https://i.imgur.com/vHdfZfC.png' : null) // Có thể thay bằng link ảnh hiệu ứng nổ pháo hoa
            .setFooter({ text: 'Dùng lệnh !hop hoặc !bag để xem chi tiết sức mạnh!' })
            .setTimestamp();

        const sMsg = await message.channel.send({ content: `<@${message.author.id}>`, embeds: [successEmbed] });
        
        currentGlobalPokemon = null; 
        // 15 giây sau tự xóa tin nhắn cho kênh chat nó sạch sẽ
        setTimeout(() => sMsg.delete().catch(() => {}), 15000); 
    }
}
   // ================= [ LỆNH VIP CAO CẤP ] =================
    if (command === 'buypkvip' || command === 'vip') {
        const vipPrice = 100000; 
        const vipRoleName = "⭐ BẬC THẦY VIP";

        if (!db[userId]) db[userId] = { money: 5000, hop: [], catchCount: 0, isVip: false };

        // 1. Kiểm tra nếu đã là VIP (Tránh mua trùng)
        if (message.member.roles.cache.some(r => r.name === vipRoleName)) {
            return message.reply("👑 **Ông đã là VIP rồi!** Đừng vung tiền qua cửa sổ thế chứ.");
        }

        // 2. Kiểm tra ví tiền
        if (db[userId].money < vipPrice) {
            const thieu = vipPrice - db[userId].money;
            return message.reply(`💸 **Nghèo quá sếp ơi!** Còn thiếu \`${thieu.toLocaleString()} xu\` nữa mới đủ mua con Role này.`);
        }

        // 3. Xử lý tạo/cấp Role và tặng quà VIP
        try {
            let role = message.guild.roles.cache.find(r => r.name === vipRoleName);
            if (!role) {
                role = await message.guild.roles.create({
                    name: vipRoleName,
                    color: '#f1c40f',
                    hoist: true, // Cho Role này hiện tách biệt trên danh sách thành viên
                    reason: 'Hệ thống tự động tạo Role VIP'
                });
            }

            // TRỪ TIỀN & CẬP NHẬT TRẠNG THÁI VIP TRONG DB
            db[userId].money -= vipPrice;
            db[userId].isVip = true; 
            
            // TẶNG QUÀ KÈM THEO: Tặng thêm 1 con Pokemon ngẫu nhiên Level cao khi mua VIP
            const quaTang = { name: "Mewtwo", level: 50, shiny: false, date: new Date().toLocaleDateString('vi-VN') };
            db[userId].hop.push(quaTang);
            
            await message.member.roles.add(role);
            saveDB();

            // EMBED CỰC ĐẸP
            const vipEmbed = new EmbedBuilder()
                .setAuthor({ name: 'HỆ THỐNG ĐẶC QUYỀN', iconURL: 'https://i.imgur.com/vHdfZfC.png' })
                .setTitle('🌟 KÍCH HOẠT QUYỀN NĂNG VIP 🌟')
                .setColor('#f1c40f')
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Chào mừng tân **VIP** <@${userId}>! Ông đã chính thức gia nhập hàng ngũ đại gia của Server.`)
                .addFields(
                    { name: '💳 Giao dịch', value: `\`-${vipPrice.toLocaleString()} xu\``, inline: true },
                    { name: '🎁 Quà tặng VIP', value: `\`1x ${quaTang.name}\` (Lvl ${quaTang.level})`, inline: true },
                    { name: '🔥 Đặc quyền', value: `• Tên màu vàng nổi bật\n• Được "ping" khi có Pokemon hiếm\n• Tăng 5% tỉ lệ gặp Shiny`, inline: false }
                )
                .setImage('https://i.imgur.com/89kRstk.gif') // Thêm cái gif pháo hoa cho sang
                .setFooter({ text: 'VIP là vĩnh viễn, không cần nạp lại!' })
                .setTimestamp();

            message.channel.send({ content: `🎊 Chúc mừng tân VIP: <@${userId}>`, embeds: [vipEmbed] });

        } catch (error) {
            console.error(error);
            message.reply("❌ **Lỗi:** Bot không có quyền quản lý Role. Hãy kéo Role của Bot lên trên cùng trong cài đặt Server!");
        }
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
    // ================= [ LỆNH !HOIQUAN - 9 GEN x 10 BẬC ] =================
    if (command === 'hoiquan' || command === 'gym') {
        const userData = db[userId];
        const arg1 = args[0]; 
        const myPokeName = args.slice(1).join(" ").toLowerCase();

        // 1. HIỂN THỊ DANH SÁCH THEO GEN (Ví dụ: !hoiquan 1)
        if (!arg1 || (parseInt(arg1) <= 9 && !myPokeName)) {
            const genIdx = (parseInt(arg1) || 1) - 1;
            const region = regions[genIdx];
            const currentGyms = gymData.slice(genIdx * 10, genIdx * 10 + 10);

            const listEmbed = new EmbedBuilder()
                .setTitle(`🗺️ LỘ TRÌNH CHINH PHỤC VÙNG ${region.name.toUpperCase()}`)
                .setColor('#f1c40f')
                .setThumbnail('https://i.imgur.com/G9L6RGo.gif')
                .setDescription(`Mỗi vùng có 10 thử thách từ yếu đến mạnh.\nĐánh bại **Champion** để nhận thưởng lớn!\n\n**Cú pháp đánh:** \`!hoiquan [ID] [Tên_Pokemon_Của_Ông]\``)
                .addFields({
                    name: `Danh sách bậc thềm sức mạnh (Gen ${genIdx + 1}):`,
                    value: currentGyms.map(g => {
                        let icon = g.type === 'CHAMP' ? '👑' : (g.type === 'ELITE' ? '🔥' : '🛡️');
                        return `\`ID: ${g.id.toString().padStart(2, '0')}\` ${icon} **${g.name}** - Lv.${g.lv}`;
                    }).join('\n')
                })
                .setFooter({ text: `Xem vùng khác: !hoiquan [1-9] | Ví dụ: !hoiquan 2` });

            return message.reply({ embeds: [listEmbed] });
        }

        // 2. LOGIC CHIẾN ĐẤU (Ví dụ: !hoiquan 1 pikachu)
        const gymId = parseInt(arg1);
        const target = gymData.find(g => g.id === gymId);
        
        if (!target) return message.reply("❌ ID Hội Quán không tồn tại! Gõ `!hoiquan` để xem danh sách.");
        if (!myPokeName) return message.reply(`📝 Ông định dùng con nào? Cú pháp: \`!hoiquan ${gymId} [tên_pokemon]\``);

        const myIdx = userData.hop.findIndex(p => p.name.toLowerCase() === myPokeName);
        if (myIdx === -1) return message.reply(`❌ Ông không sở hữu con **${myPokeName.toUpperCase()}** nào trong túi!`);

        const myPoke = userData.hop[myIdx];
        
        // Tính toán lực chiến (Lv + Random + Bonus Shiny)
        const myPower = myPoke.level + Math.floor(Math.random() * 30) + (myPoke.shiny ? 40 : 0);
        const enemyPower = target.lv + Math.floor(Math.random() * 20);

        const battleEmbed = new EmbedBuilder()
            .setTitle(`${target.type === 'CHAMP' ? '🏆 TRẬN CHIẾN CUỐI CÙNG' : '⚔️ THÁCH ĐẤU HỘI QUÁN'}`)
            .setDescription(`**${message.author.username}** đối đầu với **${target.leader}**!`)
            .addFields(
                { name: `🔵 BẠN: ${myPoke.name.toUpperCase()}`, value: `💪 Lực chiến: \`${myPower}\``, inline: true },
                { name: 'VS', value: '⚡', inline: true },
                { name: `🔴 ĐỐI THỦ: ${target.leader}`, value: `💪 Lực chiến: \`${enemyPower}\``, inline: true }
            )
            .setThumbnail(`https://img.pokemondb.net/artwork/large/${target.poke.toLowerCase()}.jpg`)
            .setTimestamp();

        if (myPower >= enemyPower) {
            // Thắng
            userData.money += target.reward;
            saveDB();

            battleEmbed.setColor('#2ecc71').addFields({ 
                name: '🏆 KẾT QUẢ: THẮNG LỢI!', 
                value: `Ông đã vượt qua **${target.name}**!\n💰 Tiền thưởng: \`+${target.reward.toLocaleString()} xu\`` 
            });
        } else {
            // Thua
            battleEmbed.setColor('#e74c3c').addFields({ 
                name: '💀 KẾT QUẢ: THẤT BẠI!', 
                value: `Sức mạnh của **${target.poke}** quá lớn. Hãy dùng lệnh \`!train\` để mạnh hơn!` 
            });
        }

        return message.reply({ embeds: [battleEmbed] });
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
    // ================= [ LỆNH !DAILY - NHẬN TIỀN HÀNG NGÀY ] =================
    if (command === 'daily') {
        // Khởi tạo dữ liệu nếu người dùng mới hoàn toàn
        if (!db[userId]) {
            db[userId] = { money: 0, hop: [], lastDaily: 0 };
        }
        
        const cooldown = 24 * 60 * 60 * 1000; // 24 giờ tính bằng miligiây
        const lastDaily = db[userId].lastDaily || 0;
        const now = Date.now();

        // Kiểm tra xem đã đủ 24h chưa
        if (now - lastDaily < cooldown) {
            const remaining = cooldown - (now - lastDaily);
            const hours = Math.floor(remaining / (60 * 60 * 1000));
            const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
            
            return message.reply(`⏳ Ông đã nhận quà hôm nay rồi! Hãy quay lại sau **${hours} giờ ${minutes} phút** nữa nhé.`);
        }

        // Ngẫu nhiên số tiền nhận được từ 1,000 đến 5,000 xu
        const gift = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
        
        // Cập nhật tiền và thời gian nhận
        db[userId].money = (db[userId].money || 0) + gift;
        db[userId].lastDaily = now;
        
        // Lưu vào file db.json
        saveDB(); 

        const dailyEmbed = new EmbedBuilder()
            .setTitle('🎁 QUÀ TẶNG HÀNG NGÀY')
            .setColor('#f1c40f')
            .setDescription(`Chúc mừng **${message.author.username}**!\nÔng đã nhận được **${gift.toLocaleString()} xu** trợ cấp.`)
            .addFields({ name: '💰 Số dư hiện tại', value: `\`${db[userId].money.toLocaleString()} xu\`` })
            .setFooter({ text: 'mày tính buff à t fix  nhé nhất thg @nguyenhuykz' })
            .setTimestamp();

        return message.reply({ embeds: [dailyEmbed] });
    }
    // ================= [ LỆNH !EV - CÓ NÚT BẤM ĐÃ FIX LỖI ] =================
    if (command === 'ev') {
        const nameInput = args[0]?.toLowerCase();
        const evolutionMap = {
            "pichu": "pikachu", "pikachu": "raichu",
            "bulbasaur": "ivysaur", "ivysaur": "venusaur",
            "charmander": "charmeleon", "charmeleon": "charizard",
            "squirtle": "wartortle", "wartortle": "blastoise",
            "magikarp": "gyarados", "gastly": "haunter", "haunter": "gengar"
        };

        if (!db[userId] || !db[userId].hop) return message.reply("❌ Ông chưa có Pokemon nào!");

        const idx = db[userId].hop.findIndex(p => p.name.toLowerCase() === nameInput);
        if (idx === -1) return message.reply(`❌ Không tìm thấy **${nameInput?.toUpperCase()}** trong hộp!`);

        const pokemon = db[userId].hop[idx];
        const nextForm = evolutionMap[pokemon.name.toLowerCase()];

        if (!nextForm) return message.reply("⚠️ Con này không thể tiến hóa thêm!");
        if (pokemon.level < 30) return message.reply(`🚫 Cần Level 30! (Hiện tại: ${pokemon.level})`);

        // Tạo nút bấm
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_ev')
                    .setLabel('TIẾN HÓA NGAY')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cancel_ev')
                    .setLabel('HỦY BỎ')
                    .setStyle(ButtonStyle.Danger),
            );

        const askEmbed = new EmbedBuilder()
            .setTitle('🧬 XÁC NHẬN TIẾN HÓA')
            .setColor('#f1c40f')
            .setDescription(`Ông có chắc muốn cho **${pokemon.name.toUpperCase()}** tiến hóa thành **${nextForm.toUpperCase()}** không?`);

        const response = await message.reply({ embeds: [askEmbed], components: [row] });

        // Bộ lọc xử lý: Chỉ người gõ lệnh mới được bấm
        const collectorFilter = i => i.user.id === message.author.id;

        try {
            // Đợi bấm nút trong 30 giây
            const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 30000 });

            if (confirmation.customId === 'confirm_ev') {
                const oldName = pokemon.name.toUpperCase();
                pokemon.name = nextForm; // Đổi tên trong dữ liệu
                saveDB(); // Lưu vào file db.json

                const successEmbed = new EmbedBuilder()
                    .setTitle('✨ TIẾN HÓA THÀNH CÔNG!')
                    .setColor('#2ecc71')
                    .setDescription(`**${oldName}** đã biến thành **${nextForm.toUpperCase()}**!`);

                // Cập nhật tin nhắn để xóa nút bấm đi
                await confirmation.update({ embeds: [successEmbed], components: [] });
            } else {
                await confirmation.update({ content: '❌ Đã hủy bỏ quá trình.', embeds: [], components: [] });
            }
        } catch (e) {
            // Hết 30s không bấm thì tự xóa nút
            await response.edit({ content: '⌛ Hết thời gian xác nhận.', embeds: [], components: [] });
        }
    }
});

client.login(process.env.TOKEN);
