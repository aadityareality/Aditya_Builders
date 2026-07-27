import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Chat from "../models/Chat.js";
import { formatPhoneNumber, getPhoneVariants } from "../src/services/whatsappService.js";

const luxuriaOfficialList = [
  // --- Part 1 ---
  { name: "PARESHBHAI M PARMAR", phone: "8160624788" },
  { name: "RAJUBHAI K DEVMURARI", phone: "9426939553" },
  { name: "SONALBEN M AGARVAT", phone: "" },
  { name: "MAHIPALSINH SOLANKI", phone: "8238285656" },
  { name: "MAHIPALSINH SOLANKI", phone: "8238285656" },
  { name: "SONALBEN K RATHOD", phone: "" },
  { name: "RAKSHABEN A CHAUHAN", phone: "9510008318" },
  { name: "MANJULABEN P PITHADIYA", phone: "" },
  { name: "SHITALBEN V CHAUHAN", phone: "9104223355" },
  { name: "ILABEN Y KALSARA", phone: "9265900028" },
  { name: "RUPALBEN R JOSHI", phone: "8866767079" },
  { name: "MINABEN K GOHEL", phone: "" },
  { name: "ALPABEN T HEDAPARA", phone: "8980356651" },
  { name: "ALPABEN Y SIDDHPURA", phone: "9725753557" },
  { name: "DHARMISHTHABEN B DEVMURARI", phone: "9099862428" },
  { name: "SEJALBEN P LASHKARI", phone: "" },
  { name: "RAMESHBHAI SONI", phone: "9824857623" },
  { name: "SONALBEN V CHAUHAN", phone: "6351660044" },
  { name: "VIJAYBHAI GOHEL", phone: "9016389299" },
  { name: "SANGITABEN A MORI", phone: "9512143309" },
  { name: "CHANDRIKABEN NAKRANI", phone: "" },
  { name: "BHAVNABEN R YADAV", phone: "9824060373" },
  { name: "JAGRUIBEN CHAUHAN", phone: "9173093552" },
  { name: "ALPESH", phone: "8160451153" },
  { name: "TEJAS SHAH", phone: "9427212970" },
  { name: "NILESH PANDIT", phone: "9925091675" },
  { name: "BHAVESJ PANDIT", phone: "9712666100" },
  { name: "KIRAN PANDIT", phone: "9574883469" },
  { name: "SURESH PANDIT", phone: "9725356100" },
  { name: "CHANDU", phone: "9099479632" },
  { name: "HITESH BARAD", phone: "9979077017" },

  // --- Part 2 ---
  { name: "VIMAL CHAUHAN", phone: "9429503173" },
  { name: "HASMUKH JANI", phone: "7046472605" },
  { name: "RAMESH", phone: "9924618538" },
  { name: "PRATIK BHAVSAR", phone: "7265949494" },
  { name: "HARESH", phone: "8200732426" },
  { name: "KISHAN PRAJAPPATI", phone: "9974957394" },
  { name: "KRUNAL JOSHI", phone: "8460175160" },
  { name: "KISHOIR", phone: "9825242825" },
  { name: "ARVIND", phone: "9427337811" },
  { name: "DINESH VYAS", phone: "9428401681" },
  { name: "KEYUR JOSHI", phone: "8000877717" },
  { name: "JAYESH TRIVEDI", phone: "9427759238" },
  { name: "BIPINBHAI MEHTA", phone: "9925960771" },
  { name: "ARPITBHAI", phone: "9913866090" },
  { name: "SAMIR", phone: "7048336973" },
  { name: "JITENDRA", phone: "8980748403" },
  { name: "BHAGVANBHAI MORADIYA", phone: "9428205702" },
  { name: "CHANDUBHAI", phone: "9879807801" },
  { name: "MANOJ RATHOD", phone: "9925140157" },
  { name: "SANJAY PATEL", phone: "9723377131" },
  { name: "RAJENDRA", phone: "9624331215" },
  { name: "SANJAY PATEL", phone: "9558230201" },
  { name: "MAHESH SONI", phone: "9879037920" },
  { name: "KAUSHIK", phone: "7600054799" },
  { name: "HARSHSBEN", phone: "8866125943" },
  { name: "BHARGAV MEHTA", phone: "7016843050" },
  { name: "ANKIT", phone: "8866066804" },
  { name: "TRIVEDIBHAI", phone: "7202964060" },
  { name: "JITENDRTA", phone: "9712009096" },
  { name: "HARDIK MAKWANA", phone: "9347362772" },
  { name: "RAJU MISTRI", phone: "9469169962" },
  { name: "RAJESH PANDYA", phone: "9499808365" },
  { name: "MISTRIBHAI", phone: "6265919020" },
  { name: "PRAVIN BHATT", phone: "7778844827" },
  { name: "SHIVAM JANI", phone: "9677727201" },

  // --- Part 3 ---
  { name: "PIYUSH MANDLIK", phone: "9033336706" },
  { name: "MAHENDRA", phone: "9426940061" },
  { name: "NAVNITBHAI MISTRI", phone: "9426922734" },
  { name: "YOGESH", phone: "926590028" },
  { name: "VIRAL PANDYA", phone: "9828804640" },
  { name: "PANKAJ PATEL", phone: "9998476697" },
  { name: "MUKESHBHAI", phone: "9428183661" },
  { name: "JIGNABEN", phone: "9426548890" },
  { name: "ARVIND", phone: "9909277450" },
  { name: "DHARMESH", phone: "9099031918" },
  { name: "ASHOK DABHI", phone: "8000834647" },
  { name: "GAUTAMBHAU KUNJADIYA", phone: "7048170462" },
  { name: "RAVI", phone: "7878071818" },
  { name: "VIPUL THAKKAR", phone: "9429412080" },
  { name: "ASHOK DALVADIYA", phone: "9924833255" },
  { name: "JAY TRIVEDI", phone: "9725441470" },
  { name: "BIPINBHAI LAKHTARIYA", phone: "9737487431" },
  { name: "JAGDISHBHAI VALA", phone: "9824323605" },
  { name: "HARESH DHASA", phone: "9692350642" },
  { name: "TM RAGYAGURU", phone: "7076294388" },
  { name: "SUREKHA SHAH", phone: "9429639203" },
  { name: "RAVINDTA", phone: "9265695011" },
  { name: "HARSHDA", phone: "9426115666" },
  { name: "KISHANBHAI", phone: "9596221633" },
  { name: "JAGDISH GONDALIYA", phone: "9913753613" },
  { name: "RAHULBHAI", phone: "9723371648" },
  { name: "CHIRAG", phone: "6351660044" },
  { name: "JENTIBHAI PWD", phone: "9898969620" },
  { name: "PRAVINBHAI PATEL", phone: "9825205256" },
  { name: "JAY SONI", phone: "9512143309" },
  { name: "JAGDISH PARMAR", phone: "9879494917" },
  { name: "BHAVINBHAI", phone: "7048213032" },
  { name: "ASHOK BHATT", phone: "9723484313" },
  { name: "HASMUKH RATHOD", phone: "9574609010" },
  { name: "RAVI VEGAD", phone: "9537962151" },

  // --- Part 4 ---
  { name: "RAMESH SONI", phone: "9824857629" },
  { name: "SHAILESH BARAIYA", phone: "9149964183" },
  { name: "NARESH MEHTA", phone: "9879577579" },
  { name: "HIMANSHU JOSHI", phone: "8866300350" },
  { name: "NIMESH NAGRA", phone: "9574008090" },
  { name: "MUKESH SARVAIYA", phone: "9824526970" },
  { name: "VIRAJ LANIYA", phone: "9924248257" },
  { name: "JAYESH CHAUHAN", phone: "7600351508" },
  { name: "PARAS VYAS", phone: "9265886419" },
  { name: "JITU CHAUHAN", phone: "9723080338" },
  { name: "DILIP JOSJI", phone: "9925895775" },
  { name: "BHARAT DARJI", phone: "9998077438" },
  { name: "NILESH LADANI", phone: "9925058286" },
  { name: "SHANDHYABEN BALADHIYA", phone: "8154961962" },
  { name: "DINESH MAJETHUA", phone: "7435916010" },
  { name: "PANKAJBHAI DISHANI", phone: "9913387838" },
  { name: "HARESH PANDYA", phone: "8849955942" },
  { name: "BALUBHAI MAKVANA", phone: "9067441661" }
];

