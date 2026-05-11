const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// POST /api/ai/enhance-description
router.post('/enhance-description', auth, async (req, res) => {
  try {
    const { title, roughNotes, location, amenities, type } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'AI is not configured on the server.' });
    }

    let prompt = '';

    if (type === 'room') {
      prompt = `
        You are an expert real estate copywriter. I am listing a room/flat for rent.
        Please rewrite my rough notes into a beautiful, engaging, and professional 2-3 paragraph description.
        Make it sound appealing to potential renters. Use a friendly, modern tone. No markdown headers, just text and maybe a few emojis.
        
        Title: ${title || 'N/A'}
        Location: ${location || 'N/A'}
        Amenities: ${(amenities || []).join(', ') || 'N/A'}
        My Rough Notes: ${roughNotes || 'No notes provided. Write a generic welcoming description for a room here.'}
        
        Return ONLY the rewritten description. Do not include introductory text like "Here is the description:".
      `;
    } else if (type === 'bio') {
      prompt = `
        You are an expert profile bio writer. I am creating a "roommate profile" to find people to live with.
        Please rewrite my rough notes into a friendly, engaging 1-2 paragraph bio. Make me sound like a great person to live with.
        No markdown headers, just text and a few emojis.
        
        My Rough Notes: ${roughNotes || 'No notes provided. Write a generic friendly roommate bio.'}
        
        Return ONLY the rewritten bio. Do not include introductory text.
      `;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const enhancedText = response.text ? response.text.trim() : '';

    if (!enhancedText) {
      throw new Error('AI returned an empty response.');
    }

    res.json({ enhancedText });
  } catch (error) {
    console.error('AI Enhancement Error:', error);
    res.status(500).json({ message: 'Failed to enhance description with AI.' });
  }
});

module.exports = router;
