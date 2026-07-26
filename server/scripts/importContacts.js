import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Customer from "../models/Customer.js";

const auraContacts = [
  { name: "KARANSINH R CHAVDA", phone: "9574146126" },
  { name: "KAHANSINH R CHAVDA", phone: "9328034495" },
  { name: "NIRAJBHAI K PALL", phone: "9528874669" },
  { name: "MAYURBHAI S BHAMANI", phone: "8141055621" },
  { name: "MAYURBHAI S BHAMANI", phone: "8141055621" },
  { name: "DIGPALSINH S JADEJA", phone: "9726272848" },
  { name: "ASHOKBHAI PRAJAPATI", phone: "9998100946" },
  { name: "ILABEN J MASANI", phone: "7046474855" },
  { name: "JALPABEN N SOLANKI", phone: "8320990890" },
  { name: "BHAGIRATHSINH K RATHOD", phone: "9106818243" },
  { name: "VISHALBHAI D SARVAIYA", phone: "8128444480" },
  { name: "LAXMIBEN M RAO", phone: "9429074850" },
  { name: "HITENDRA B GOHIL", phone: "7874629906" },
  { name: "KAVITAKUMARI", phone: "9724097382" },
  { name: "HARPALSINH KUNCHALA", phone: "7874717271" },
  { name: "SHAILESHBHAI R PRAJAPATI", phone: "9824392694" },
  { name: "KAILASHBEN N JADEJA", phone: "7046198111" },
  { name: "TRUSHARGIRI GOUSWAMI", phone: "9426495858" },
  { name: "KAILASHBEN J VORA", phone: "7046375858" },
  { name: "PRASHANTBHAI CHAUHAN", phone: "9904020010" },
  { name: "VIKRAMBHAI SHETHAVAR", phone: "9979906383" },
  { name: "DHANMANTIBEN CHAND", phone: "9904020010" },
  { name: "PARTHBHAI C GOHIL", phone: "8140346418" },
  { name: "ALKESHBHAI GOUSHWAMI", phone: "8866985500" },
  { name: "RAVIKANT G BHATT", phone: "9558406496" },
  { name: "RAHULBHAI B SOLANKI", phone: "9714238989" },
  { name: "HITESHBHAI G GOHIL", phone: "9426343038" },
  { name: "NIKUNJBHAI RAJYAGURU", phone: "8780030419" },
  { name: "HIREN M CHAUHAN", phone: "9725870304" },
  { name: "KAILASHBEN K BALDANIYA", phone: "9586410581" },
  { name: "VIVEKBHAI V ACHARYA", phone: "7436060636" },
  { name: "DHARMIK A RAV", phone: "7984447320" },
  { name: "BHADRESHBHAI VARAIYA", phone: "7016328335" },
  { name: "SHIVAMBHAI VARAIYA", phone: "7016328335" },
  { name: "HIRENBHAI A GOHIL", phone: "8140591415" }
];

const skylineContacts = [
  // Page 1
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

  // Page 2
  { name: "SANJAYBHAI JAMAN", phone: "9723414215" },
  { name: "DARSHANBHAI MEHTA", phone: "9328006862" },
  { name: "ALPESHBHAI DODIYA", phone: "9316298170" },
  { name: "DAVEBHAI", phone: "9809805098" },
  { name: "SANJAYBHAI", phone: "7780323636" },
  { name: "KISHANBHAI", phone: "9586221633" },
  { name: "JAYESHBHAI CHAUHAN", phone: "7600351508" },
  { name: "JAYESHBHAI SHAH", phone: "9825707419" },
  { name: "RAJUBHAI BAROT", phone: "9099934891" },
  { name: "JIGNESHBHAI PARIKH", phone: "9377553848" },
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
  { name: "DHRUVDEEPSINH PARMAR", phone: "7778885484" },
  { name: "RAJESHBHAI GOHIL", phone: "8990971570" },
  { name: "DHIRUBHAI PARMAR", phone: "9428641693" },
  { name: "PANKAJBHAI GAUSHWAMI", phone: "9624884098" },
  { name: "VIJAYBHAI SHASHTRI", phone: "8320465697" },
  { name: "RAVIRAJSINH VEGAD", phone: "9537962191" },
  { name: "MUKESHBHAI DALOLIYA", phone: "7600213122" },
  { name: "PARTHBHAI DIHORA", phone: "9723854262" },
  { name: "MAHENDARBHAI RAVAL", phone: "9377462142" },
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

  // Page 3
  { name: "ASHVINBHAI GAUSHWAMI", phone: "9924019766" },
  { name: "PRAJAPATIBHAI", phone: "9427338811" },
  { name: "JAYBHAI KOTHARI", phone: "9662720326" },
  { name: "VANANDBHAI", phone: "9913387838" },
  { name: "NATUBHAI OZA", phone: "9974795595" },
  { name: "RAJUBHAI DARJI", phone: "9429552633" },
  { name: "UJALA SHREVASTAV", phone: "7383949088" },
  { name: "VISHALBHAI JOSHI", phone: "9265788040" },
  { name: "SAGARBHAI VAGHELA", phone: "9376829830" },
  { name: "HERILALMENA", phone: "9632770162" },
  { name: "MAYURBHAI MAKWANA", phone: "8734873410" },
  { name: "NIKUNJBHAI", phone: "9925134779" },
  { name: "ARVINDBHAI GAUSHWAMI", phone: "9809277450" },
  { name: "SANJAYBHAI RATHOD", phone: "903351818" },
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
  { name: "ARVINDBHAI", phone: "9328442841" },
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

  // Page 4
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

const run = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGODB_URI missing");

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);

    console.log(`Importing ${auraContacts.length} AURA contacts...`);
    let auraCount = 0;
    for (const c of auraContacts) {
      if (!c.phone || c.phone.trim().length < 10) continue;
      const cleanPhone = "91" + c.phone.replace(/[^0-9]/g, "").slice(-10);
      await Customer.updateOne(
        { phone: cleanPhone },
        {
          $set: {
            name: c.name.trim(),
            phone: cleanPhone,
            category: "AURA",
            source: "Imported"
          }
        },
        { upsert: true }
      );
      auraCount++;
    }
    console.log(`✅ ${auraCount} AURA contacts imported!`);

    console.log(`Importing ${skylineContacts.length} SKYLINE contacts...`);
    let skylineCount = 0;
    for (const c of skylineContacts) {
      if (!c.phone || c.phone.trim().length < 10) continue;
      const cleanPhone = "91" + c.phone.replace(/[^0-9]/g, "").slice(-10);
      await Customer.updateOne(
        { phone: cleanPhone },
        {
          $set: {
            name: c.name.trim(),
            phone: cleanPhone,
            category: "SKYLINE",
            source: "Imported"
          }
        },
        { upsert: true }
      );
      skylineCount++;
    }
    console.log(`✅ ${skylineCount} SKYLINE contacts imported!`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Import error:", err);
    process.exit(1);
  }
};

run();
