import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import { formatPhoneNumber, getPhoneVariants } from "../src/services/whatsappService.js";

const shreejiOfficialList = [
  // --- Part 1 ---
  { name: "MONTUBHAI", phone: "9725454581" },
  { name: "SANDIP", phone: "9724362936" },
  { name: "AVNIBEN", phone: "9924043300" },
  { name: "KALPESH PATEL", phone: "9664520528" },
  { name: "CHANDAR SARVEIYA", phone: "9408853737" },
  { name: "DEVANG DAVE", phone: "9409407420" },
  { name: "ALPESH JANI", phone: "9712791616" },
  { name: "ASHOK", phone: "9924833855" },
  { name: "HIRABHAI SOLANKI", phone: "9723399647" },
  { name: "RAJESH PATEL", phone: "7623004542" },
  { name: "BHARAT SOLANKI", phone: "9099047028" },
  { name: "CHANDUBHAUI", phone: "8140506620" },
  { name: "ASHOKBHAI", phone: "9928333015" },
  { name: "BHAGIRATHBHAI SIHORA", phone: "8537689535" },
  { name: "AMIT PARMAR", phone: "9909162656" },
  { name: "MAHESH MISTRI", phone: "7567999310" },
  { name: "ARPANBHAI", phone: "9328188995" },
  { name: "KEVIN", phone: "8320345320" },
  { name: "BRIJESH KHNAT", phone: "8401273775" },
  { name: "KIRITBHAI", phone: "9428859198" },
  { name: "PRAVIN RATHDO", phone: "8866323131" },
  { name: "VINUBHAI PATEL", phone: "9428183652" },
  { name: "DIPAK", phone: "9664890832" },
  { name: "HARDIKBHAI", phone: "7984512727" },
  { name: "MEHULBHAI", phone: "9825727270" },
  { name: "CHETANBHAI", phone: "9825344711" },
  { name: "DILIPBHAI", phone: "9624687691" },
  { name: "RAMESH", phone: "9712170627" },
  { name: "SIRISH", phone: "9428182695" },
  { name: "HARDIK JANI", phone: "8401365873" },
  { name: "KENIL", phone: "9409530436" },

  // --- Part 2 ---
  { name: "PARESH MEHTA", phone: "8401031477" },
  { name: "MEHUL SANGANI", phone: "9904794471" },
  { name: "MAHESH MER", phone: "9879477387" },
  { name: "ABHISHEKBHAI", phone: "9429094244" },
  { name: "DHRUVBHAI", phone: "9925711523" },
  { name: "HARESH DABHI", phone: "9725522246" },
  { name: "SHAILESH BHAGAT", phone: "9924711847" },
  { name: "MANISHDADA", phone: "9228741480" },
  { name: "ASHOKBHAI BHAGAT", phone: "9428108756" },
  { name: "ASHOK DESAI", phone: "9725147135" },
  { name: "ASHOK MAHARAJ", phone: "9725444176" },
  { name: "GOPAL", phone: "9106121581" },
  { name: "BRIJESH JAGVANI", phone: "8866169145" },
  { name: "VISHAL PANDAY", phone: "7016385738" },
  { name: "KAPILBEV", phone: "9825819535" },
  { name: "BHARATBHAI RAMANU", phone: "9909989255" },
  { name: "PRITIBEN", phone: "9898708819" },
  { name: "BHAVESH VYAS", phone: "9873035612" },
  { name: "UMEDBHAI", phone: "9426444345" },
  { name: "UPENDRABHUDEV", phone: "9924972743" },
  { name: "VASANT", phone: "9924475318" },
  { name: "BHARGAVBHAI GANDH", phone: "9920101058" },
  { name: "MUKESH RAJRAGURU", phone: "9737066084" },
  { name: "NILUJBHAI DAVE", phone: "9426845759" },
  { name: "PARESH DAVE", phone: "9429164573" },
  { name: "ARUNABEN CHUDASAMA", phone: "7383885682" },
  { name: "HASMUKHBAI MISTRI", phone: "8125492318" },
  { name: "RAJUBHAI MISTRI", phone: "9879978945" },
  { name: "YOGESH MISTRI", phone: "9714341310" },
  { name: "DHARMESH KAVA", phone: "9904020463" },
  { name: "CHANDUBHAI HARSORA", phone: "9913135151" },
  { name: "HASHMUKHBHAI", phone: "9426594832" },
  { name: "NAVAL MISTRI", phone: "9327553464" },
  { name: "JM KAVA", phone: "9714342010" },
  { name: "ANKIT RATHOD", phone: "8980573003" },

  // --- Part 3 ---
  { name: "VIJAY", phone: "7043319328" },
  { name: "MAHESH GADHVI", phone: "9687579991" },
  { name: "HARDIKBHAI PRAJAPATI", phone: "9898521084" },
  { name: "HARESHBHAI MISTRI", phone: "6355464967" },
  { name: "ASHISHBHAI MAKWANA", phone: "7016417181" },
  { name: "MANISH PARMAR", phone: "9428221966" },
  { name: "KALPESH CHITRODA", phone: "8000764595" },
  { name: "BHAVESH CHUDASAMA", phone: "9913331371" },
  { name: "HITESHBHAI", phone: "9376475503" },
  { name: "NILESHBHAI RATHOD", phone: "8140989309" }
];

