function toSlug(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function generateUniqueSlug(name, findBySlug, excludeId = null) {
  const base = toSlug(name) || `space-${Date.now()}`;
  let candidate = base;
  let counter = 1;
  while (findBySlug) {
    const existing = await findBySlug(candidate);
    if (!existing || (excludeId && String(existing._id) === String(excludeId))) {
      return candidate;
    }
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  return candidate;
}

module.exports = { toSlug, generateUniqueSlug };
