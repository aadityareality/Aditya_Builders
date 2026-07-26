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

const eleganceContacts = [
  { name: "PRAKASHBHAI MAKWANA", phone: "6352659165" },
  { name: "MANTHAM JOSHI", phone: "9714507167" },
  { name: "MANISHBHAI JOSHU", phone: "9875028075" },
  { name: "NIDHIBEN PATEL", phone: "8320617702" },
  { name: "MUKUNDBHAI SONI", phone: "9924246311" },
  { name: "NIRAV", phone: "9377531531" },
  { name: "PANKAJBHAU UPADHYAI", phone: "9909989250" },
  { name: "KETANBHAI PATEL", phone: "9428051815" },
  { name: "NARESHBHAI SIDDHPURA", phone: "9426902657" },
  { name: "JAYESHBHAI SONI", phone: "6355716667" },
  { name: "NARESHBHAI RATHOD", phone: "9723120842" },
  { name: "DARSHAKBHAI SONI", phone: "9879362536" },
  { name: "CHENTANBHAI KUNCHA", phone: "9824776172" },
  { name: "BHAVINBHAI BAROT", phone: "9099520666" },
  { name: "POOJA GOSAI", phone: "7405226105" },
  { name: "VALLABHBHAI DADVA", phone: "9879326222" },
  { name: "RAVI", phone: "9909502083" },
  { name: "CHIRAGBHAI GOHEL", phone: "9510981633" },
  { name: "DINESHBHAI VASOYA", phone: "9925375447" },
  { name: "HITARTH RATHOD", phone: "7777975444" },
  { name: "LABHUBHAI SOLANKI", phone: "9725608761" },
  { name: "JULABEN PATEL", phone: "7493939393" },
  { name: "BHADRESHBHAI GAOUSHWAMI", phone: "9924983150" },
  { name: "PARTH DHAMELIYA", phone: "9974693874" },
  { name: "DARSHANBHAI MANGUKIYA", phone: "9879378757" },
  { name: "YASH MEHTA", phone: "9924773535" },
  { name: "YASH JOSHI", phone: "8000221093" },
  { name: "JAYPALBHAI", phone: "7383730572" },
  { name: "DEV TRIVEDI", phone: "7984856773" },
  { name: "RAVINDRA AMBLANI", phone: "9106933004" },
  { name: "KAMLESH KAVA", phone: "9824511160" },
  { name: "SAVJIBHAI PATEL", phone: "9828181090" },
  { name: "NAYANBHAI PARMAR", phone: "8734053453" },
  { name: "BHAVESHBHAI", phone: "9714680049" },
  { name: "NIKHILBHAI PATEL", phone: "8264146250" },
  { name: "JAY VAGHASIYA", phone: "9601084740" },
  { name: "KALPEHSBHAI", phone: "9099887769" }
];

const iconContacts = [
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
  { name: "MAHESH MAKWANA", phone: "9737667886" },
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
  { name: "KIRIT KANJIYA", phone: "9328180418" },
  { name: "RAJ MAKWANA", phone: "7990177461" },
  { name: "CHETAN RATHOD", phone: "9834353711" },
  { name: "RAKESH PARMAR", phone: "9737749090" },
  { name: "BHARAT SOLANKI", phone: "7621840466" },
  { name: "HITESH MAKWNA", phone: "6352003506" },
  { name: "RAHUL", phone: "8780808585" },
  { name: "HARESH DALSANIYA", phone: "9904740305" },
  { name: "AKSHAR PATEL", phone: "8200468895" },
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
  { name: "VINODBHAI PARMAR", phone: "9846916833" },
  { name: "SANJAYBHAI MAKWANA", phone: "9737222325" },
  { name: "ARPITBHAI", phone: "9913866090" },
  { name: "RAJU MAKWANA", phone: "8460167633" },
  { name: "JITENDRA MAKWANA", phone: "9723931096" },
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
  { name: "RAJESH BHATT", phone: "9823183270" },
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

const luxuriaContacts = [
  // Page 1
  { name: "PARESHBHAI M PARMAR", phone: "8160624788" },
  { name: "RAJUBHAI K DEVMURARI", phone: "9426939553" },
  { name: "SONALBEN M AGARVAT", phone: "" },
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
  { name: "VIMAL CHAUHAN", phone: "9429503173" },
  { name: "HASMUKH JANI", phone: "7046472605" },
  { name: "RAMESH", phone: "9924618538" },
  { name: "PRATIK BHAVSAR", phone: "7265949494" },
  { name: "HARESH", phone: "8200732426" },

  // Page 2
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

  // Page 3
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
  { name: "BALUBHAI MAKWANA", phone: "9067441661" }
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
        const existingBlank = await Customer.findOne({ name: c.name.trim(), category: "DREAMLAND" });
        if (!existingBlank) {
          const blankPhone = `BLANK_${Date.now()}_${Math.floor(Math.random()*1000)}`;
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

    // 7. ELEGANCE
    console.log(`Importing ${eleganceContacts.length} ELEGANCE contacts...`);
    for (const c of eleganceContacts) {
      const cleanPhone = c.phone.replace(/[^0-9]/g, "");
      await Customer.updateOne(
        { phone: cleanPhone },
        {
          $set: {
            name: c.name.trim(),
            phone: cleanPhone,
            category: "ELEGANCE",
            source: "Imported"
          }
        },
        { upsert: true }
      );
    }

    // 8. ICON
    console.log(`Importing ${iconContacts.length} ICON contacts...`);
    for (const c of iconContacts) {
      const cleanPhone = c.phone.replace(/[^0-9]/g, "");
      await Customer.updateOne(
        { phone: cleanPhone },
        {
          $set: {
            name: c.name.trim(),
            phone: cleanPhone,
            category: "ICON",
            source: "Imported"
          }
        },
        { upsert: true }
      );
    }

    // 9. LUXURIA
    console.log(`Importing ${luxuriaContacts.length} LUXURIA contacts...`);
    for (const c of luxuriaContacts) {
      const cleanPhone = c.phone ? c.phone.replace(/[^0-9]/g, "") : "";
      if (cleanPhone) {
        await Customer.updateOne(
          { phone: cleanPhone },
          {
            $set: {
              name: c.name.trim(),
              phone: cleanPhone,
              category: "LUXURIA",
              source: "Imported"
            }
          },
          { upsert: true }
        );
      } else {
        const existingBlank = await Customer.findOne({ name: c.name.trim(), category: "LUXURIA" });
        if (!existingBlank) {
          const blankPhone = `BLANK_${Date.now()}_${Math.floor(Math.random()*1000)}`;
          await Customer.create({
            name: c.name.trim(),
            phone: blankPhone,
            category: "LUXURIA",
            source: "Imported"
          });
        }
      }
    }

    console.log("✅ LUXURIA category contacts successfully imported into MongoDB!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error importing contacts:", err);
    process.exit(1);
  }
}

importAllCategoryContacts();
