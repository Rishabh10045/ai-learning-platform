// Five Hinglish, food-delivery-style reminder templates. {topic} is always the pending topic.
// Placeholders: {name} {day} {topic} {minutes} {streak} {link}. Plain text only (no tracking pixels, no HTML).
export const templates = [
  {
    id: 'thanda',
    subject: '{topic} thanda ho raha hai 🥶',
    body: 'Hi {name}, aapka Day {day} order (*{topic}*) abhi tak pick-up nahi hua.\nBas {minutes} min ka kaam hai. Garam garam padh lo, phir kal ka order ready milega.\n\nOpen Study Desk: {link}'
  },
  {
    id: 'extra-java',
    subject: 'Ek plate {topic}, extra Java ke saath? ☕',
    body: 'Hi {name}, kitchen ne Day {day} prepare kar diya hai: {topic}.\nNotes, Java example aur interview questions sab plate mein hain. Sirf aapka wait ho raha hai.\n\nShuru karo: {link}'
  },
  {
    id: 'rider-waiting',
    subject: 'Delivery partner wait kar raha hai 🛵',
    body: 'Hi {name}, aapka {topic} wala session gate pe khada hai.\nPehle 12 min revision, phir main lesson. Ek baar shuru kiya toh flow mil jayega.\n\nGate kholo: {link}'
  },
  {
    id: 'cart',
    subject: '{topic} abhi bhi cart mein pada hai 🛒',
    body: 'Hi {name}, checkout pending hai: Day {day}, {topic}.\nAapka {streak}-day streak ka discount chal raha hai. Aaj padh lo toh streak safe rahega.\n\nCheckout karo: {link}'
  },
  {
    id: 'last-call',
    subject: 'Last call! Kitchen band hone wali hai 🔔',
    body: 'Hi {name}, aaj ka order ({topic}) 4 AM ke baad kal pe shift ho jayega.\nChhota sa start bhi chalega: revision + ek practice item.\n\nAbhi order lo: {link}'
  }
];

export function fill(text, vars) {
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}

// Rotate deterministically by IST date and slot, so two reminders on the same day never repeat a template.
export function pick(dateIST, slotIndex) {
  const d = Number(dateIST.replaceAll('-', '')) || 0;
  return templates[(d + slotIndex) % templates.length];
}
