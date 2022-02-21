function removeUndefinedAndEmpty(obj) {
  Object.entries(obj).forEach(([key, value]) => {
    if (key === "auth") { return; }
    if (value === undefined) { delete obj[key]; }
    if (Array.isArray(value) && value.length === 0) { delete obj[key]; }
    if (typeof (value) === "object") {
      removeUndefinedAndEmpty(value);
      if (Object.keys(value).length === 0) { delete obj[key]; }
    }
  });
  return obj;
}

module.exports = {
  removeUndefinedAndEmpty,
};
