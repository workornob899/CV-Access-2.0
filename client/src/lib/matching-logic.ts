import { Profile } from "@shared/schema";

export interface MatchingCriteria {
  name: string;
  age: number;
  gender: string;
  profession?: string;
  maritalStatus?: string;
  height: string;
}

export interface MatchResult {
  inputProfile: MatchingCriteria;
  matchedProfile: Profile;
  compatibilityScore: number;
}

export function parseHeight(height: string): number {
  // Convert height string like "5'6\"" to inches
  const match = height.match(/(\d+)'(\d+)"/);
  if (match) {
    const feet = parseInt(match[1]);
    const inches = parseInt(match[2]);
    return feet * 12 + inches;
  }
  return 0;
}

export function isCompatibleMatch(
  inputCriteria: MatchingCriteria,
  candidateProfile: Profile
): boolean {
  const { age: inputAge, gender: inputGender, height: inputHeight, profession: inputProfession } = inputCriteria;
  const { age: candidateAge, gender: candidateGender, height: candidateHeight } = candidateProfile;

  // Must be opposite gender
  if (inputGender === candidateGender) {
    return false;
  }

  // Groom's profession is mandatory
  if (inputGender === "Male" && !inputProfession) {
    return false;
  }

  const inputHeightInches = parseHeight(inputHeight);
  const candidateHeightInches = parseHeight(candidateHeight);

  if (inputGender === "Male") {
    // Male (Groom) looking for female (Bride)
    // Bride should be 3-6 years younger and 6-8 inches shorter
    const ageDiff = inputAge - candidateAge;
    const heightDiff = inputHeightInches - candidateHeightInches;

    return ageDiff >= 3 && ageDiff <= 6 && heightDiff >= 6 && heightDiff <= 8;
  } else {
    // Female (Bride) looking for male (Groom)
    // Groom should be 3-6 years older and 6-8 inches taller
    // Groom must have profession
    if (!candidateProfile.profession) {
      return false;
    }

    const ageDiff = candidateAge - inputAge;
    const heightDiff = candidateHeightInches - inputHeightInches;

    return ageDiff >= 3 && ageDiff <= 6 && heightDiff >= 6 && heightDiff <= 8;
  }
}

export function calculateCompatibilityScore(
  inputCriteria: MatchingCriteria,
  matchedProfile: Profile
): number {
  let score = 85; // Base score

  // Add points for profession compatibility (if groom has profession)
  if (inputCriteria.profession && matchedProfile.profession) {
    score += 5;
  }

  // Add points for marital status preference
  if (inputCriteria.maritalStatus && matchedProfile.maritalStatus) {
    if (inputCriteria.maritalStatus === matchedProfile.maritalStatus) {
      score += 3; // Bonus for matching marital status
    }
  }

  // Add random variation for realistic scoring
  score += Math.floor(Math.random() * 10);

  return Math.min(score, 100);
}

export function findMatches(
  inputCriteria: MatchingCriteria,
  candidateProfiles: Profile[]
): Profile[] {
  return candidateProfiles.filter(profile =>
    isCompatibleMatch(inputCriteria, profile)
  );
}

// Store recent matches to avoid repetition
let recentMatches: number[] = [];
const MAX_RECENT_MATCHES = 3;

export function selectRandomMatch(compatibleMatches: Profile[]): Profile | null {
  if (compatibleMatches.length === 0) {
    return null;
  }

  // Filter out recently matched profiles
  const availableMatches = compatibleMatches.filter(profile => 
    !recentMatches.includes(profile.id)
  );

  // If all matches are recent, clear the history and use all matches
  const matchesToUse = availableMatches.length > 0 ? availableMatches : compatibleMatches;

  if (availableMatches.length === 0) {
    recentMatches = []; // Reset recent matches
  }

  const randomIndex = Math.floor(Math.random() * matchesToUse.length);
  const selectedMatch = matchesToUse[randomIndex];

  // Add to recent matches
  recentMatches.push(selectedMatch.id);
  if (recentMatches.length > MAX_RECENT_MATCHES) {
    recentMatches.shift(); // Remove oldest
  }

  return selectedMatch;
}
