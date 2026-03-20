export const getMandiPrice = async (crop, location) => {
  // TODO: Phase 3 - Implement SerpAPI or Agmarknet
  // Fallback mock response when no real API is hooked
  const price = crop ? 1500 + Math.floor(Math.random() * 1000) : 2200;
  return {
    crop: crop || 'General Crop',
    location: location || 'Local Mandi',
    price: price,
    unit: 'Qtl',
    trend: 'rising'
  };
};
