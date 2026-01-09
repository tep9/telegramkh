require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// ជំនួសដោយ token ពី @BotFather
const token = process.env.BOT_TOKEN || '8314923099:AAFzoRSeX46YB8XI2GMQnCbnaFFbXHaAhcU';
const ADMIN_ID = process.env.ADMIN_ID || 'YOUR_ADMIN_TELEGRAM_ID_HERE';
const DEVELOPER = '@tephh';
const SCHOOL = 'វិទ្យាស្ថានន័រតុន';
const CLASS = 'ថ្នាក់ M3 វិស្វកម្មស៊ីវិល';

// បង្កើត Bot
const bot = new TelegramBot(token, { polling: true });

// ទុកទិន្នន័យអ្នកប្រើប្រាស់
const userStates = new Map();
const pendingRequests = new Map();

// ស្ថានភាពអ្នកប្រើប្រាស់
const STATE = {
    IDLE: 'idle',
    ASKING_BUSY: 'asking_busy',
    COLLECTING_INFO: 'collecting_info',
    WAITING_RESPONSE: 'waiting_response'
};

// រចនាសម្ព័ន្ធទិន្នន័យ
const userData = {};

console.log(`🤖 Bot ដំណើរការសម្រាប់ ${CLASS}, ${SCHOOL}`);
console.log(`👨‍💻 អ្នកអភិវឌ្ឍន៍: ${DEVELOPER}`);

// ពាក្យបញ្ជា /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'និស្សិត';
    
    userStates.set(chatId, STATE.ASKING_BUSY);
    userData[chatId] = { step: 0, answers: {} };
    
    const welcomeMessage = `👋 ជំរាបសួរ ${userName}!\n\n` +
                          `សូមស្វាគមន៍មកកាន់ Bot គ្រប់គ្រងវត្តមាន\n` +
                          `🏫 ${CLASS}\n` +
                          `📚 ${SCHOOL}\n\n` +
                          `*តើអ្នករវល់/ឈឺថ្ងៃនេះឬទេ?*`;
    
    const options = {
        reply_markup: {
            keyboard: [
                [{ text: '✅ បាទ/ចាស ខ្ញុំរវល់/ឈឺ' }, { text: '❌ ទេ ខ្ញុំទំនេរ' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        },
        parse_mode: 'Markdown'
    };
    
    bot.sendMessage(chatId, welcomeMessage, options);
});

// ត្រួតពិនិត្យការចុចប៊ូតុង និងសារ
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const state = userStates.get(chatId) || STATE.IDLE;
    
    // រំលងប្រសិនបើជាពាក្យបញ្ជា
    if (text.startsWith('/')) return;
    
    switch(state) {
        case STATE.ASKING_BUSY:
            handleBusyResponse(chatId, text, msg.from);
            break;
        case STATE.COLLECTING_INFO:
            handleInfoCollection(chatId, text, msg.from);
            break;
    }
});

function handleBusyResponse(chatId, text, user) {
    if (text.includes('ទេ') || text.includes('❌') || text.includes('ទំនេរ')) {
        userStates.set(chatId, STATE.IDLE);
        
        const response = `✅ ល្អណាស់! អ្នកទំនេរថ្ងៃនេះ។\n\n` +
                        `*ប្រសិនបើអ្នករវល់ឬឈឺនៅពេលក្រោយ:*\n` +
                        `គ្រាន់តែវាយ /start ម្តងទៀតដើម្បីរាយការណ៍។\n\n` +
                        `🏫 ${CLASS}\n` +
                        `📚 ${SCHOOL}\n` +
                        `👨‍💻 អ្នកអភិវឌ្ឍន៍: ${DEVELOPER}`;
        
        bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } 
    else if (text.includes('បាទ') || text.includes('ចាស') || text.includes('✅') || text.includes('រវល់') || text.includes('ឈឺ')) {
        userStates.set(chatId, STATE.COLLECTING_INFO);
        userData[chatId] = {
            step: 1,
            answers: {},
            userInfo: {
                name: user.first_name + (user.last_name ? ' ' + user.last_name : ''),
                username: user.username ? `@${user.username}` : 'គ្មានឈ្មោះប្រើ'
            }
        };
        
        bot.sendMessage(chatId, "📝 សូមបញ្ចូល *ឈ្មោះពេញ* របស់អ្នក:", { 
            parse_mode: 'Markdown',
            reply_markup: { remove_keyboard: true }
        });
    }
}

