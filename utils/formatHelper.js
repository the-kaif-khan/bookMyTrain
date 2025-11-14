module.exports = {
  formatName: (name) => {
    if(!name) return '';
    return String(name)
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => 
      c.toUpperCase()
    );
  }
};