export function evaluateConfidence(engineType) {
  // Simulated AI confidence score (replace with model later)
  const confidence = Math.floor(Math.random() * 100);

  if (confidence < 40) {
    return {
      approved: false,
      score: confidence,
      modifier: 0,
      reason: "Low confidence signal",
    };
  }

  if (confidence < 60) {
    return {
      approved: true,
      score: confidence,
      modifier: 0.8,
    };
  }

  if (confidence < 80) {
    return {
      approved: true,
      score: confidence,
      modifier: 1,
    };
  }

  return {
    approved: true,
    score: confidence,
    modifier: 1.15, // slight boost
  };
}
