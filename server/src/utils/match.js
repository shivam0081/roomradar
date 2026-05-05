/**
 * A simple weighted matching algorithm for users and rooms.
 * It scores candidates based on shared lifestyle tags and preference overlap.
 */

const scoreUserMatch = (current, candidate) => {
  let score = 0;

  // Lifestyle tags overlap (case-insensitive)
  const tagsA = new Set((current.lifestyleTags || []).map((t) => t.toLowerCase().trim()));
  const tagsB = new Set((candidate.lifestyleTags || []).map((t) => t.toLowerCase().trim()));
  const intersection = [...tagsA].filter((tag) => tagsB.has(tag));
  score += intersection.length * 20;

  // Budget match: check candidate preferences and current's preferences
  if (current.preferences?.budgetMax && candidate.preferences?.budgetMin) {
    if (current.preferences.budgetMax >= candidate.preferences.budgetMin) {
      score += 15;
    }
  }

  // Location match
  if (current.preferences?.location && candidate.preferences?.location) {
    if (current.preferences.location.toLowerCase() === candidate.preferences.location.toLowerCase()) {
      score += 15;
    }
  }

  return score;
};

const scoreRoomMatch = (user, room) => {
  let score = 0;

  const userTags = new Set((user.lifestyleTags || []).map((t) => t.toLowerCase().trim()));
  const roomTags = new Set((room.lifestyleTags || []).map((t) => t.toLowerCase().trim()));
  const overlap = [...userTags].filter((tag) => roomTags.has(tag));
  score += overlap.length * 25;

  // Budget
  if (user.preferences?.budgetMax && room.rent) {
    const max = user.preferences.budgetMax;
    score += room.rent <= max ? 20 : 0;
  }

  // Location
  if (user.preferences?.location && room.location) {
    if (room.location.toLowerCase().includes(user.preferences.location.toLowerCase())) {
      score += 15;
    }
  }

  return score;
};

module.exports = {
  scoreUserMatch,
  scoreRoomMatch,
};
