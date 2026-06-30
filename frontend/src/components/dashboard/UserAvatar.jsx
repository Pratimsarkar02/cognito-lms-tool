// frontend/src/components/dashboard/UserAvatar.jsx
const PALETTE = [
  { bg: 'bg-indigo-500',  text: 'text-white' },
  { bg: 'bg-emerald-500', text: 'text-white' },
  { bg: 'bg-rose-500',    text: 'text-white' },
  { bg: 'bg-amber-500',   text: 'text-white' },
  { bg: 'bg-sky-500',     text: 'text-white' },
  { bg: 'bg-violet-500',  text: 'text-white' },
  { bg: 'bg-teal-500',    text: 'text-white' },
  { bg: 'bg-pink-500',    text: 'text-white' },
];

// Deterministic color pick based on name so the same user always gets the same color
const getColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

/**
 * @param {string} firstName
 * @param {string} lastName
 * @param {'sm'|'md'|'lg'} size  - sm=8, md=12, lg=14 (Tailwind units)
 */
const UserAvatar = ({ firstName = '', lastName = '', size = 'md' }) => {
  const fullName = `${firstName}${lastName}`.trim() || '?';
  const initial = (firstName?.[0] || lastName?.[0] || '?').toUpperCase();
  const { bg, text } = getColor(fullName);

  const sizeMap = {
    sm:  'w-8  h-8  text-sm',
    md:  'w-12 h-12 text-base',
    lg:  'w-14 h-14 text-lg',
  };

  return (
    <div
      className={`${sizeMap[size]} ${bg} ${text} rounded-full flex items-center justify-center font-semibold shrink-0 select-none`}
      aria-label={`${firstName} ${lastName}`}
    >
      {initial}
    </div>
  );
};

export default UserAvatar;