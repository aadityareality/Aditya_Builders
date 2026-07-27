import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import { formatPhoneNumber, getPhoneVariants } from "../src/services/whatsappService.js";

const iconOfficialList = [
  // --- Part 1 ---
  { name: "MANISH SOLANKI", phone: "9601959995" },
  { name: "MEGNABEN", phone: "7405098443" },
  { name: "ALPESH PANDYA", phone: "9727687951" },
  { name: "AMIT PARMAR", phone: "9909162656" },
  { name: "KISHAN", phone: "6352898941" },
  { name: "MAHEBHAI BHATT", phone: "9998625128" },
  { name: "HIRABHAI SOLANKI", phone: "9723399647" },
  { name: "JAGDISBHAI GAUSHAMI", phone: "9099356306" },
  { name: "RAJESHBHAI JAGRA", phone: "9714739760" },
  { name: "KARANSINH RAVAT", phone: "7878418180" },
  { name: "MAHESH MAKWAN", phone: "9737667886" },
  { name: "OM DODIYA", phone: "9898590648" },
  { name: "RAJESH PRAJAPATI", phone: "8511193985" },
  { name: "SHIVAM MISTRI", phone: "7863837383" },
  { name: "JIGNESH MISTRI", phone: "7043373537" },
  { name: "DINESH MISTRI", phone: "9925056397" },
  { name: "JITU DODIYA", phone: "9909794300" },
  { name: "PRAKASH SIDHURA", phone: "9869330911" },
  { name: "HARESH PARMAR", phone: "9173225305" },
  { name: "AMIT", phone: "9974800300" },
  { name: "SHAILESH", phone: "9426228922" },
  { name: "ASHOKBHAI PUROHIT", phone: "9426261132" },
  { name: "MEHUL", phone: "7698902867" },
  { name: "PRAKASH CHAUHAN", phone: "6355683899" },
  { name: "RAJU RATHOD", phone: "9824335005" },
  { name: "PRAVINBHAI TRIVEDI", phone: "8200748065" },
  { name: "SHNEHBHAI", phone: "9510806702" },
  { name: "SANJAY", phone: "8264658661" },
  { name: "RAMDEV RATHOD", phone: "8264323232" },
  { name: "BIPIN PRAJPATI", phone: "9879908590" },
  { name: "YASH RA", phone: "9824725218" },

  // --- Part 2 ---
  { name: "KIRIT KANJIYA", phone: "9328180418" },
  { name: "RAJ MAKWNA", phone: "7990177461" },
  { name: "CHETAN RATHOD", phone: "9834353711" },
  { name: "RAKESH PARMAR", phone: "9737749090" },
  { name: "BHARAT SOLANKI", phone: "7621840466" },
  { name: "HITESH MAKWNA", phone: "6352003506" },
  { name: "RAHUL", phone: "8780808585" },
  { name: "HARESH DALSANIYA", phone: "9904740305" },
  { name: "AKSHAR PATEL", phone: "820046895" },
  { name: "YATINBHAI CHUDASAMA", phone: "8154884133" },
  { name: "NILAMBEN JOSHI", phone: "9825485508" },
  { name: "GAURANGBHAI DARJI", phone: "8200199393" },
  { name: "HARESH DABHI", phone: "9725522246" },
  { name: "VARSHABEN", phone: "9998418199" },
  { name: "ARVIND JETHVA", phone: "9624193018" },
  { name: "TARABEN PATEL", phone: "9904441288" },
  { name: "BHAVESH VAJA", phone: "9714389033" },
  { name: "RAISANGBHAI", phone: "9106938606" },
  { name: "PARESHBHAI", phone: "9426439729" },
  { name: "SHAILESHBHAI JAGAR", phone: "9825599449" },
  { name: "PARAGBHAI MEHTA", phone: "9429582857" },
  { name: "BABUL MISTRI", phone: "9825603378" },
  { name: "RAJESH KALJANIYA", phone: "9898924466" },
  { name: "VIMAL DAVE", phone: "8780333474" },
  { name: "HARSINH DODIYA", phone: "9429211087" },
  { name: "JAGDISH NAYNA", phone: "9879061319" },
  { name: "VIJAY MAKWANA", phone: "9924771604" },
  { name: "AGRAVATBHAI", phone: "9879503550" },
  { name: "JANIBHAI", phone: "8200191726" },
  { name: "JEELBHAI", phone: "8140513149" },
  { name: "VINODBHAI PARMAR", phone: "98469168336" },
  { name: "SANJAYBHAI MAKWANA", phone: "9737222325" },
  { name: "ARPITBHAI", phone: "9913866090" },
  { name: "RAJU MAKWANA", phone: "8460167633" },
  { name: "JITENDRA MAKWANA", phone: "9723931096" },

  // --- Part 3 ---
  { name: "PRAKASH JOSHI", phone: "9426970240" },
  { name: "DILIP DARJI", phone: "9879973387" },
  { name: "HASMUKH UPADHYAY", phone: "9998409630" },
  { name: "DHIRUBHAI PARMAR", phone: "9228589997" },
  { name: "JAGDISHBHAI MAHARAJ", phone: "8306925454" },
  { name: "MANOJBHAI BHAT", phone: "9426260900" },
  { name: "PRATIKBHAI RATHOD", phone: "9327193113" },
  { name: "VISHAL PANDYA", phone: "7016385738" },
  { name: "ANKITBHAI", phone: "9724245102" },
  { name: "MITESHBHAI MAKWANA", phone: "9724904002" },
  { name: "MEHULBHAI JANI", phone: "9974128304" },
  { name: "MAHESHBHAI GOHIL", phone: "9924869372" },
  { name: "PRATIKBHAI GUPTA", phone: "9724047659" },
  { name: "NILESHBHAI PATEL", phone: "9904267150" },
  { name: "SHRIKANTBHAI", phone: "7021171424" },
  { name: "PRAKASH THAKOR", phone: "7046653303" },
  { name: "HARESH RATHOD", phone: "9898303680" },
  { name: "VISHAL DHOLAKIYA", phone: "8866518575" },
  { name: "PARTH OZA", phone: "9558314645" },
  { name: "ALKABEN BHATT", phone: "9426163032" },
  { name: "NAMAN BHATT", phone: "7201994191" },
  { name: "RAJESH BHATT", phone: "982318327" },
  { name: "DIPAK SHAH", phone: "9825469533" },
  { name: "PANKAJ", phone: "9913387838" },
  { name: "HARSHDA JOSHI", phone: "9426584141" },
  { name: "JEMINBHAI BHATT", phone: "7016115161" },
  { name: "MEHULBHAI RAJYAGURU", phone: "9033795478" },
  { name: "KALPESHBHAI MAKWANA", phone: "8866892669" },
  { name: "ABHISHEK PADIYA", phone: "7405740522" },
  { name: "DILIPBHAI PATEL", phone: "9925125368" },
  { name: "BHARAT", phone: "9106707026" }
];

