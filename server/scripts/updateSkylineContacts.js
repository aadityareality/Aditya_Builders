import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import { formatPhoneNumber, getPhoneVariants } from "../src/services/whatsappService.js";

const skylineOfficialList = [
  // --- Part 1 ---
  { name: "KHIMJIBHAI KALUBHAI", phone: "9427886515" },
  { name: "GHANSHYAMSINH TANK", phone: "9925223657" },
  { name: "KANUBHAI PANDYA", phone: "9978985941" },
  { name: "VALLABHBHAI VALA", phone: "7046103733" },
  { name: "JAYRAJSINH VALA", phone: "8866319984" },
  { name: "JUVANSANGBHAI VALA", phone: "9375767005" },
  { name: "RAJUBHAI DAVE", phone: "9825237070" },
  { name: "MAHIPATSINH PARMAR", phone: "9925563900" },
  { name: "RAMJIBHAI BHATTI", phone: "9725739763" },
  { name: "KAUSHIKBHAI PRAJAPATI", phone: "7802029302" },
  { name: "GOPALBHAI SOLANKI", phone: "9737698634" },
  { name: "JAYBHAI GADHVI", phone: "9376712424" },
  { name: "RAMESHBHAI BHANBHANIYA", phone: "9725427189" },
  { name: "RAMDEVSINH RATHOD", phone: "8264323232" },
  { name: "VIMALBHAI PARMAR", phone: "9016263629" },
  { name: "GAUTAMBHAI MISTRI", phone: "9173703006" },
  { name: "VIKRAMBHAI GOHEL", phone: "9825685068" },
  { name: "DINESHBHAI RATHOD", phone: "9925862234" },
  { name: "DHARMIKBHAI PATEL", phone: "9930168972" },
  { name: "SANJAYBHAI MAKWANA", phone: "7777940904" },
  { name: "NARESHBHAI DABHI", phone: "9601714071" },
  { name: "PRAKASHSINH", phone: "7567619656" },
  { name: "MITULBHAI VALA", phone: "9898855818" },
  { name: "JENTIBHAI MISTRI", phone: "9725846900" },
  { name: "BATUKBHAI DOBARIYA", phone: "9825205256" },
  { name: "DINESHBHAI DHANDHUKIYA", phone: "9909108550" },
  { name: "VIRALBHAI PANDYA", phone: "9824804640" },
  { name: "MALIBHAI", phone: "9484477561" },
  { name: "SANDIPBHAI RATHOD", phone: "6355030653" },
  { name: "BHARGAVBHAI SOLANKI", phone: "9924994646" },
  { name: "BHALABHAI", phone: "9924999482" },

  // --- Part 2 ---
  { name: "SAHDEVSINH VALA", phone: "7734910262" },
  { name: "RANJITBHAI SHIYAL", phone: "9904764729" },
  { name: "RAJESHBHAI MAKWANA", phone: "9624166464" },
  { name: "JITUBHAI RATHOD", phone: "8460482250" },
  { name: "RM DAVE", phone: "9925511330" },
  { name: "ASVINBHA", phone: "9879485597" },
  { name: "HARDIKBHAI PARMAR", phone: "7778829853" },
  { name: "PANKAJBHAI RATHOD", phone: "7043030640" },
  { name: "GOPALBHAI RATHOD", phone: "9904585756" },
  { name: "PRAVINBHAI PARMAR", phone: "6353289137" },
  { name: "DIPAKBHAI MANDALAK", phone: "9265401121" },
  { name: "RAMESHVARAMBHAI LASHKARBHAI", phone: "9104249090" },
  { name: "AJAYBHAI PRAJAPATI", phone: "9173379857" },
  { name: "PINTUBHAI SHIYAL", phone: "9328311474" },
  { name: "PRAVINBHAI KOBADI", phone: "9374012216" },
  { name: "SANJAYBHAI JAMAN", phone: "9723414215" },
  { name: "DARSHANBHAI MEHTA", phone: "9328006862" },
  { name: "ALPESHBHAI DODIYA", phone: "9316298170" },
  { name: "DAVEBHAI", phone: "9809805098" },
  { name: "SANJAYBHAI", phone: "7780323636" },
  { name: "KISHANBHAI", phone: "9586221633" },
  { name: "JAYESHBHAI CHAUHAN", phone: "7600351508" },
  { name: "JAYESHBHAI SHAH", phone: "9825707419" },
  { name: "RAJUBHAI BAROT", phone: "9099934891" },
  { name: "JIGNESHBHA PARIKH", phone: "9377553848" },
  { name: "MANMOHAK JUNJAR", phone: "9649047557" },
  { name: "RAJESHBHAIKUMAR", phone: "9724097382" },
  { name: "RAVI PITHVA", phone: "7201886737" },
  { name: "VISHALBHAI DABHI", phone: "9173775351" },
  { name: "VIJAYBHAI SONI", phone: "9879799635" },
  { name: "DINESHBHAI MOJIDRA", phone: "7435916010" },
  { name: "VALLABHBHAI", phone: "7046103133" },
  { name: "VIPULBHAI SOLANKI", phone: "8460815585" },
  { name: "JAYBHAI RAVAL", phone: "7990154694" },
  { name: "YOGESHBHAI MISTRI", phone: "8140747220" },

  // --- Part 3 ---
  { name: "DHRUVDEEPSINH PARMAR", phone: "7778885484" },
  { name: "RAJESHBHAI GOHIL", phone: "8990971570" },
  { name: "DHIRUBHAI PARMAR", phone: "9428641693" },
  { name: "PANKAJBHAI GAUSHWAMI", phone: "9624884098" },
  { name: "VIJAYBHAI SHASHTRI", phone: "8320465697" },
  { name: "RAVIRAJSINH VEGAD", phone: "9537962191" },
  { name: "MUKESHBHAI DALOLIYA", phone: "7600213122" },
  { name: "PARTHBHAI DIHORA", phone: "9723854262" },
  { name: "MAHENDRA RAVAL", phone: "9377462142" },
  { name: "SANDIPBHAI YADAV", phone: "8390217777" },
  { name: "BHAVSANGBHAI MAKWANA", phone: "7435013572" },
  { name: "HARDIKBHAI CHITRODA", phone: "8980193340" },
  { name: "BHUDHELIYA DISHANT", phone: "7984064423" },
  { name: "KRUPAK CHAUHAN", phone: "9313927692" },
  { name: "PRAKASHABHAI DAVE", phone: "9197189566" },
  { name: "JAYVIRBHAI CHAVDA", phone: "9510787875" },
  { name: "MAYABHAI", phone: "9909094538" },
  { name: "MEHULBHAI", phone: "8460280083" },
  { name: "AJAYBHAI TRIVEDI", phone: "7073247038" },
  { name: "KIRITBHAI JOSHI", phone: "9714119128" },
  { name: "MEGHABEN JANI", phone: "9328222652" },
  { name: "RUSHITBHAI PAREKH", phone: "9909745035" },
  { name: "DIGVIJAYBHAI CHAUHAN", phone: "9426807373" },
  { name: "KRITIKABEN SHARMA", phone: "7984031569" },
  { name: "RAVIKANTBHAI KAVA", phone: "9023289955" },
  { name: "DIMPAKBEN JAGAD", phone: "9375883516" },
  { name: "MUKESHBHAI SOLANKI", phone: "9904373325" },
  { name: "MAYURBHAI SARVAIYA", phone: "8780155796" },
  { name: "KETANBHAI BARAIYA", phone: "9512142750" },
  { name: "RAKESHBHAI SOLANKI", phone: "9510979899" },
  { name: "ASHVINBHAI GAUSHWAMI", phone: "9924019766" },
  { name: "PRAJAPATIBHAI", phone: "9427338811" },
  { name: "JAYBHAI KOTHARI", phone: "9662720326" },
  { name: "VANANDBHAI", phone: "9913387838" },
  { name: "NATUBHAI OZA", phone: "9974795595" },

  // --- Part 4 ---
  { name: "RAJUBHAI DARJI", phone: "9429552633" },
  { name: "UJALA SHREVASTAV", phone: "7383949088" },
  { name: "VISHALBHAI JOSHI", phone: "9265788040" },
  { name: "SAGARBHAI VAGHELA", phone: "9376829830" },
  { name: "HERILALMENA", phone: "9632770162" },
  { name: "MAYURBHAI MAKWANA", phone: "8734873410" },
  { name: "NIKUNJBHAI", phone: "9925134779" },
  { name: "ARVINDBHAI GAUSHWAMI", phone: "9809277450" },
  { name: "SANJAYBHAI RATHOD", phone: "9033518181" },
  { name: "KHIMJIBHAI KALUBHAI", phone: "9427886515" },
  { name: "NARESHBHAI MAKWANA", phone: "9723483680" },
  { name: "ATULDADA DR", phone: "9824448871" },
  { name: "VISHALBHAI BARAIYA", phone: "9909027670" },
  { name: "NANDKISHOR DAVE", phone: "9925513701" },
  { name: "KARAN VAGHELA", phone: "9998271333" },
  { name: "DISHANT BARAIYA", phone: "9998155352" },
  { name: "DHARMENDRA JOSHI", phone: "7016535919" },
  { name: "BHARATBHAI PARMAR", phone: "9106707026" },
  { name: "SHAMBHUBHAI PANDYA", phone: "8000480662" },
  { name: "MONIT RAVAL", phone: "9723212177" },
  { name: "PARAS", phone: "9426661815" },
  { name: "GHANSHYABH JOSJI", phone: "6352973002" },
  { name: "ARVINBHAI", phone: "9328442841" },
  { name: "VIPULBHAI DR", phone: "9664971578" },
  { name: "ALPESHBHAI KAPDI", phone: "9729094638" },
  { name: "SHAILESHBHAI", phone: "9824777746" },
  { name: "PRAKASHBHAI DAVE", phone: "9157189566" },
  { name: "JAGDISBHAI GAUSHWAMI", phone: "9099356306" },
  { name: "DR SHIRISHBHAI", phone: "9428182695" },
  { name: "HARENDRA", phone: "9409183818" },
  { name: "KALPESHBHAI", phone: "8980739623" },
  { name: "BIPINBHAI MAKWANA", phone: "9722922908" },
  { name: "DANDRAMBHAI", phone: "7359593059" },
  { name: "JAYPALBHAI MAJETHIYA", phone: "9660916010" },
  { name: "ABHISHEKBHAI JANI", phone: "9974690744" },

  // --- Part 5 ---
  { name: "UPENDRA JOSSHI", phone: "9327607493" },
  { name: "MEHULBHAI", phone: "7990808983" },
  { name: "ARTIBEN BHATT", phone: "9429582252" },
  { name: "HARMI PARMAR", phone: "7383866926" },
  { name: "MITESH", phone: "8866169145" },
  { name: "ABHAY BHATT", phone: "8511077229" },
  { name: "VINOD VYAS", phone: "9824455818" },
  { name: "JITUBHAI DODIYA", phone: "9909894300" },
  { name: "ALKESH MEHTA", phone: "9106570110" },
  { name: "MANTHAN JANI", phone: "7567698523" },
  { name: "MAHUKH", phone: "9924524951" },
  { name: "VISHALBHAI", phone: "9925562939" },
  { name: "BHAUMIKBHAI TRIVEDI", phone: "9106167228" },
  { name: "HITESH GADHVI", phone: "7780406262" },
  { name: "ASHISBHAI", phone: "9586529106" },
  { name: "TRUPTI ROBOTBHAI", phone: "9316397070" },
  { name: "DHARMIK SOLANKI", phone: "9327898512" },
  { name: "KRUNAL RAJGOR", phone: "9265703092" },
  { name: "KUCHA DIPAK", phone: "7698016972" },
  { name: "SHANKAR SOLANKI", phone: "9714061437" },
  { name: "HASMUKH CHITRODA", phone: "9924594950" },
  { name: "DHAVAL", phone: "9497060349" },
  { name: "SANJAY BHAI", phone: "9714578181" }
];

