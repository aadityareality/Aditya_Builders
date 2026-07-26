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
  { name: "SHUBHAM G CHUDASAMA", phone: "7405391200" },
  { name: "SUBHASHBHAI B CHAUHAN", phone: "9426989487" },
  { name: "MAYURBHAI P BARAIYA", phone: "9313580556" },
  { name: "CHETANBHAI M VAGHELA", phone: "9033320290" },
  { name: "JAYDIPBHAI S MAKWANA", phone: "9898982362" },
  { name: "MANSUKHBHAI J VALA", phone: "9426282860" },
  { name: "SMITBHAI M JANI", phone: "9408640101" },
  { name: "MANHARBHAI S PATEL", phone: "9979929288" },
  { name: "RAMNIKBHAI D RATHOD", phone: "9824280540" },
  { name: "MITTALBEN D SHAH", phone: "8460670001" },
  { name: "JAYSUKHBHAI S GOTI", phone: "9428599427" },
  { name: "BHARATBHAI H PAREKH", phone: "9426992994" },
  { name: "VALJIBHAI B BALDaniya", phone: "9428456100" },
  { name: "MAHENDRABHAI K SOLANKI", phone: "9925232757" },
  { name: "NIMESSHBHAI M SHAH", phone: "9825206385" },
  { name: "NIPULBHAI B SHAH", phone: "9825206386" },
  { name: "PARESHBHAI R DESAI", phone: "9427282850" }
];

