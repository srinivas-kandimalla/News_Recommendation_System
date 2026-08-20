export const formatDate = (value) => {
  if (!value) return 'Recently added';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently added' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
};

export const truncate = (value = '', length = 145) => (value.length > length ? `${value.slice(0, length).trim()}…` : value);

export const initials = (name = '') => name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
