/**
 * A weighted matching algorithm for users and rooms.
 * It scores candidates based on shared lifestyle tags, preference overlap,
 * and enforces mandatory tag constraints (dealbreakers).
 */

const scoreUserMatch = (current, candidate) => {
  let score = 0;

  const currentTags = current.lifestyleTags || [];
  const candidateTags = candidate.lifestyleTags || [];
  
  const mapA = new Map(currentTags.map((t) => [t.tag.toLowerCase().trim(), t]));
  const mapB = new Map(candidateTags.map((t) => [t.tag.toLowerCase().trim(), t]));

  // 1. Mandatory Check: If current requires a tag candidate doesn't have
  for (const t of currentTags) {
    if (t.isMandatory && !mapB.has(t.tag.toLowerCase().trim())) {
      return -Infinity;
    }
  }
  // 2. Mandatory Check (Bidirectional): If candidate requires a tag current doesn't have
  for (const t of candidateTags) {
    if (t.isMandatory && !mapA.has(t.tag.toLowerCase().trim())) {
      return -Infinity;
    }
  }

  // 3. Score Overlapping Tags
  for (const [tagName, objA] of mapA.entries()) {
    if (mapB.has(tagName)) {
      const objB = mapB.get(tagName);
      // Base score 10 per point of combined weight (e.g., Normal + Normal = 1+1=2 => 20 points)
      score += 10 * (objA.weight + objB.weight);
    }
  }

  // Budget match
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

  const userTags = user.lifestyleTags || [];
  const roomTags = room.lifestyleTags || [];
  
  const mapUser = new Map(userTags.map((t) => [t.tag.toLowerCase().trim(), t]));
  const mapRoom = new Map(roomTags.map((t) => [t.tag.toLowerCase().trim(), t]));

  // Mandatory checks
  for (const t of userTags) {
    if (t.isMandatory && !mapRoom.has(t.tag.toLowerCase().trim())) {
      return -Infinity;
    }
  }
  for (const t of roomTags) {
    if (t.isMandatory && !mapUser.has(t.tag.toLowerCase().trim())) {
      return -Infinity;
    }
  }

  // Score
  for (const [tagName, objU] of mapUser.entries()) {
    if (mapRoom.has(tagName)) {
      const objR = mapRoom.get(tagName);
      score += 12.5 * (objU.weight + objR.weight); // Base 25 for normal overlap
    }
  }

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
