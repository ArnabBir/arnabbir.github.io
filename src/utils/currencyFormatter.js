export const formatIndianCurrency = (value) => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  let formattedValue = formatter.format(value);

  // Remove the '₹' symbol as we'll add it manually
  formattedValue = formattedValue.replace('₹', '').trim();

  // Add the appropriate suffix (Cr, Lac, etc.)
  if (value >= 10000000) {
    formattedValue = (value / 10000000).toFixed(2) + ' Cr';
  } else if (value >= 100000) {
    formattedValue = (value / 100000).toFixed(2) + ' Lac';
  } else if (value >= 1000) {
    formattedValue = (value / 1000).toFixed(2) + ' K';
  }

  return '₹' + formattedValue;
};