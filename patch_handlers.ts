import fs from 'fs';
let content = fs.readFileSync('server/bot.ts', 'utf-8');

// Replace the block from `else if (data === 'btn_profile')` to `else if (data === 'btn_locked_recommend'`
const oldBlockMatch = content.match(/else if \(data === 'btn_profile'\) \{[\s\S]*?else if \(data === 'btn_locked_recommend' \|\| data === 'btn_locked_chrono' \|\| data === 'btn_locked_image'\) \{[\s\S]*?show_alert: true,\n    \}/);

if (oldBlockMatch) {
  const newBlock = `else if (data === 'btn_profile') {
    const passExp = await getUserPassDb(chatId);
    const hasPass = passExp > Date.now();
    const expDateStr = hasPass ? new Date(passExp).toLocaleDateString('uz-UZ') : '';
    const daysLeft = hasPass ? Math.ceil((passExp - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

    const statusText = hasPass 
      ? \`VIP Animem Pass (Faol 🟢)\\n   ⏳ Muddati: <b>\${expDateStr}</b> (\${daysLeft} kun qoldi)\` 
      : \`Oddiy a'zo (Animem Pass faol emas ❌)\`;

    const profileText = \`<b>👤 Foydalanuvchi Profili</b>

🆔 <b>ID:</b> <code>\${from.id}</code>
✨ <b>Ism:</b> \${from.first_name || 'Noma\\'lum'} \${from.last_name || ''}
📱 <b>Username:</b> @\${from.username || 'mavjud emas'}
🎫 <b>Status:</b> \${statusText}
🎬 <b>Ko'rilgan animelar:</b> 0 ta

<i>\${hasPass ? 'Sizda barcha premium imtiyozlar faol!' : 'Animem Pass xarid qilib barcha cheklovlarni olib tashlang!'}</i>\`;

    await telegramApiCall('sendMessage', {
      chat_id: chatId,
      text: profileText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: hasPass ? '✨ Passni uzaytirish' : '🎫 Animem Pass olish', callback_data: 'btn_pass' }],
          [{ text: '◀️ Asosiy menyuga qaytish', callback_data: 'btn_main_menu' }],
        ],
      },
    });
  } else if (data === 'btn_pass') {
    const passText = \`<b>🎫 Animem Pass (Kawaii Pass) Premium Obunasi</b>

Animem Pass bilan quyidagi imtiyozlarga ega bo'lasiz:
• 🚫 <b>Mutlaqo reklamasiz</b> tomosha qilish
• ⚡ <b>1080p Full HD</b> eng yuqori sifat
• 🕒 Qismlarni <b>1 kun oldin</b> tomosha qilish
• 📸 <b>Rasm orqali qidirish</b> va 🔀 <b>Xronologiya</b> bo'limlari
• 🚀 Cheksiz tezlikda yuklab olish

<b>Quyidagi tariflardan birini tanlang va tezkor to'lovni amalga oshiring:</b>\`;

    await telegramApiCall('sendMessage', {
      chat_id: chatId,
      text: passText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❤️ 1 oylik — 10,000 so\\'m', callback_data: 'pass_buy_1m' }],
          [{ text: '🔥 2 oylik (-10%) — 18,000 so\\'m', callback_data: 'pass_buy_2m' }],
          [{ text: '🔥 3 oylik (-17%) — 23,000 so\\'m', callback_data: 'pass_buy_3m' }],
          [{ text: '⚡ 6 oylik (-25%) — 45,000 so\\'m', callback_data: 'pass_buy_6m' }],
          [{ text: '🌙 1 yillik (-33%) — 80,000 so\\'m', callback_data: 'pass_buy_1y' }],
          [{ text: '◀️ Asosiy menyu', callback_data: 'btn_main_menu' }],
        ],
      },
    });
  } else if (data.startsWith('pass_buy_')) {
    const plan = data.replace('pass_buy_', '');
    let amount = 10000;
    let days = 30;
    let title = '1 oylik Animem Pass';

    if (plan === '2m') { amount = 18000; days = 60; title = '2 oylik Animem Pass (-10%)'; }
    else if (plan === '3m') { amount = 23000; days = 90; title = '3 oylik Animem Pass (-17%)'; }
    else if (plan === '6m') { amount = 45000; days = 180; title = '6 oylik Animem Pass (-25%)'; }
    else if (plan === '1y') { amount = 80000; days = 365; title = '1 yillik Animem Pass (-33%)'; }

    const invoice = await createTezcheckInvoice(amount);
    if (invoice && invoice.ok && invoice.pay_url && invoice.order_id) {
      const payText = \`✨ <b>\${title} uchun to'lov yaratildi!</b>

💰 <b>Summa:</b> \${amount.toLocaleString()} so'm
🆔 <b>Buyurtma ID:</b> #\${invoice.order_id}

Quyidagi <b>"To'lov qilish"</b> tugmasini bosib Tezcheck orqali to'lovni amalga oshiring. To'lovdan so'ng <b>"To'lovni tekshirish"</b> tugmasini bosing va pass avtomatik faollashadi!\`;

      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: payText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 To\\'lov qilish (Tezcheck)', url: invoice.pay_url }],
            [{ text: '🔄 To\\'lovni tekshirish', callback_data: \`check_pay_\${invoice.order_id}_\${days}\` }],
            [{ text: '◀️ Orqaga', callback_data: 'btn_pass' }],
          ],
        },
      });
    } else {
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: \`⚠️ To'lov yaratishda xatolik yuz berdi (\${invoice.error || 'Server javobsiz'}). Iltimos keyinroq urinib ko'ring yoki admin bilan bog'laning.\`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '◀️ Orqaga', callback_data: 'btn_pass' }]],
        },
      });
    }
  } else if (data.startsWith('check_pay_')) {
    const parts = data.replace('check_pay_', '').split('_');
    const orderId = Number(parts[0]);
    const days = Number(parts[1]) || 30;

    const statusRes = await checkTezcheckInvoiceStatus(orderId);
    const payment = statusRes?.payment;
    const paymentStatus = payment?.status || statusRes?.status;

    if (statusRes.ok && (paymentStatus === 'paid' || paymentStatus === 'success')) {
      const newExp = await setUserPassDb(chatId, days, from.first_name, from.username);
      const expDateStr = new Date(newExp).toLocaleDateString('uz-UZ');

      const successText = \`🎉 <b>Tabriklaymiz! To'lov muvaffaqiyatli qabul qilindi!</b>

🎫 <b>Sizga Animem Pass avtomatik faollashtirildi!</b>
⏳ <b>Amal qilish muddati:</b> \${expDateStr} gacha (\${days} kun)

🚀 Endi barcha cheklovlar olib tashlandi:
• 🎯 <b>Tavsiyalar</b>
• 🔀 <b>Xronologiya</b>
• 📸 <b>Rasm orqali qidirish</b>
• Mutlaqo reklamasiz va 1080p HD sifatda zavqlaning!\`;

      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: successText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎬 Bosh menyu va animelar', callback_data: 'btn_main_menu' }],
          ],
        },
      });
    } else {
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: \`⏳ <b>To'lov hali amalga oshirilmagan yoki tekshirilmoqda.</b>\\n\\nIltimos, havolani bosib to'lovni yakunlang va qaytadan <b>"To'lovni tekshirish"</b> tugmasini bosing.\`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Qayta tekshirish', callback_data: data }],
            [{ text: '◀️ Orqaga', callback_data: 'btn_pass' }],
          ],
        },
      });
    }
  } else if (data === 'btn_locked_recommend' || data === 'btn_locked_chrono' || data === 'btn_locked_image') {
    const passExp = await getUserPassDb(chatId);
    if (passExp > Date.now()) {
      let featureTitle = '🎯 Tavsiyalar';
      let featureDesc = 'Siz uchun maxsus tavsiya etilgan eng sara animelar ro\\'yxati:\\n\\n1. Qora Klever ⭐ 8.6\\n2. Jujutsu Kaisen ⭐ 8.8\\n3. Attack on Titan ⭐ 9.1';
      if (data === 'btn_locked_chrono') {
        featureTitle = '🔀 Xronologiya';
        featureDesc = 'Anime seriallar va filmlarni qaysi tartibda ko\\'rish kerakligi bo\\'yicha to\\'liq xronologik jadval va qismlar ketma-ketligi.';
      } else if (data === 'btn_locked_image') {
        featureTitle = '📸 Rasm orqali qidiruv';
        featureDesc = 'Istalgan anime kadrini botga yuboring va bot shu anime qaysi qism va soniyada ekanligini darhol topib beradi!';
      }

      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: \`<b>\${featureTitle} (Animem Pass VIP)</b>\\n\\n\${featureDesc}\`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '◀️ Asosiy menyu', callback_data: 'btn_main_menu' }]],
        },
      });
    } else {
      let feature = 'Ushbu bo\\'lim';
      if (data === 'btn_locked_recommend') feature = '🎯 Tavsiyalar';
      if (data === 'btn_locked_chrono') feature = '🔀 Xronologiya';
      if (data === 'btn_locked_image') feature = '📸 Rasm orqali qidiruv';
      await telegramApiCall('answerCallbackQuery', {
        callback_query_id: id,
        text: \`🔒 \${feature} faqat Animem Pass egalari uchun ochiq!\`,
        show_alert: true,
      });
    }`;

  content = content.replace(oldBlockMatch[0], newBlock);
  fs.writeFileSync('server/bot.ts', content);
  console.log('Successfully updated handlers in server/bot.ts');
} else {
  console.error('Could not match old block in server/bot.ts');
}