async function updateSkylineList() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Build unique phones set and map
  const skylinePhoneMap = new Map();
  for (const item of skylineOfficialList) {
    let cleanPhone;
    if (!item.phone || item.phone.trim() === "") {
      cleanPhone = `BLANK_${item.name.replace(/\s+/g, "_")}`;
    } else {
      cleanPhone = formatPhoneNumber(item.phone);
    }
    
    if (!skylinePhoneMap.has(cleanPhone)) {
      skylinePhoneMap.set(cleanPhone, {
        name: item.name,
        phone: cleanPhone,
        rawPhone: item.phone
      });
    }
  }

  console.log(`\n=======================================================`);
  console.log(`Total Official SKYLINE Entries: ${skylineOfficialList.length}`);
  console.log(`Unique SKYLINE Phone Numbers / Entries: ${skylinePhoneMap.size}`);
  console.log(`=======================================================`);

  // Gather all valid phones for SKYLINE
  const validSkylinePhones = [];
  for (const [k, v] of skylinePhoneMap.entries()) {
    validSkylinePhones.push(v.phone);
    const variants = getPhoneVariants(v.phone);
    validSkylinePhones.push(...variants);
  }

  // 1. Reset old fake/sample SKYLINE customers who are NOT in the official list
  const nonListSkyline = await Customer.find({
    category: "SKYLINE",
    phone: { $nin: validSkylinePhones }
  });

  console.log(`\nFound ${nonListSkyline.length} old/legacy SKYLINE contacts in DB not in new list. Resetting category to 'General'...`);
  for (const c of nonListSkyline) {
    c.category = "General";
    c.tags = (c.tags || []).filter(t => t !== "SKYLINE");
    await c.save();
  }

  // 2. Upsert official 159 SKYLINE contacts into DB
  let createdCount = 0;
  let updatedCount = 0;

  for (const [cleanPhone, info] of skylinePhoneMap.entries()) {
    const variants = getPhoneVariants(cleanPhone);
    let cust = await Customer.findOne({ phone: { $in: variants } });
    if (!cust && cleanPhone.startsWith("BLANK_")) {
      cust = await Customer.findOne({ phone: cleanPhone });
    }

    if (cust) {
      cust.name = info.name;
      cust.category = "SKYLINE";
      const mergedTags = new Set([...(cust.tags || []), "SKYLINE"]);
      cust.tags = Array.from(mergedTags);
      await cust.save();
      updatedCount++;
    } else {
      cust = new Customer({
        name: info.name,
        phone: cleanPhone,
        category: "SKYLINE",
        tags: ["SKYLINE"],
        source: "Official SKYLINE Import"
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

  const finalSkylineCount = await Customer.countDocuments({
    $or: [{ category: "SKYLINE" }, { tags: "SKYLINE" }]
  });

  console.log(`\n=======================================================`);
  console.log(`📊 SKYLINE UPDATE SUMMARY:`);
  console.log(`=======================================================`);
  console.log(`- Official SKYLINE Entries: ${skylineOfficialList.length}`);
  console.log(`- Newly Created Contacts: ${createdCount}`);
  console.log(`- Updated Existing Contacts: ${updatedCount}`);
  console.log(`- Exact SKYLINE Contacts in DB Now: ${finalSkylineCount}`);

  process.exit(0);
}

updateSkylineList();