async function updateIconList() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Map each customer by phone or blank key
  const iconPhoneMap = new Map();
  for (const item of iconOfficialList) {
    let cleanPhone;
    if (!item.phone || item.phone.trim() === "") {
      cleanPhone = `BLANK_${item.name.replace(/\s+/g, "_")}`;
    } else {
      cleanPhone = formatPhoneNumber(item.phone);
    }

    if (!iconPhoneMap.has(cleanPhone)) {
      iconPhoneMap.set(cleanPhone, {
        name: item.name,
        phone: cleanPhone
      });
    }
  }

  console.log(`\n=======================================================`);
  console.log(`Total Official ICON Entries: ${iconOfficialList.length}`);
  console.log(`Unique ICON Phone Numbers / Blank Entries: ${iconPhoneMap.size}`);
  console.log(`=======================================================`);

  // Gather all valid phones for ICON
  const validIconPhones = [];
  for (const [k, v] of iconPhoneMap.entries()) {
    validIconPhones.push(v.phone);
    const variants = getPhoneVariants(v.phone);
    validIconPhones.push(...variants);
  }

  // 1. Reset old ICON contacts in DB not in new list to General
  const nonListIcon = await Customer.find({
    category: "ICON",
    phone: { $nin: validIconPhones }
  });

  console.log(`\nFound ${nonListIcon.length} old/legacy ICON contacts in DB not in new list. Resetting category to 'General'...`);
  for (const c of nonListIcon) {
    c.category = "General";
    c.tags = (c.tags || []).filter(t => t !== "ICON");
    await c.save();
  }

  // 2. Upsert official 97 ICON contacts into DB
  let createdCount = 0;
  let updatedCount = 0;

  for (const [cleanPhone, info] of iconPhoneMap.entries()) {
    const isBlank = cleanPhone.startsWith("BLANK_");
    const variants = isBlank ? [cleanPhone] : getPhoneVariants(cleanPhone);

    let cust = await Customer.findOne({ phone: { $in: variants } });

    if (cust) {
      cust.category = "ICON";
      const mergedTags = new Set([...(cust.tags || []), "ICON"]);
      cust.tags = Array.from(mergedTags);
      await cust.save();
      updatedCount++;
    } else {
      cust = new Customer({
        name: isBlank ? `${info.name} (No Phone Number)` : info.name,
        phone: cleanPhone,
        category: "ICON",
        tags: ["ICON"],
        source: "Official ICON Import"
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

  const finalIconCount = await Customer.countDocuments({
    $or: [{ category: "ICON" }, { tags: "ICON" }]
  });

  console.log(`\n=======================================================`);
  console.log(`📊 ICON UPDATE SUMMARY:`);
  console.log(`=======================================================`);
  console.log(`- Official ICON Entries: ${iconOfficialList.length}`);
  console.log(`- Newly Created Contacts: ${createdCount}`);
  console.log(`- Updated Existing Contacts: ${updatedCount}`);
  console.log(`- Exact ICON Contacts in DB Now: ${finalIconCount}`);

  process.exit(0);
}

updateIconList();
