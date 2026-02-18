/**
 * Fantasy Cricket Points Calculator
 * ICC T20 World Cup 2026 Scoring System
 */

/**
 * Calculate batting points
 */
export function calculateBattingPoints(stats) {
  let points = 0;
  const { runs, ballsFaced, fours, sixes } = stats;

  // Base runs
  points += runs;

  // Boundary bonuses
  points += fours * 1; // +1 per four
  points += sixes * 2; // +2 per six

  // Milestone bonuses
  if (runs >= 150) {
    points += 30;
  } else if (runs >= 100) {
    points += 20;
  } else if (runs >= 50) {
    points += 12;
  } else if (runs >= 30) {
    points += 6;
  }

  // Duck penalty
  if (runs === 0 && ballsFaced > 0) {
    points -= 4;
  }

  // Strike Rate Bonus (min 10 balls)
  if (ballsFaced >= 10) {
    const strikeRate = (runs / ballsFaced) * 100;
    
    if (strikeRate >= 180) {
      points += 10;
    } else if (strikeRate >= 170) {
      points += 9;
    } else if (strikeRate >= 160) {
      points += 8;
    } else if (strikeRate >= 150) {
      points += 7;
    } else if (strikeRate >= 140) {
      points += 6;
    } else if (strikeRate >= 130) {
      points += 4;
    } else if (strikeRate >= 120) {
      points += 3;
    } else if (strikeRate >= 110) {
      points += 2;
    } else if (strikeRate >= 100) {
      points += 1;
    } else if (strikeRate < 60) {
      points -= 8;
    } else {
      points += 0.5;
    }
  }

  return Math.round(points * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate bowling points
 */
export function calculateBowlingPoints(stats) {
  let points = 0;
  const { wickets, dotBalls, maidens, oversBowled, runsConceded } = stats;

  // Wicket points
  points += wickets * 18;

  // Dot ball points
  points += dotBalls * 1;

  // Maiden over points
  points += maidens * 12;

  // Wicket milestone bonuses
  if (wickets >= 5) {
    points += 35;
  } else if (wickets >= 4) {
    points += 20;
  } else if (wickets >= 3) {
    points += 12;
  } else if (wickets >= 2) {
    points += 5;
  }

  // Economy Rate Bonus (min 2 overs)
  if (oversBowled >= 2) {
    const economy = runsConceded / oversBowled;
    
    if (economy < 5) {
      points += 12;
    } else if (economy <= 6) {
      points += 8;
    } else if (economy <= 7) {
      points += 5;
    } else if (economy <= 8) {
      points += 2;
    } else if (economy <= 9) {
      points += 0;
    } else if (economy <= 10) {
      points -= 4;
    } else if (economy <= 11) {
      points -= 8;
    } else {
      points -= 12;
    }
  }

  return Math.round(points * 10) / 10;
}

/**
 * Calculate fielding points
 */
export function calculateFieldingPoints(stats) {
  let points = 0;
  const { catches, runouts, runoutAssists, stumpings } = stats;

  points += catches * 5;
  points += runoutAssists * 6;
  points += runouts * 8;
  points += stumpings * 7;

  return points;
}

/**
 * Calculate total fantasy points for a player's performance
 */
export function calculateTotalPoints(stats) {
  const battingPoints = calculateBattingPoints(stats);
  const bowlingPoints = calculateBowlingPoints(stats);
  const fieldingPoints = calculateFieldingPoints(stats);

  return Math.round((battingPoints + bowlingPoints + fieldingPoints) * 10) / 10;
}