const skylineContacts = [
  // Page 1
  { name: "MAHENDRABHAI S PARMAR", phone: "9408620244" },
  { name: "VANESHBHAI J DAVE", phone: "9428040409" },
  { name: "VIPULBHAI H RAMANI", phone: "9909244099" },
  { name: "CHANDUBHAI S KHENI", phone: "9979140411" },
  { name: "JAYESHKUMAR B MEHTA", phone: "9428004545" },
  { name: "VIPULBHAI C BHALANI", phone: "9825205562" },
  { name: "SANJAYBHAI G MATHUR", phone: "9825207788" },
  { name: "GOPALBHAI D VORA", phone: "9825207010" },
  { name: "PRAKASHBHAI N KAMANI", phone: "9825208899" },
  { name: "HARSHADBHAI P JANI", phone: "9428001122" },
  { name: "BHARATBHAI R DER", phone: "9825203344" },
  { name: "KETANBHAI M DESAI", phone: "9428006677" },
  { name: "CHINTANBHAI S SHAH", phone: "9825209988" },
  { name: "NILESHBHAI K PATEL", phone: "9428002233" },
  { name: "DIPAKBHAI V JOSHI", phone: "9825204455" },
  { name: "PARESHBHAI T TRIVEDI", phone: "9428005566" },
  { name: "RAKESHBHAI A SHAH", phone: "9825201122" },
  { name: "ALPESHBHAI D SOLANKI", phone: "9428008899" },
  { name: "MANISHBHAI R VAGHELA", phone: "9825207766" },
  { name: "HITESHBHAI P GOHIL", phone: "9428003344" },
  { name: "BHAVESHBHAI M CHAVDA", phone: "9825205544" },
  { name: "JIGNESHBHAI K MAKWANA", phone: "9428007788" },
  { name: "KIRTIBHAI S RATHOD", phone: "9825202211" },
  { name: "DHARMESHBHAI B PARMAR", phone: "9428009900" },
  { name: "HARESHBHAI L JADEJA", phone: "9825206655" },
  { name: "SURESHBHAI N BARAIYA", phone: "9428004411" },
  { name: "MAHESHBHAI C KAKIYA", phone: "9825208833" },
  { name: "ASHOKBHAI G CHUDASAMA", phone: "9428001144" },
  { name: "PANKAJBHAI D SARVAIYA", phone: "9825203322" },
  { name: "VIJAYBHAI R VALA", phone: "9428005533" },
  { name: "SANJAYBHAI T MARU", phone: "9825207744" },
  { name: "MUKESHBHAI V CHAVDA", phone: "9428002255" },
  { name: "DINESHBHAI P SOLANKI", phone: "9825209911" },
  { name: "KAMLESHBHAI K RATHOD", phone: "9428006622" },

  // Page 2
  { name: "ANILBHAI S GOHIL", phone: "9825204433" },
  { name: "SUNILBHAI M JADEJA", phone: "9428008855" },
  { name: "PRADIPBHAI R MAKWANA", phone: "9825201166" },
  { name: "DEVANGHA B DAVE", phone: "9428003388" },
  { name: "RAJULBEN K PATEL", phone: "9825205511" },
  { name: "SHILPABEN M SHAH", phone: "9428007733" },
  { name: "MEENABEN P TRIVEDI", phone: "9825202244" },
  { name: "GEETABEN R CHAVDA", phone: "9428009966" },
  { name: "HANSAEN N SOLANKI", phone: "9825206611" },
  { name: "REKHABEN D VAGHELA", phone: "9428004488" },
  { name: "KOKILABEN T GOHIL", phone: "9825208822" },
  { name: "NAYANAEN C BARAIYA", phone: "9428001155" },
  { name: "SAVITABEN G KAKIYA", phone: "9825203377" },
  { name: "DHARABEN V CHUDASAMA", phone: "9428005500" },
  { name: "NEETABEN A SARVAIYA", phone: "9825207722" },
  { name: "POOJABEN S VALA", phone: "9428002299" },
  { name: "ARTI B MARU", phone: "9825209944" },
  { name: "KINJALBEN K SOLANKI", phone: "9428006611" },
  { name: "HETALBEN P RATHOD", phone: "9825204488" },
  { name: "BHAWANA D PARMAR", phone: "9428008833" },
  { name: "KOMALBEN L JADEJA", phone: "9825201155" },
  { name: "MANSI N BARAIYA", phone: "9428003322" },
  { name: "RINKALBEN C KAKIYA", phone: "9825205588" },
  { name: "PRIYANKA G CHUDASAMA", phone: "9428007711" },
  { name: "ANANNYA D SARVAIYA", phone: "9825202277" },
  { name: "KHUSHBU R VALA", phone: "9428009944" },
  { name: "URVASHI T MARU", phone: "9825206633" },
  { name: "PAYALBEN V CHAVDA", phone: "9428004466" },
  { name: "DISHA P SOLANKI", phone: "9825208888" },

  // Page 3
  { name: "RUTVIK K RATHOD", phone: "9428001111" },
  { name: "HARSH B PARMAR", phone: "9825203333" },
  { name: "YASH L JADEJA", phone: "9428005555" },
  { name: "PARTH N BARAIYA", phone: "9825207777" },
  { name: "JAY C KAKIYA", phone: "9428002222" },
  { name: "MEET G CHUDASAMA", phone: "9825204444" },
  { name: "SHIVAM D SARVAIYA", phone: "9428006666" },
  { name: "DARSHAN R VALA", phone: "9825208888" },
  { name: "OM T MARU", phone: "9428001177" },
  { name: "DEV V CHAVDA", phone: "9825203399" },
  { name: "KRISH P SOLANKI", phone: "9428005522" },
  { name: "MANAV K RATHOD", phone: "9825207744" },
  { name: "TIRTH B PARMAR", phone: "9428002266" },
  { name: "DHRUV L JADEJA", phone: "9825204488" },
  { name: "VRAJ N BARAIYA", phone: "9428006611" },
  { name: "KAVYA C KAKIYA", phone: "9825208833" },
  { name: "HET G CHUDASAMA", phone: "9428001155" },
  { name: "SMIT D SARVAIYA", phone: "9825203377" },
  { name: "AXAT R VALA", phone: "9428005500" },
  { name: "NIL T MARU", phone: "9825207722" },
  { name: "JEET V CHAVDA", phone: "9428002299" },
  { name: "ROHIT P SOLANKI", phone: "9825204411" },
  { name: "MOHIT K RATHOD", phone: "9428006633" },
  { name: "SUMIT B PARMAR", phone: "9825208855" },
  { name: "AMIT L JADEJA", phone: "9428001188" },
  { name: "KAPIL N BARAIYA", phone: "9825203311" },
  { name: "LALIT C KAKIYA", phone: "9428005544" },

  // Page 4
  { name: "HEMANT G CHUDASAMA", phone: "9825207766" },
  { name: "TARUN D SARVAIYA", phone: "9428002288" },
  { name: "VARUN R VALA", phone: "9825204411" },
  { name: "ARUN T MARU", phone: "9428006633" },
  { name: "KARAN V CHAVDA", phone: "9825208855" },
  { name: "ARJUN P SOLANKI", phone: "9428001188" },
  { name: "BHAVIN K RATHOD", phone: "9825203311" },
  { name: "CHIRAG B PARMAR", phone: "9428005544" },
  { name: "DEEPAK L JADEJA", phone: "9825207766" },
  { name: "GAURAV N BARAIYA", phone: "9428002288" },
  { name: "HARDIK C KAKIYA", phone: "9825204411" },
  { name: "ISHAN G CHUDASAMA", phone: "9428006633" },
  { name: "JATIN D SARVAIYA", phone: "9825208855" },
  { name: "KUNAL R VALA", phone: "9428001188" },
  { name: "MAYANK T MARU", phone: "9825203311" },
  { name: "NISHANT V CHAVDA", phone: "9428005544" },
  { name: "PRATIK P SOLANKI", phone: "9825207766" },
  { name: "RAHUL K RATHOD", phone: "9428002288" },
  { name: "SACHIN B PARMAR", phone: "9825204411" },
  { name: "TUSHAR L JADEJA", phone: "9428006633" },
  { name: "UMANG N BARAIYA", phone: "9825208855" },
  { name: "VISHAL C KAKIYA", phone: "9428001188" },
  { name: "YOGESH G CHUDASAMA", phone: "9825203311" }
];

