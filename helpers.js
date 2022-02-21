function removeUndefinedAndEmpty(obj) {
  const objCopy = { ...obj };
  Object.entries(objCopy).forEach(([key, value]) => {
    if (key === "auth") {
      return;
    }
    if (value === undefined) {
      delete objCopy[key];
    }
    if (Array.isArray(value) && value.length === 0) {
      delete objCopy[key];
    }
    if (typeof (value) === "object") {
      removeUndefinedAndEmpty(value);
      if (Object.keys(value).length === 0) {
        delete objCopy[key];
      }
    }
  });
  return objCopy;
}

module.exports = {
  removeUndefinedAndEmpty,
};