function handleInfoCollection(chatId, text, user) {
    const data = userData[chatId];
    
    if (!data) {
        userStates.set(chatId, STATE.IDLE);
        return bot.sendMessage(chatId, "⚠️ សេស្ហិនបានផុតកំណត់។ សូមវាយ /start ម្តងទៀត។");
    }
    
    switch(data.step) {
        case 1: // ឈ្មោះពេញ
            data.answers.fullName = text;
            data.step = 2;
            bot.sendMessage(chatId, "📝 សូមបញ្ចូល *លេខសិស្ស* (បើមាន):", { 
                parse_mode: 'Markdown' 
            });
            break;
            
        case 2: // លេខសិស្ស (ស្រេចចិត្ត)
            data.answers.studentId = text;
            data.step = 3;
            bot.sendMessage(chatId, "🤒 *មូលហេតុ* អវត្តមានរបស់អ្នក?\n(ឧទាហរណ៍៖ ឈឺ, បញ្ហាគ្រួសារ, កិច្ចការផ្ទាល់ខ្លួន):", { 
                parse_mode: 'Markdown' 
            });
            break;
            
        case 3: // មូលហេតុ
            data.answers.reason = text;
            data.step = 4;
            bot.sendMessage(chatId, "⏰ អ្នកនឹងអវត្តមានរយៈពេលប៉ុន្មាន?\n(ឧទាហរណ៍៖ ១ថ្ងៃ, ២ថ្ងៃ, សប្តាហ៍នេះ):", { 
                parse_mode: 'Markdown' 
            });
            break;
            
        case 4: // រយៈពេល
            data.answers.duration = text;
            data.step = 5;
            bot.sendMessage(chatId, "📱 សូមបញ្ចូល *លេខទូរស័ព្ទ* របស់អ្នក:", { 
                parse_mode: 'Markdown' 
            });
            break;
            
        case 5: // លេខទូរស័ព្ទ
            data.answers.phone = text;
            data.step = 6;
            
            // សួរចំណាំបន្ថែម
            bot.sendMessage(chatId, "💬 ចំណាំឬយោបល់បន្ថែម?\n(វាយ 'skip' ប្រសិនបើគ្មាន):", { 
                parse_mode: 'Markdown' 
            });
            break;
            
        case 6: // ចំណាំបន្ថែម
            if (text.toLowerCase() !== 'skip') {
                data.answers.notes = text;
            }
            
            // បំពេញបែបបទ
            completeForm(chatId, data);
            break;
    }
}