const goldContacts = [
  { name: "DEV PANDYA", phone: "9924739697" },
  { name: "SANJAYSINH MORI", phone: "9924330026" },
  { name: "SANJAY PATEL", phone: "9723377131" },
  { name: "PRAVIN DHAMELIYA", phone: "9725583850" },
  { name: "JAYDEEPBHAI VEGAD", phone: "9624965301" },
  { name: "DINESHBHAI SIJODIYA", phone: "9099381131" },
  { name: "MITAL PADALIYA", phone: "9979958975" },
  { name: "DEVARAM CHAUDHARI", phone: "9677782477" },
  { name: "SANJAYBHAI ALODARIYA", phone: "9825232221" },
  { name: "GANESH CHAUDHRI", phone: "8000508787" },
  { name: "DHARMESHBHAI", phone: "9099031918" },
  { name: "JITENDRA PARMAR", phone: "9979140360" }
];

const dreamlandContacts = [
  { name: "JAYESHBHAI UPADHYAY", phone: "9913827311" },
  { name: "BHIKHUBHAI PARMAR", phone: "9427686191" },
  { name: "RAVIRAJSINH ZALA", phone: "7096398345" },
  { name: "KISHORBHAI ROJASARA", phone: "9825334375" },
  { name: "NITABEN SOLANKI", phone: "9173184681" },
  { name: "KULDIPBHAI DHILA", phone: "8511506056" },
  { name: "BHARATBHAI PANARA", phone: "8347513887" },
  { name: "NANJIBHAI PRAJAPATI", phone: "7874814427" },
  { name: "KANTIBHAI BHADRA", phone: "9979587699" },
  { name: "RAJENDRABHAI NAKUM", phone: "6352079294" },
  { name: "KHIMJIBHAI PRAJAPATI", phone: "9376225662" },
  { name: "MAYURBHAI PRAJAPATI", phone: "9376225662" },
  { name: "PARESHBHAI PARMAR", phone: "9727404896" },
  { name: "MUKESHBHAI WAGHESHWARI", phone: "9879340577" },
  { name: "MUKESHGIRI", phone: "9879340577" },
  { name: "MAHESHBHAI UPADHYAY", phone: "" },
  { name: "DINESHBHAI RAJAPARA", phone: "8238715246" },
  { name: "AKASH MAKWANA", phone: "9624074050" },
  { name: "DINESHBHAI MAKWANA", phone: "9054443399" },
  { name: "VISHNUBHAI MALI", phone: "9879806757" },
  { name: "ASHISHBHAI PITHVA", phone: "9825262230" },
  { name: "SANDIPBHAI CHOUHAN", phone: "9033755337" },
  { name: "HASMUKHBHAI BHUTIYA", phone: "9687488598" },
  { name: "BHARATBHAI MAKWANA", phone: "7777931730" },
  { name: "KAMALBHAI CHOUHAN", phone: "9033595162" },
  { name: "DILIPBHAI SIHORA", phone: "9979214321" },
  { name: "JAYESHBHAI PADHYA", phone: "9427182415" }
];

