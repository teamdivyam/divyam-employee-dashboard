export const functionStartDate = (item = {}) => item.fromDate || item.date || '';

export const sortFunctionsByFromDate = (items = []) => [...items].sort((left, right) => (
  new Date(functionStartDate(left) || '9999-12-31') - new Date(functionStartDate(right) || '9999-12-31')
));

const shortDate = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export const dateRangeLabel = (fromDate, toDate) => {
  const start = shortDate(fromDate);
  const end = shortDate(toDate);
  return end !== '-' && end !== start ? `${start} – ${end}` : start;
};