async function updateLuxuriaList() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Map each customer by phone or blank key
  const luxuriaPhoneMap = new Map();
  for (const item of luxuriaOfficialList) {
    let cleanPhone;
    if (!item.phone || item.phone.trim() === "") {
      cleanPhone = `BLANK_${item.name.replace(/\s+/g, "_")}`;
    } else {
      cleanPhone = formatPhoneNumber(item.phone);
    }

    if (!luxuriaPhoneMap.has(cleanPhone)) {
      luxuriaPhoneMap.set(cleanPhone, {
        name: item.name,
        phone: cleanPhone
      });
    }
  }

  console.log(`\n=======================================================`);
  console.log(`Total Official LUXURIA Entries: ${luxuriaOfficialList.length}`);
  console.log(`Unique LUXURIA Phone Numbers / Blank Entries: ${luxuriaPhoneMap.size}`);
  console.log(`=======================================================`);

  // Gather all valid phones for LUXURIA
  const validLuxuriaPhones = [];
  for (const [k, v] of luxuriaPhoneMap.entries()) {
    validLuxuriaPhones.push(v.phone);
    const variants = getPhoneVariants(v.phone);
    validLuxuriaPhones.push(...variants);
  }

  // 1. Reset old LUXURIA contacts in DB not in the new list to General
  const nonListLuxuria = await Customer.find({
    category: "LUXURIA",
    phone: { $nin: validLuxuriaPhones }
  });

  console.log(`\nFound ${nonListLuxuria.length} old/legacy LUXURIA contacts in DB not in new list. Resetting category to 'General'...`);
  for (const c of nonListLuxuria) {
    c.category = "General";
    c.tags = (c.tags || []).filter(t => t !== "LUXURIA");
    await c.save();
  }

  // 2. Upsert official 119 LUXURIA contacts into DB
  let createdCount = 0;
  let updatedCount = 0;
  let blankAddedCount = 0;

  for (const [cleanPhone, info] of luxuriaPhoneMap.entries()) {
    const isBlank = cleanPhone.startsWith("BLANK_");
    const variants = isBlank ? [cleanPhone] : getPhoneVariants(cleanPhone);

    let cust = await Customer.findOne({ phone: { $in: variants } });

    if (cust) {
      cust.category = "LUXURIA";
      const mergedTags = new Set([...(cust.tags || []), "LUXURIA"]);
      cust.tags = Array.from(mergedTags);
      await cust.save();
      updatedCount++;
    } else {
      cust = new Customer({
        name: isBlank ? `${info.name} (No Phone Number)` : info.name,
        phone: cleanPhone,
        category: "LUXURIA",
        tags: ["LUXURIA"],
        source: "Official LUXURIA Import",
        notes: isBlank ? "Phone number blank in official LUXURIA list" : ""
      });
      await cust.save();

      // Ensure Chat document exists
      let chat = await Chat.findOne({ customer: cust._id });
      if (!chat) {
        await Chat.create({ customer: cust._id, status: "Open" });
      }

      createdCount++;
      if (isBlank) blankAddedCount++;
    }
  }

  const finalLuxuriaCount = await Customer.countDocuments({
    $or: [{ category: "LUXURIA" }, { tags: "LUXURIA" }]
  });

  console.log(`\n=======================================================`);
  console.log(`📊 LUXURIA UPDATE SUMMARY:`);
  console.log(`=======================================================`);
  console.log(`- Official LUXURIA Entries: ${luxuriaOfficialList.length}`);
  console.log(`- Newly Created Contacts: ${createdCount} (including ${blankAddedCount} blank phone entries)`);
  console.log(`- Updated Existing Contacts: ${updatedCount}`);
  console.log(`- Exact LUXURIA Contacts in DB Now: ${finalLuxuriaCount}`);

  process.exit(0);
}

updateLuxuriaList();