const adityaStSocietyContacts = [
  { name: "JAYPALSINH MORI", phone: "9824125665" },
  { name: "AJAY PANDIT", phone: "9979653658" },
  { name: "MANISHBHA", phone: "9427181206" },
  { name: "JAGAT JOSHI", phone: "9428181009" },
  { name: "JIVA PARMAR", phone: "9979603737" },
  { name: "KANU PRAJAPATI", phone: "7048487476" },
  { name: "KETAN PANDYA", phone: "9427172310" },
  { name: "DEVENDRA KATAKIYA", phone: "9724360423" },
  { name: "SANJAY NIMAAT", phone: "9723406914" },
  { name: "HARDIK DUDHERIJIYA", phone: "9624316231" },
  { name: "BHAVESH LALUVADIYA", phone: "9925668483" }
];

const shreejiContacts = [
  // Part 1
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
  { name: "PARESH MEHTA", phone: "8401031477" },
  { name: "MEHUL SANGANI", phone: "9904794471" },
  { name: "MAHESH MER", phone: "9879477387" },
  { name: "ABHISHEKBHAI", phone: "9429094244" },
  { name: "DHRUVBHAI", phone: "9925711523" },

  // Part 2
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
  { name: "BHARGAVBHAI GANDHI", phone: "9920101058" },
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

async function importAllCategoryContacts() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

    // 1. AURA
    console.log(`Importing ${auraContacts.length} AURA contacts...`);
    for (const c of auraContacts) {
      const cleanPhone = c.phone.replace(/[^0-9]/g, "");
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
    }

    // 2. SKYLINE
    console.log(`Importing ${skylineContacts.length} SKYLINE contacts...`);
    for (const c of skylineContacts) {
      const cleanPhone = c.phone.replace(/[^0-9]/g, "");
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
    }

    // 3. GOLD
    console.log(`Importing ${goldContacts.length} GOLD contacts...`);
    for (const c of goldContacts) {
      const cleanPhone = c.phone.replace(/[^0-9]/g, "");
      await Customer.updateOne(
        { phone: cleanPhone },
        {
          $set: {
            name: c.name.trim(),
            phone: cleanPhone,
            category: "GOLD",
            source: "Imported"
          }
        },
        { upsert: true }
      );
    }

    // 4. DREAMLAND
    console.log(`Importing ${dreamlandContacts.length} DREAMLAND contacts...`);
    for (const c of dreamlandContacts) {
      const cleanPhone = c.phone ? c.phone.replace(/[^0-9]/g, "") : "";
      if (cleanPhone) {
        await Customer.updateOne(
          { phone: cleanPhone },
          {
            $set: {
              name: c.name.trim(),
              phone: cleanPhone,
              category: "DREAMLAND",
              source: "Imported"
            }
          },
          { upsert: true }
        );
      } else {
        // Blank number
        const existingBlank = await Customer.findOne({ name: c.name.trim(), category: "DREAMLAND" });
        if (!existingBlank) {
          const blankPhone = `BLANK_${Date.now()}`;
          await Customer.create({
            name: c.name.trim(),
            phone: blankPhone,
            category: "DREAMLAND",
            source: "Imported"
          });
        }
      }
    }


    // 5. ADITYA ST SOCIETY
    console.log(`Importing ${adityaStSocietyContacts.length} ADITYA ST SOCIETY contacts...`);
    for (const c of adityaStSocietyContacts) {
      const cleanPhone = c.phone.replace(/[^0-9]/g, "");
      await Customer.updateOne(
        { phone: cleanPhone },
        {
          $set: {
            name: c.name.trim(),
            phone: cleanPhone,
            category: "ADITYA ST SOCIETY",
            source: "Imported"
          }
        },
        { upsert: true }
      );
    }

    // 6. SHREEJI
    console.log(`Importing ${shreejiContacts.length} SHREEJI contacts...`);
    for (const c of shreejiContacts) {
      const cleanPhone = c.phone.replace(/[^0-9]/g, "");
      await Customer.updateOne(
        { phone: cleanPhone },
        {
          $set: {
            name: c.name.trim(),
            phone: cleanPhone,
            category: "SHREEJI",
            source: "Imported"
          }
        },
        { upsert: true }
      );
    }

    console.log("✅ All category contacts successfully imported into MongoDB!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error importing contacts:", err);
    process.exit(1);
  }
}

importAllCategoryContacts();
