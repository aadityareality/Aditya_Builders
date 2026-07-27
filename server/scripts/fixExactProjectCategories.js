import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import { formatPhoneNumber, getPhoneVariants } from "../src/services/whatsappService.js";

const clientLists = [
  // --- AURA (35 entries, 34 unique phone numbers + 1 shared) ---
  { project: "AURA", name: "KARANSINH R CHAVDA", phone: "9574146126" },
  { project: "AURA", name: "KAHANSINH R CHAVDA", phone: "9328034495" },
  { project: "AURA", name: "NIRAJBHAI K PALL", phone: "9528874669" },
  { project: "AURA", name: "MAYURBHAI S BHAMANI", phone: "8141055621" },
  { project: "AURA", name: "DIGPALSINH S JADEJA", phone: "9726272848" },
  { project: "AURA", name: "ASHOKBHAI PRAJAPATI", phone: "9998100946" },
  { project: "AURA", name: "ILABEN J MASANI", phone: "7046474855" },
  { project: "AURA", name: "JALPABEN N SOLANKI", phone: "8320990890" },
  { project: "AURA", name: "BHAGIRATHSINH K RATHOD", phone: "9106818243" },
  { project: "AURA", name: "VISHALBHAI D SARVAIYA", phone: "8128444480" },
  { project: "AURA", name: "LAXMIBEN M RAO", phone: "9429074850" },
  { project: "AURA", name: "HITENDRA B GOHIL", phone: "7874629906" },
  { project: "AURA", name: "KAVITAKUMARI", phone: "9724097382" },
  { project: "AURA", name: "HARPALSINH KUNCHALA", phone: "7874717271" },
  { project: "AURA", name: "SHAILESHBHAI R PRAJAPATI", phone: "9824392694" },
  { project: "AURA", name: "KAILASHBEN N JADEJA", phone: "7046198111" },
  { project: "AURA", name: "TRUSHARGIRI GOUSWAMI", phone: "9426495858" },
  { project: "AURA", name: "KAILASHBEN J VORA", phone: "7046375858" },
  { project: "AURA", name: "PRASHANTBHAI CHAUHAN", phone: "9904020010" },
  { project: "AURA", name: "VIKRAMBHAI SHETHAVAR", phone: "9979906383" },
  { project: "AURA", name: "DHANMANTIBEN CHAND", phone: "9904020010" },
  { project: "AURA", name: "PARTHBHAI C GOHIL", phone: "8140346418" },
  { project: "AURA", name: "ALKESHBHAI GOUSHWAMI", phone: "8866985500" },
  { project: "AURA", name: "RAVIKANT G BHATT", phone: "9558406496" },
  { project: "AURA", name: "RAHULBHAI B SOLANKI", phone: "9714238989" },
  { project: "AURA", name: "HITESHBHAI G GOHIL", phone: "9426343038" },
  { project: "AURA", name: "NIKUNJBHAI RAJYAGURU", phone: "8780030419" },
  { project: "AURA", name: "HIREN M CHAUHAN", phone: "9725870304" },
  { project: "AURA", name: "KAILASHBEN K BALDANIYA", phone: "9586410581" },
  { project: "AURA", name: "VIVEKBHAI V ACHARYA", phone: "7436060636" },
  { project: "AURA", name: "DHARMIK A RAV", phone: "7984447320" },
  { project: "AURA", name: "BHADRESHBHAI VARAIYA", phone: "7016328335" },
  { project: "AURA", name: "SHIVAMBHAI VARAIYA", phone: "7016328335" },
  { project: "AURA", name: "HIRENBHAI A GOHIL", phone: "8140591415" },

  // --- GOLD (12 entries) ---
  { project: "GOLD", name: "DEV PANDYA", phone: "9924739697" },
  { project: "GOLD", name: "SANJAYSINH MORI", phone: "9924330026" },
  { project: "GOLD", name: "SANJAY PATEL", phone: "9723377131" },
  { project: "GOLD", name: "PRAVIN DHAMELIYA", phone: "9725583850" },
  { project: "GOLD", name: "JAYDEEPBHAI VEGAD", phone: "9624965301" },
  { project: "GOLD", name: "DINESHBHAI SIJODIYA", phone: "9099381131" },
  { project: "GOLD", name: "MITAL PADALIYA", phone: "9979958975" },
  { project: "GOLD", name: "DEVARAM CHAUDHARI", phone: "9677782477" },
  { project: "GOLD", name: "SANJAYBHAI ALODARIYA", phone: "9825232221" },
  { project: "GOLD", name: "GANESH CHAUDHRI", phone: "8000508787" },
  { project: "GOLD", name: "DHARMESHBHAI", phone: "9099031918" },
  { project: "GOLD", name: "JITENDRA PARMAR", phone: "9979140360" },

  // --- DREAMLAND (26 entries) ---
  { project: "DREAMLAND", name: "JAYESHBHAI UPADHYAY", phone: "9913827311" },
  { project: "DREAMLAND", name: "BHIKHUBHAI PARMAR", phone: "9427686191" },
  { project: "DREAMLAND", name: "RAVIRAJSINH ZALA", phone: "7096398345" },
  { project: "DREAMLAND", name: "KISHORBHAI ROJASARA", phone: "9825334375" },
  { project: "DREAMLAND", name: "NITABEN SOLANKI", phone: "9173184681" },
  { project: "DREAMLAND", name: "KULDIPBHAI DHILA", phone: "8511506056" },
  { project: "DREAMLAND", name: "BHARATBHAI PANARA", phone: "8347513887" },
  { project: "DREAMLAND", name: "NANJIBHAI PRAJAPATI", phone: "7874814427" },
  { project: "DREAMLAND", name: "KANTIBHAI BHADRA", phone: "9979587699" },
  { project: "DREAMLAND", name: "RAJENDRABHAI NAKUM", phone: "6352079294" },
  { project: "DREAMLAND", name: "KHIMJIBHAI PRAJAPATI", phone: "9376225662" },
  { project: "DREAMLAND", name: "MAYURBHAI PRAJAPATI", phone: "9376225662" },
  { project: "DREAMLAND", name: "PARESHBHAI PARMAR", phone: "9727404896" },
  { project: "DREAMLAND", name: "MUKESHBHAI WAGHESHWARI", phone: "9879340577" },
  { project: "DREAMLAND", name: "MUKESHGIRI", phone: "9879340577" },
  { project: "DREAMLAND", name: "MAHESHBHAI UPADHYAY", phone: "" }, // Blank phone
  { project: "DREAMLAND", name: "DINESHBHAI RAJAPARA", phone: "8238715246" },
  { project: "DREAMLAND", name: "AKASH MAKWANA", phone: "9624074050" },
  { project: "DREAMLAND", name: "DINESHBHAI MAKWANA", phone: "9054443399" },
  { project: "DREAMLAND", name: "VISHNUBHAI MALI", phone: "9879806757" },
  { project: "DREAMLAND", name: "ASHISHBHAI PITHVA", phone: "9825262230" },
  { project: "DREAMLAND", name: "SANDIPBHAI CHOUHAN", phone: "9033755337" },
  { project: "DREAMLAND", name: "HASMUKHBHAI BHUTIYA", phone: "9687488598" },
  { project: "DREAMLAND", name: "BHARATBHAI MAKWANA", phone: "7777931730" },
  { project: "DREAMLAND", name: "KAMALBHAI CHOUHAN", phone: "9033595162" },
  { project: "DREAMLAND", name: "DILIPBHAI SIHORA", phone: "9979214321" },
  { project: "DREAMLAND", name: "JAYESHBHAI PADHYA", phone: "9427182415" },

  // --- ADITYA ST SOCIETY (11 entries) ---
  { project: "ADITYA ST SOCIETY", name: "JAYPALSINH MORI", phone: "9824125665" },
  { project: "ADITYA ST SOCIETY", name: "AJAY PANDIT", phone: "9979653658" },
  { project: "ADITYA ST SOCIETY", name: "MANISHBHA", phone: "9427181206" },
  { project: "ADITYA ST SOCIETY", name: "JAGAT JOSHI", phone: "9428181009" },
  { project: "ADITYA ST SOCIETY", name: "JIVA PARMAR", phone: "9979603737" },
  { project: "ADITYA ST SOCIETY", name: "KANU PRAJAPATI", phone: "7048487476" },
  { project: "ADITYA ST SOCIETY", name: "KETAN PANDYA", phone: "9427172310" },
  { project: "ADITYA ST SOCIETY", name: "DEVENDRA KATAKIYA", phone: "9724360423" },
  { project: "ADITYA ST SOCIETY", name: "SANJAY NIMAAT", phone: "9723406914" },
  { project: "ADITYA ST SOCIETY", name: "HARDIK DUDHERIJIYA", phone: "9624316231" },
  { project: "ADITYA ST SOCIETY", name: "BHAVESH LALUVADIYA", phone: "9925668483" },

  // --- ELEGANCE (38 entries) ---
  { project: "ELEGANCE", name: "PRAKASHBHAI MAKWANA", phone: "6352659165" },
  { project: "ELEGANCE", name: "MANTHAM JOSHI", phone: "9714507167" },
  { project: "ELEGANCE", name: "MANISHBHAI JOSHU", phone: "9875028075" },
  { project: "ELEGANCE", name: "NIDHIBEN PATEL", phone: "8320617702" },
  { project: "ELEGANCE", name: "MUKUNDBHAI SONI", phone: "9924246311" },
  { project: "ELEGANCE", name: "NIRAV", phone: "9377531531" },
  { project: "ELEGANCE", name: "PANKAJBHAU UPADHYAI", phone: "9909989250" },
  { project: "ELEGANCE", name: "KETANBHAI PATEL", phone: "9428051815" },
  { project: "ELEGANCE", name: "NARESHBHAI SIDDHPURA", phone: "9426902657" },
  { project: "ELEGANCE", name: "JAYESHBHAI SONI", phone: "6355716667" },
  { project: "ELEGANCE", name: "NARESHBHAI RATHOD", phone: "9723120842" },
  { project: "ELEGANCE", name: "DARSHAKBHAI SONI", phone: "9879362536" },
  { project: "ELEGANCE", name: "CHENTANBHAI KUNCHA", phone: "9824776172" },
  { project: "ELEGANCE", name: "BHAVINBHAI BAROT", phone: "9099520666" },
  { project: "ELEGANCE", name: "POOJA GOSAI", phone: "7405226105" },
  { project: "ELEGANCE", name: "VALLABHBHAI DADVA", phone: "9879326222" },
  { project: "ELEGANCE", name: "RAVI", phone: "9909502083" },
  { project: "ELEGANCE", name: "CHIRAGBHAI GOHEL", phone: "9510981633" },
  { project: "ELEGANCE", name: "DINESHBHAI VASOYA", phone: "9925375447" },
  { project: "ELEGANCE", name: "HITARTH RATHOD", phone: "7777975444" },
  { project: "ELEGANCE", name: "LABHUBHAI SOLANKI", phone: "9725608761" },
  { project: "ELEGANCE", name: "JULABEN PATEL", phone: "7493939393" },
  { project: "ELEGANCE", name: "BHADRESHBHAI GAOUSHWAMI", phone: "9924983150" },
  { project: "ELEGANCE", name: "PARTH DHAMELIYA", phone: "9974693874" },
  { project: "ELEGANCE", name: "DARSHANBHAI MANGUKIYA", phone: "9879378757" },
  { project: "ELEGANCE", name: "YASH MEHTA", phone: "9924773535" },
  { project: "ELEGANCE", name: "YASH JOSHI", phone: "8000221093" },
  { project: "ELEGANCE", name: "JAYPALBHAI", phone: "7383730572" },
  { project: "ELEGANCE", name: "DEV TRIVEDI", phone: "7984856773" },
  { project: "ELEGANCE", name: "RAVINDRA AMBLANI", phone: "9106933004" },
  { project: "ELEGANCE", name: "KAMLESH KAVA", phone: "9824511160" },
  { project: "ELEGANCE", name: "SAVJIBHAI PATEL", phone: "9828181090" },
  { project: "ELEGANCE", name: "NAYANBHAI PARMAR", phone: "8734053453" },
  { project: "ELEGANCE", name: "BHAVESHBHAI", phone: "9714680049" },
  { project: "ELEGANCE", name: "NIKHILBHAI PATEL", phone: "8264146250" },
  { project: "ELEGANCE", name: "JAY VAGHASIYA", phone: "9601084740" },
  { project: "ELEGANCE", name: "KALPEHSBHAI", phone: "9099887769" }
];