async function updateShreejiList() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Map each customer by phone or blank key
  const shreejiPhoneMap = new Map();
  for (const item of shreejiOfficialList) {
    let cleanPhone;
    if (!item.phone || item.phone.trim() === "") {
      cleanPhone = `BLANK_${item.name.replace(/\s+/g, "_")}`;
    } else {
      cleanPhone = formatPhoneNumber(item.phone);
    }

    if (!shreejiPhoneMap.has(cleanPhone)) {
      shreejiPhoneMap.set(cleanPhone, {
        name: item.name,
        phone: cleanPhone
      });
    }
  }

  console.log(`\n=======================================================`);
  console.log(`Total Official SHREEJI Entries: ${shreejiOfficialList.length}`);
  console.log(`Unique SHREEJI Phone Numbers / Blank Entries: ${shreejiPhoneMap.size}`);
  console.log(`=======================================================`);

  // Gather all valid phones for SHREEJI
  const validShreejiPhones = [];
  for (const [k, v] of shreejiPhoneMap.entries()) {
    validShreejiPhones.push(v.phone);
    const variants = getPhoneVariants(v.phone);
    validShreejiPhones.push(...variants);
  }

  // 1. Reset old SHREEJI contacts in DB not in new list to General
  const nonListShreeji = await Customer.find({
    category: "SHREEJI",
    phone: { $nin: validShreejiPhones }
  });

  console.log(`\nFound ${nonListShreeji.length} old/legacy SHREEJI contacts in DB not in new list. Resetting category to 'General'...`);
  for (const c of nonListShreeji) {
    c.category = "General";
    c.tags = (c.tags || []).filter(t => t !== "SHREEJI");
    await c.save();
  }

  // 2. Upsert official 76 SHREEJI contacts into DB
  let createdCount = 0;
  let updatedCount = 0;

  for (const [cleanPhone, info] of shreejiPhoneMap.entries()) {
    const isBlank = cleanPhone.startsWith("BLANK_");
    const variants = isBlank ? [cleanPhone] : getPhoneVariants(cleanPhone);

    let cust = await Customer.findOne({ phone: { $in: variants } });

    if (cust) {
      cust.category = "SHREEJI";
      const mergedTags = new Set([...(cust.tags || []), "SHREEJI"]);
      cust.tags = Array.from(mergedTags);
      await cust.save();
      updatedCount++;
    } else {
      cust = new Customer({
        name: isBlank ? `${info.name} (No Phone Number)` : info.name,
        phone: cleanPhone,
        category: "SHREEJI",
        tags: ["SHREEJI"],
        source: "Official SHREEJI Import"
      });
      await cust.save();

      // Ensure Chat document exists
      let chat = await Chat.findOne({ customer: cust._id });
      if (!chat) {
        await Chat.create({ customer: cust._id, status: "Open" });
      }

      createdCount++;
    }
  }

  const finalShreejiCount = await Customer.countDocuments({
    $or: [{ category: "SHREEJI" }, { tags: "SHREEJI" }]
  });

  console.log(`\n=======================================================`);
  console.log(`📊 SHREEJI UPDATE SUMMARY:`);
  console.log(`=======================================================`);
  console.log(`- Official SHREEJI Entries: ${shreejiOfficialList.length}`);
  console.log(`- Newly Created Contacts: ${createdCount}`);
  console.log(`- Updated Existing Contacts: ${updatedCount}`);
  console.log(`- Exact SHREEJI Contacts in DB Now: ${finalShreejiCount}`);

  process.exit(0);
}

updateShreejiList();