function completeForm(chatId, data) {
    userStates.set(chatId, STATE.WAITING_RESPONSE);
    
    // បង្កើតសារសម្រាប់អ្នកគ្រប់គ្រង
    const requestId = Date.now();
    const requestMessage = `📋 *សំណើអវត្តមានថ្មី*\n\n` +
                          `👤 *សិស្ស:* ${data.answers.fullName}\n` +
                          `📝 *ឈ្មោះ Telegram:* ${data.userInfo.name}\n` +
                          `👤 *ឈ្មោះប្រើ:* ${data.userInfo.username}\n` +
                          `🎓 *លេខសិស្ស:* ${data.answers.studentId || 'មិនបានផ្តល់'}\n` +
                          `📞 *ទូរស័ព្ទ:* ${data.answers.phone}\n\n` +
                          `🤒 *មូលហេតុ:* ${data.answers.reason}\n` +
                          `⏰ *រយៈពេល:* ${data.answers.duration}\n` +
                          `💬 *ចំណាំ:* ${data.answers.notes || 'គ្មានចំណាំបន្ថែម'}\n\n` +
                          `🏫 *ថ្នាក់:* ${CLASS}\n` +
                          `📚 *សាលា:* ${SCHOOL}\n` +
                          `🆔 *លេខសំណើ:* ${requestId}`;
    
    // ទុកសំណើដែលកំពុងរង់ចាំ
    pendingRequests.set(requestId, {
        chatId,
        studentName: data.answers.fullName,
        data: data.answers
    });
    
    // ផ្ញើការបញ្ជាក់ទៅសិស្ស
    bot.sendMessage(chatId, 
        `✅ *សំណើត្រូវបានដាក់ស្នើ!*\n\n` +
        `សំណើអវត្តមានរបស់អ្នកត្រូវបានផ្ញើទៅអ្នកគ្រប់គ្រង។\n` +
        `🆔 លេខសំណើ: *${requestId}*\n\n` +
        `អ្នកនឹងទទួលបានការជូនដំណឹងនៅពេលដែលត្រូវបានអនុម័តឬបដិសេធ។\n\n` +
        `📞 *ព័ត៌មានទំនាក់ទំនងអ្នកគ្រប់គ្រង:*\n` +
        `អ្នកអាចទាក់ទងអ្នកគ្រប់គ្រងដោយផ្ទាល់ប្រសិនបើជាការបន្ទាន់។\n\n` +
        `វាយ /start ដើម្បីធ្វើសំណើមួយទៀត។`,
        { parse_mode: 'Markdown' }
    );
    
    // ផ្ញើទៅអ្នកគ្រប់គ្រងជាមួយប៊ូតុង
    const adminOptions = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ អនុម័ត', callback_data: `approve_${requestId}` },
                    { text: '❌ បដិសេធ', callback_data: `reject_${requestId}` }
                ],
                [
                    { text: '📞 ទាក់ទងសិស្ស', 
                      url: `https://t.me/${data.userInfo.username.replace('@', '')}` 
                    }
                ]
            ]
        },
        parse_mode: 'Markdown'
    };
    
    bot.sendMessage(ADMIN_ID, requestMessage, adminOptions)
        .catch(err => {
            console.error('មិនអាចផ្ញើសារទៅអ្នកគ្រប់គ្រង:', err);
        });
}

// ការឆ្លើយតបទៅការចុច callback (ប៊ូតុង inline)
bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const requestId = data.split('_')[1];
    
    const request = pendingRequests.get(parseInt(requestId));
    
    if (!request) {
        return bot.answerCallbackQuery(callbackQuery.id, {
            text: 'សំណើនេះបានផុតកំណត់ហើយ។',
            show_alert: true
        });
    }
    
    if (data.startsWith('approve_')) {
        // អនុម័តសំណើ
        pendingRequests.delete(parseInt(requestId));
        
        // ផ្ញើការជូនដំណឹងទៅសិស្ស
        bot.sendMessage(request.chatId,
            `🎉 *សំណើអវត្តមានរបស់អ្នកត្រូវបានអនុម័ត!*\n\n` +
            `អ្នកគ្រប់គ្រងបានអនុម័តសំណើអវត្តមានរបស់អ្នក។\n` +
            `🆔 លេខសំណើ: ${requestId}\n\n` +
            `សូមធ្វើការព្យាបាលឲ្យបានលឿន និងសូមអរគុណសម្រាប់ការជូនដំណឹង។`,
            { parse_mode: 'Markdown' }
        );
        
        // ធ្វើបច្ចុប្បន្នភាពសារអ្នកគ្រប់គ្រង
        bot.editMessageText(`✅ *សំណើត្រូវបានអនុម័ត*\n\n` +
                          `សិស្ស: ${request.studentName}\n` +
                          `លេខសំណើ: ${requestId}\n\n` +
                          `បានអនុម័តដោយ: ${callbackQuery.from.first_name}`,
            {
                chat_id: message.chat.id,
                message_id: message.message_id,
                parse_mode: 'Markdown'
            }
        );
        
        bot.answerCallbackQuery(callbackQuery.id, { text: 'បានអនុម័តសំណើ!' });
        
    } else if (data.startsWith('reject_')) {
        // បដិសេធសំណើ
        pendingRequests.delete(parseInt(requestId));
        
        // ផ្ញើការជូនដំណឹងទៅសិស្ស
        bot.sendMessage(request.chatId,
            `⚠️ *សំណើអវត្តមានរបស់អ្នកត្រូវបានបដិសេធ!*\n\n` +
            `អ្នកគ្រប់គ្រងបានបដិសេធសំណើអវត្តមានរបស់អ្នក។\n` +
            `🆔 លេខសំណើ: ${requestId}\n\n` +
            `សូមទាក់ទងអ្នកគ្រប់គ្រងដោយផ្ទាល់សម្រាប់ព័ត៌មានបន្ថែម។`,
            { parse_mode: 'Markdown' }
        );
        
        // ធ្វើបច្ចុប្បន្នភាពសារអ្នកគ្រប់គ្រង
        bot.editMessageText(`❌ *សំណើត្រូវបានបដិសេធ*\n\n` +
                          `សិស្ស: ${request.studentName}\n` +
                          `លេខសំណើ: ${requestId}\n\n` +
                          `បានបដិសេធដោយ: ${callbackQuery.from.first_name}`,
            {
                chat_id: message.chat.id,
                message_id: message.message_id,
                parse_mode: 'Markdown'
            }
        );
        
        bot.answerCallbackQuery(callbackQuery.id, { text: 'បានបដិសេធសំណើ!' });
    }
});

