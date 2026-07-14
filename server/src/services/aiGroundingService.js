import Project from "../../models/Project.js";
import FAQ from "../../models/FAQ.js";
import SiteSettings from "../../models/SiteSettings.js";
import { parseNluSearch } from "./openAiService.js";

/**
 * Utility to parse price strings (e.g. "₹31.20 Lakh onwards", "1.2 Crore") into numbers (in Lakhs)
 */
export const parsePriceToLakhs = (priceStr) => {
  if (!priceStr) return 0;
  // Clean string to keep only digits and decimal points
  const lower = priceStr.toLowerCase();
  const match = priceStr.replace(/[^\d.]/g, "");
  const num = parseFloat(match);
  if (isNaN(num)) return 0;
  
  if (lower.includes("crore") || lower.includes("cr")) {
    return num * 100; // 1 Crore = 100 Lakhs
  }
  return num; // Default to Lakhs
};

/**
 * Service to dynamically retrieve grounding data from MongoDB.
 */
export const retrieveGroundingData = async (userMessage, customerMemory = null) => {
  try {
    const text = userMessage.toLowerCase();
    
    // Always retrieve singleton SiteSettings
    const settings = await SiteSettings.getSettings();
    
    // 1. Fetch matching projects
    let matchedProjects = [];
    
    // Parse natural language queries if search or budget parameters seem present
    const isSearchQuery = text.includes("pool") || text.includes("amenities") || text.includes("rera") || 
                          text.includes("possession") || text.includes("bhk") || text.includes("lakh") || 
                          text.includes("crore") || text.includes("budget") || text.includes("price") || 
                          text.includes("ready") || text.includes("ongoing") || text.includes("completed");

    if (isSearchQuery) {
      const filters = await parseNluSearch(userMessage);
      if (filters) {
        console.log("🔍 [Grounding] Parsed NLU filters:", JSON.stringify(filters));
        const dbQuery = { isActive: true };

        // Location match
        if (filters.location) {
          dbQuery.$or = [
            { location: { $regex: filters.location, $options: "i" } },
            { title: { $regex: filters.location, $options: "i" } }
          ];
        }

        // BHK/Configuration match
        if (filters.bhk) {
          dbQuery.configuration = { $regex: filters.bhk.replace(/\s+/g, ""), $options: "i" };
        }

        // Possession status match
        if (filters.possessionType) {
          if (filters.possessionType === "Ready") {
            dbQuery.status = "Completed";
          } else if (filters.possessionType === "Ongoing") {
            dbQuery.status = "Ongoing";
          } else if (filters.possessionType === "Upcoming") {
            dbQuery.status = "Upcoming";
          }
        }

        // Amenities match (all must match)
        if (filters.amenities && filters.amenities.length > 0) {
          dbQuery.amenities = { 
            $all: filters.amenities.map(a => new RegExp(a.trim(), "i")) 
          };
        }

        // Run MongoDB query with filters
        let projects = await Project.find(dbQuery);

        // JavaScript-based budget filtering since startingPrice is stored as text
        if (filters.budgetMax !== null && filters.budgetMax !== undefined) {
          projects = projects.filter(p => {
            const priceLakhs = parsePriceToLakhs(p.startingPrice);
            return priceLakhs <= filters.budgetMax;
          });
        }
        if (filters.budgetMin !== null && filters.budgetMin !== undefined) {
          projects = projects.filter(p => {
            const priceLakhs = parsePriceToLakhs(p.startingPrice);
            return priceLakhs >= filters.budgetMin;
          });
        }

        matchedProjects = projects;
      }
    }

    // Fallback 2: Basic title/location keyword check if NLU didn't run or yielded no results
    if (matchedProjects.length === 0) {
      const allProjects = await Project.find({ isActive: true });
      matchedProjects = allProjects.filter(p => {
        const titleMatch = text.includes(p.title.toLowerCase()) || p.slug.split("-").some(part => text.includes(part));
        const locMatch = text.includes(p.location.toLowerCase());
        return titleMatch || locMatch;
      });
    }

    // Fallback 3: Check memory context
    if (matchedProjects.length === 0 && customerMemory) {
      if (customerMemory.projectsViewed && customerMemory.projectsViewed.length > 0) {
        matchedProjects = await Project.find({ _id: { $in: customerMemory.projectsViewed }, isActive: true });
      }
    }

    // Fallback 4: Show featured projects if nothing matches
    if (matchedProjects.length === 0) {
      const allProjects = await Project.find({ isActive: true });
      matchedProjects = allProjects.filter(p => p.isFeatured);
      if (matchedProjects.length === 0) {
        matchedProjects = allProjects.slice(0, 3);
      }
    }

    // 2. Fetch FAQs matching keywords
    let matchedFaqs = [];
    if (userMessage.trim().length > 3) {
      const words = userMessage.split(/\s+/).filter(w => w.length > 3);
      if (words.length > 0) {
        const regexQueries = words.map(w => ({
          $or: [
            { question: { $regex: w, $options: "i" } },
            { answer: { $regex: w, $options: "i" } }
          ]
        }));
        matchedFaqs = await FAQ.find({ $or: regexQueries }).limit(5);
      }
    }

    // Retrieve default FAQs if not enough matched
    if (matchedFaqs.length < 3) {
      const generalFaqs = await FAQ.find({}).limit(5 - matchedFaqs.length);
      matchedFaqs = [...matchedFaqs, ...generalFaqs];
      
      const seen = new Set();
      matchedFaqs = matchedFaqs.filter(faq => {
        const id = faq._id.toString();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }

    return {
      settings,
      projects: matchedProjects,
      faqs: matchedFaqs
    };
  } catch (error) {
    console.error("❌ Grounding retrieval failed:", error.message);
    const settings = await SiteSettings.getSettings();
    return {
      settings,
      projects: [],
      faqs: []
    };
  }
};

/**
 * Formats retrieved grounding data into structured text blocks for the AI prompt.
 */
export const formatGroundingData = (grounding) => {
  const { settings, projects, faqs } = grounding;
  let text = "";

  if (settings) {
    text += `=== COMPANY PROFILE & CONTACTS ===\n`;
    text += `Company Name: ${settings.companyName}\n`;
    text += `Tagline: ${settings.tagline}\n`;
    text += `About: ${settings.aboutUsFull}\n`;
    text += `Office Address: ${settings.address}\n`;
    text += `Office Hours: ${settings.officeHours}\n`;
    text += `Phone Numbers: ${settings.phoneNumbers?.join(", ") || ""}\n`;
    text += `Email: ${settings.email || ""}\n`;
    text += `Instagram: ${settings.instagramUrl || ""}\n`;
    text += `WhatsApp Link: https://wa.me/${settings.whatsappNumber || ""}\n`;
    text += `Years of Experience: ${settings.yearsOfExperience}\n`;
    text += `Completed Projects: ${settings.projectsCompleted}\n`;
    text += `Happy Customers: ${settings.happyCustomers}\n\n`;
  }

  if (projects && projects.length > 0) {
    text += `=== AVAILABLE PROJECTS ===\n`;
    projects.forEach(p => {
      text += `- Project Title: ${p.title}\n`;
      text += `  Status: ${p.status}\n`;
      text += `  Type: ${p.type}\n`;
      text += `  Configuration: ${p.configuration || "N/A"}\n`;
      text += `  Starting Price: ${p.startingPrice || "N/A"}\n`;
      text += `  Location: ${p.location}\n`;
      text += `  Description: ${p.description}\n`;
      text += `  Amenities: ${p.amenities?.join(", ") || "None"}\n`;
      text += `  Possession Date: ${p.possessionDate || "N/A"}\n`;
      text += `  RERA Number: ${p.reraNumber || "Not Disclosed/Pre-RERA"}\n`;
      text += `  Units Available: ${p.availableUnits || 0}\n`;
      text += `  Brochure URL: ${p.brochure?.url || "Not Uploaded"}\n\n`;
    });
  }

  if (faqs && faqs.length > 0) {
    text += `=== FREQUENTLY ASKED QUESTIONS ===\n`;
    faqs.forEach(faq => {
      text += `Q: ${faq.question}\n`;
      text += `A: ${faq.answer}\n\n`;
    });
  }

  return text;
};