async function fixProjectCategories() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Map each customer to their list of categories (supporting multiple categories!)
  const customerCategoriesMap = new Map(); // phone or ID -> { name, phone, categories: Set() }

  for (const item of clientLists) {
    let key;
    if (!item.phone || item.phone.trim() === "") {
      key = `BLANK_${item.name.replace(/\s+/g, "_")}`;
    } else {
      key = formatPhoneNumber(item.phone);
    }

    if (!customerCategoriesMap.has(key)) {
      customerCategoriesMap.set(key, {
        name: item.name,
        phone: item.phone ? formatPhoneNumber(item.phone) : key,
        categories: new Set([item.project])
      });
    } else {
      customerCategoriesMap.get(key).categories.add(item.project);
    }
  }

  console.log("\n1. Resetting categories for non-list customers...");
  // Gather all valid phones / blank IDs from the lists
  const validListPhones = [];
  for (const [k, v] of customerCategoriesMap.entries()) {
    validListPhones.push(v.phone);
    const variants = getPhoneVariants(v.phone);
    validListPhones.push(...variants);
  }

  // Find customers with AURA/GOLD/DREAMLAND/ELEGANCE/ADITYA ST SOCIETY category who are NOT in the list
  const targets = ["AURA", "GOLD", "DREAMLAND", "ELEGANCE", "ADITYA ST SOCIETY"];
  const nonListCustomers = await Customer.find({
    category: { $in: targets },
    phone: { $nin: validListPhones }
  });

  console.log(`Found ${nonListCustomers.length} old/legacy customers tagged with targets. Resetting category to 'General'...`);
  for (const c of nonListCustomers) {
    c.category = "General";
    c.tags = (c.tags || []).filter(t => !targets.includes(t));
    await c.save();
  }

  console.log("\n2. Updating official list customers with exact categories & multi-category tags...");
  for (const [key, info] of customerCategoriesMap.entries()) {
    const catsArr = Array.from(info.categories);
    const primaryCat = catsArr[0];

    const variants = getPhoneVariants(info.phone);
    let cust = await Customer.findOne({ phone: { $in: variants } });
    if (!cust && key.startsWith("BLANK_")) {
      cust = await Customer.findOne({ phone: key });
    }

    if (cust) {
      cust.category = primaryCat;
      const mergedTags = new Set([...(cust.tags || []), ...catsArr]);
      cust.tags = Array.from(mergedTags);
      await cust.save();
      console.log(`✅ Updated ${cust.name} (${cust.phone}): Primary Category -> ${cust.category}, Tags -> ${JSON.stringify(cust.tags)}`);
    } else {
      // Create if missing
      cust = new Customer({
        phone: info.phone,
        name: info.name,
        category: primaryCat,
        tags: catsArr,
        source: "Official Import"
      });
      await cust.save();
      console.log(`➕ Created ${cust.name} (${cust.phone}): Primary Category -> ${cust.category}, Tags -> ${JSON.stringify(cust.tags)}`);
    }
  }

  console.log("\n=======================================================");
  console.log("📊 CATEGORY COUNTS VERIFICATION IN MONGO DB:");
  console.log("=======================================================");
  for (const cat of targets) {
    const countPrimary = await Customer.countDocuments({ category: cat });
    const countTags = await Customer.countDocuments({ tags: cat });
    const countTotal = await Customer.countDocuments({
      $or: [{ category: cat }, { tags: cat }]
    });
    console.log(`Category [${cat}]: Primary=${countPrimary} | Tagged=${countTags} | Unique Total=${countTotal}`);
  }

  process.exit(0);
}

fixProjectCategories();
