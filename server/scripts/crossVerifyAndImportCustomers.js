import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import { formatPhoneNumber, getPhoneVariants } from "../src/services/whatsappService.js";

const clientLists = [
  // --- AURA ---
  { project: "AURA", name: "KARANSINH R CHAVDA", phone: "9574146126" },
  { project: "AURA", name: "KAHANSINH R CHAVDA", phone: "9328034495" },
  { project: "AURA", name: "NIRAJBHAI K PALL", phone: "9528874669" },
  { project: "AURA", name: "MAYURBHAI S BHAMANI", phone: "8141055621" },
  { project: "AURA", name: "MAYURBHAI S BHAMANI", phone: "8141055621" }, // duplicate in list
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
  { project: "AURA", name: "DHANMANTIBEN CHAND", phone: "9904020010" }, // shared phone
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
  { project: "AURA", name: "SHIVAMBHAI VARAIYA", phone: "7016328335" }, // shared phone
  { project: "AURA", name: "HIRENBHAI A GOHIL", phone: "8140591415" },

  // --- GOLD ---
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

  // --- DREAMLAND ---
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
  { project: "DREAMLAND", name: "MAYURBHAI PRAJAPATI", phone: "9376225662" }, // shared phone
  { project: "DREAMLAND", name: "PARESHBHAI PARMAR", phone: "9727404896" },
  { project: "DREAMLAND", name: "MUKESHBHAI WAGHESHWARI", phone: "9879340577" },
  { project: "DREAMLAND", name: "MUKESHGIRI", phone: "9879340577" }, // shared phone
  { project: "DREAMLAND", name: "MAHESHBHAI UPADHYAY", phone: "" }, // BLANK phone!
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

  // --- ADITYA ST SOCIETY ---
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

  // --- ELEGANCE ---
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

async function crossVerifyAndImport() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Group by phone to find multi-name numbers
  const phoneMap = {};
  for (const item of clientLists) {
    if (!item.phone) continue;
    const cleanP = formatPhoneNumber(item.phone);
    if (!phoneMap[cleanP]) phoneMap[cleanP] = [];
    phoneMap[cleanP].push(item);
  }

  console.log("\n=======================================================");
  console.log("🔍 MULTI-NAME / SHARED PHONE NUMBERS IN LIST:");
  console.log("=======================================================");
  const sharedNumbers = [];
  for (const [phone, entries] of Object.entries(phoneMap)) {
    const uniqueNames = [...new Set(entries.map(e => e.name))];
    if (uniqueNames.length > 1) {
      console.log(`Phone: ${phone} -> Shared by ${uniqueNames.length} names: ${uniqueNames.join(" & ")} (Projects: ${[...new Set(entries.map(e => e.project))].join(", ")})`);
      sharedNumbers.push({ phone, names: uniqueNames, entries });
    }
  }

  console.log("\n=======================================================");
  console.log("🔄 CROSS-VERIFYING AND UPSERTING CUSTOMERS IN MONGO DB:");
  console.log("=======================================================");

  let newlyAddedCount = 0;
  let updatedCount = 0;
  let blankNumberAddedCount = 0;

  for (const item of clientLists) {
    // If phone is blank
    if (!item.phone || item.phone.trim() === "") {
      const blankPhone = `BLANK_${item.name.replace(/\s+/g, "_")}`;
      let cust = await Customer.findOne({ phone: blankPhone });
      if (!cust) {
        cust = new Customer({
          phone: blankPhone,
          name: `${item.name} (No Phone Number)`,
          source: "Manual Import",
          leadStatus: "New",
          stage: "New",
          notes: `Project: ${item.project} (Phone number blank in client sheet)`
        });
        await cust.save();
        newlyAddedCount++;
        blankNumberAddedCount++;
        console.log(`➕ Added Blank Phone Customer: ${cust.name} [Project: ${item.project}]`);
      } else {
        console.log(`✓ Blank Phone Customer already in DB: ${cust.name}`);
      }
      continue;
    }

    const cleanPhone = formatPhoneNumber(item.phone);
    const variants = getPhoneVariants(cleanPhone);

    let customer = await Customer.findOne({ phone: { $in: variants } });
    if (!customer) {
      // Create new Customer
      customer = new Customer({
        phone: cleanPhone,
        name: item.name,
        source: "Manual Import",
        leadStatus: "New",
        stage: "New",
        notes: `Project: ${item.project}`
      });
      await customer.save();

      // Ensure Chat document exists
      let chat = await Chat.findOne({ customer: customer._id });
      if (!chat) {
        await Chat.create({ customer: customer._id, status: "Open" });
      }

      newlyAddedCount++;
      console.log(`➕ Added New Customer: ${item.name} (${cleanPhone}) [Project: ${item.project}]`);
    } else {
      // Update existing customer name/notes if missing project
      let updated = false;
      if (!customer.notes || !customer.notes.includes(item.project)) {
        customer.notes = customer.notes ? `${customer.notes} | Project: ${item.project}` : `Project: ${item.project}`;
        updated = true;
      }
      if (updated) {
        await customer.save();
        updatedCount++;
        console.log(`✏️ Updated Customer Info: ${customer.name} (${customer.phone}) -> Added Project ${item.project}`);
      } else {
        console.log(`✓ Verified existing Customer: ${customer.name} (${customer.phone}) [Project: ${item.project}]`);
      }
    }
  }

  const totalInDb = await Customer.countDocuments();
  console.log("\n=======================================================");
  console.log("📊 IMPORT & CROSS-VERIFICATION SUMMARY:");
  console.log("=======================================================");
  console.log(`- Total Entries Processed: ${clientLists.length}`);
  console.log(`- Newly Created Customers: ${newlyAddedCount}`);
  console.log(`- Existing Customers Updated: ${updatedCount}`);
  console.log(`- Customers Added with Blank Phone Number: ${blankNumberAddedCount}`);
  console.log(`- Shared / Multi-Name Phone Numbers Found: ${sharedNumbers.length}`);
  console.log(`- Total Customers in Database Now: ${totalInDb}`);

  process.exit(0);
}

crossVerifyAndImport();
