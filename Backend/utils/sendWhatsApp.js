// // utils/sendWhatsApp.js
// import twilio from 'twilio'

// const accountSid = 'YOUR_TWILIO_SID'
// const authToken = 'YOUR_TWILIO_AUTH_TOKEN'
// const fromNumber = 'whatsapp:+14155238886' // Twilio sandbox number
// const toAdmin = 'whatsapp:+916381159595' // Your number (admin)

// const client = twilio(accountSid, authToken)

// const sendWhatsAppMessage = async (order) => {
//   const message = `🛒 *New COD Order*\n\nOrder ID: ${order._id}\nUser: ${order.user.name}\nTotal: ₹${order.totalPrice}\n\n📲 Please verify and send UPI QR to the customer.`

//   try {
//     const msg = await client.messages.create({
//       from: fromNumber,
//       to: toAdmin,
//       body: message,
//     })
//     console.log('✅ WhatsApp sent:', msg.sid)
//   } catch (err) {
//     console.error('❌ WhatsApp send error:', err.message)
//   }
// }

// export default sendWhatsAppMessage
