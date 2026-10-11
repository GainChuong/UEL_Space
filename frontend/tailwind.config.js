/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'uel-blue': '#003B71',
        'sky-blue': '#00A3E0',
        'uel-orange': '#FF7900',
        'bg-gray': '#F5F7FA',
        'dark-text': '#111827',
        'text-muted': '#6B7280',
        'border-gray': '#E5E7EB',
        'status-available': '#10B981',
        'status-in-use': '#3B82F6',
        'status-reserved': '#F59E0B',
        'status-maintenance': '#9CA3AF',
        'status-restricted': '#EF4444',
      },
      fontFamily: {
        sans: ['"Roboto"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        'roboto': ['"Roboto"', 'sans-serif'],
        'montserrat': ['"Montserrat"', 'sans-serif'],
        'share-tech': ['"Share Tech"', 'sans-serif'],
        'lora': ['"Lora"', 'serif'],
        'be-vietnam': ['"Roboto"', 'sans-serif'],
      },
      borderRadius: {
        'pill': '9999px',
        'card': '1.25rem',
      }
    },
  },
  plugins: [],
}
