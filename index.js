const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const User = require('./database'); // File chứa Schema MongoDB ở bước trước

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Biến tạm để lưu con Pokemon đang xuất hiện trong server
let currentPokemon = null; 

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 1. Lệnh ADM/Hệ thống gọi Pokemon ra (Hoặc dùng setInterval để tự ra)
    if (command === '!spawn') {
        const randomId = Math.floor(Math.random() * 898) + 1;
        const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        
        currentPokemon = {
            name: res.data.name.toLowerCase(),
            image: res.data.sprites.other['official-artwork'].front_default
        };

        const embed = new EmbedBuilder()
            .setTitle("野生のポケモンが現れた！ (Một Pokemon hoang dã xuất hiện!)")
            .setDescription("Gõ **!batpokemon [tên]** để bắt nó!")
            .setImage(currentPokemon.image)
            .setColor(0x00AE86);

        message.channel.send({ embeds: [embed] });
        console.log(`Pokemon hiện tại là: ${currentPokemon.name}`); // Xem lén trong log
    }

    // 2. Lệnh !batpokemon [tên]
    if (command === '!batpokemon') {
        if (!currentPokemon) return message.reply("Làm gì có con nào ở đây mà bắt cha nội!");

        const guestName = args[0]?.toLowerCase();
        if (!guestName) return message.reply("Thiếu tên Pokemon rồi!");

        if (guestName === currentPokemon.name) {
            // Lưu vào Database
            let userData = await User.findOne({ userId: message.author.id });
            if (!userData) userData = new User({ userId: message.author.id, pokemons: [] });

            userData.pokemons.push({ 
                name: currentPokemon.name,
                catchDate: new Date() 
            });
            await userData.save();

            message.reply(`🎯 **${message.author.username}** đã đoán đúng! Chúc mừng ông đã bắt được **${currentPokemon.name.toUpperCase()}**!`);
            
            // Bắt xong thì xóa con hiện tại đi
            currentPokemon = null; 
        } else {
            message.reply("Sai tên rồi, nhìn kỹ lại cái hình xem!");
        }
    }
});

client.login(process.env.TOKEN);
