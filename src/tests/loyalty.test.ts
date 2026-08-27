import { describe, it, expect } from 'vitest';

describe('Programme de Fidélité & Calculs Métier', () => {
  const calculateEarnedPoints = (price: number, conversionRate = 1) => {
    return Math.floor(price * conversionRate);
  };

  const canRedeemReward = (clientPoints: number, rewardPointsRequired: number) => {
    return clientPoints >= rewardPointsRequired;
  };

  it('calcule 1 point par euro dépensé arrondi à l\'entier inférieur', () => {
    expect(calculateEarnedPoints(45)).toBe(45);
    expect(calculateEarnedPoints(89.90)).toBe(89);
    expect(calculateEarnedPoints(120)).toBe(120);
    expect(calculateEarnedPoints(0)).toBe(0);
  });

  it('vérifie si un client a suffisamment de points pour débloquer une récompense', () => {
    const clientPoints = 120;
    const rewardSoinKératine = 100;
    const rewardBalayageOffert = 250;

    expect(canRedeemReward(clientPoints, rewardSoinKératine)).toBe(true);
    expect(canRedeemReward(clientPoints, rewardBalayageOffert)).toBe(false);
  });

  it('débite correctement le solde de points après échange sans devenir négatif', () => {
    let clientPoints = 150;
    const cost = 100;
    
    if (canRedeemReward(clientPoints, cost)) {
      clientPoints = Math.max(0, clientPoints - cost);
    }

    expect(clientPoints).toBe(50);
  });
});
