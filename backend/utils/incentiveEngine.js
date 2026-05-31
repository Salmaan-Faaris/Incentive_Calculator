/**
 * Core incentive calculation engine.
 * Supports two modes:
 *   flat       — whichever slab tier the total falls into, ALL cars earn that rate
 *   progressive— like income tax brackets: each range earns its own rate
 */
function calculateIncentive(totalCars, slabs, calculationType = 'flat') {
  if (!slabs || slabs.length === 0 || totalCars === 0) {
    return { totalIncentive: 0, tierHit: null, breakdown: [], appliedRate: 0 };
  }

  // Sort slabs ascending by minQty
  const sorted = [...slabs].sort((a, b) => a.minQty - b.minQty);

  if (calculationType === 'flat') {
    // Find the highest slab the officer qualifies for
    let appliedSlab = null;
    for (const slab of sorted) {
      const withinMax = slab.maxQty === null || slab.maxQty === undefined || totalCars <= slab.maxQty;
      if (totalCars >= slab.minQty && withinMax) {
        appliedSlab = slab;
      }
    }

    if (!appliedSlab) {
      // Try the last slab if totalCars exceeds all ranges
      appliedSlab = sorted[sorted.length - 1];
    }

    const totalIncentive = totalCars * appliedSlab.incentivePerCar;

    return {
      totalIncentive,
      tierHit: appliedSlab.label || `Tier ${sorted.indexOf(appliedSlab) + 1}`,
      appliedRate: appliedSlab.incentivePerCar,
      breakdown: sorted.map((s, i) => {
        const isActive = s._id?.toString() === appliedSlab._id?.toString() ||
          (s.minQty === appliedSlab.minQty && s.incentivePerCar === appliedSlab.incentivePerCar);
        return {
          label: s.label || `Tier ${i + 1}`,
          range: s.maxQty ? `${s.minQty}–${s.maxQty} cars` : `${s.minQty}+ cars`,
          rate: s.incentivePerCar,
          isActive,
          cars: isActive ? totalCars : 0,
          amount: isActive ? totalIncentive : 0,
        };
      }),
    };
  }

  // Progressive (bracket) calculation
  let remaining = totalCars;
  let total = 0;
  const breakdown = [];

  for (const slab of sorted) {
    if (remaining <= 0) break;
    const maxInSlab = slab.maxQty !== null && slab.maxQty !== undefined
      ? slab.maxQty - slab.minQty + 1
      : Infinity;
    const carsInSlab = Math.min(remaining, maxInSlab);
    const amount = carsInSlab * slab.incentivePerCar;
    total += amount;

    breakdown.push({
      label: slab.label || `Tier ${sorted.indexOf(slab) + 1}`,
      range: slab.maxQty ? `${slab.minQty}–${slab.maxQty} cars` : `${slab.minQty}+ cars`,
      rate: slab.incentivePerCar,
      cars: carsInSlab,
      amount,
      isActive: carsInSlab > 0,
    });

    remaining -= carsInSlab;
  }

  // Determine tier hit label
  const lastActive = [...breakdown].reverse().find((b) => b.isActive);

  return {
    totalIncentive: total,
    tierHit: lastActive?.label || null,
    appliedRate: lastActive?.rate || 0,
    breakdown,
  };
}

/**
 * Given a total and slab config, find next milestone:
 * how many more cars to reach the next tier.
 */
function getNextMilestone(totalCars, slabs) {
  const sorted = [...slabs].sort((a, b) => a.minQty - b.minQty);
  for (const slab of sorted) {
    if (slab.minQty > totalCars) {
      return {
        carsNeeded: slab.minQty - totalCars,
        nextRate: slab.incentivePerCar,
        nextLabel: slab.label || `Next Tier`,
      };
    }
  }
  return null; // Already at highest tier
}

module.exports = { calculateIncentive, getNextMilestone };
