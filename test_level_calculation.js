// Test the level calculation logic
const calculateLevel = (xp) => {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
};

const getXPForNextLevel = (currentLevel) => {
  return currentLevel * currentLevel * 50;
};

const getXPProgress = (currentXP, currentLevel) => {
  const currentLevelXP = (currentLevel - 1) * (currentLevel - 1) * 50;
  const nextLevelXP = getXPForNextLevel(currentLevel);
  const progressXP = currentXP - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;

  return {
    current: progressXP,
    needed: neededXP,
    percentage: Math.min((progressXP / neededXP) * 100, 100),
  };
};

// Test with 0 XP (new user)
console.log("=== NEW USER TEST (0 XP) ===");
const userXP = 0;
const userLevel = calculateLevel(userXP);
const progress = getXPProgress(userXP, userLevel);

console.log(`User XP: ${userXP}`);
console.log(`Calculated Level: ${userLevel}`);
console.log(
  `Progress: ${progress.current} / ${
    progress.needed
  } XP (${progress.percentage.toFixed(1)}%)`
);

// Test with 49 XP (still level 1)
console.log("\n=== LEVEL 1 MAX TEST (49 XP) ===");
const userXP2 = 49;
const userLevel2 = calculateLevel(userXP2);
const progress2 = getXPProgress(userXP2, userLevel2);

console.log(`User XP: ${userXP2}`);
console.log(`Calculated Level: ${userLevel2}`);
console.log(
  `Progress: ${progress2.current} / ${
    progress2.needed
  } XP (${progress2.percentage.toFixed(1)}%)`
);

// Test with 50 XP (should be level 2)
console.log("\n=== LEVEL 2 TEST (50 XP) ===");
const userXP3 = 50;
const userLevel3 = calculateLevel(userXP3);
const progress3 = getXPProgress(userXP3, userLevel3);

console.log(`User XP: ${userXP3}`);
console.log(`Calculated Level: ${userLevel3}`);
console.log(
  `Progress: ${progress3.current} / ${
    progress3.needed
  } XP (${progress3.percentage.toFixed(1)}%)`
);