// ពាក្យបញ្ជា /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    const helpMessage = `🆘 *ជំនួយ*\n\n` +
                       `*ពាក្យបញ្ជា:*\n` +
                       `/start - ចាប់ផ្តើមធ្វើសំណើថ្មី\n` +
                       `/help - បង្ហាញសារជំនួយនេះ\n` +
                       `/status - ពិនិត្យស្ថានភាពសំណើ\n\n` +
                       `*ព័ត៌មាន:*\n` +
                       `🏫 ថ្នាក់: ${CLASS}\n` +
                       `📚 សាលា: ${SCHOOL}\n` +
                       `👨‍💻 អ្នកអភិវឌ្ឍន៍: ${DEVELOPER}\n\n` +
                       `ប្រសិនបើមានបញ្ហា សូមទាក់ទងអ្នកគ្រប់គ្រងដោយផ្ទាល់។`;
    
    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// ពាក្យបញ្ជា /status
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    const state = userStates.get(chatId);
    
    let statusMessage = `📊 *ស្ថានភាពបច្ចុប្បន្ន*\n\n`;
    
    switch(state) {
        case STATE.WAITING_RESPONSE:
            statusMessage += `⏳ សំណើរបស់អ្នកកំពុងរង់ចាំការអនុម័តពីអ្នកគ្រប់គ្រង។\n`;
            statusMessage += `សូមរង់ចាំការជូនដំណឹង។`;
            break;
        case STATE.COLLECTING_INFO:
            statusMessage += `📝 អ្នកកំពុងបំពេញទម្រង់សំណើ។\n`;
            statusMessage += `សូមបំពេញព័ត៌មានឲ្យពេញលេញ។`;
            break;
        default:
            statusMessage += `🆓 អ្នកមិនមានសំណើដែលកំពុងរង់ចាំទេ។\n`;
            statusMessage += `វាយ /start ដើម្បីចាប់ផ្តើមសំណើថ្មី។`;
    }
    
    bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
});

// ការត្រួតពិនិត្យកំហុស
bot.on('polling_error', (error) => {
    console.error('កំហុស Polling:', error.code);
});

console.log('✅ Bot បានចាប់ផ្តើមដំណើរការដោយជោគជ័យ!');
console.log('សូមទាក់ទង @tephh ប្រសិនបើមានបញ្ហា។');
