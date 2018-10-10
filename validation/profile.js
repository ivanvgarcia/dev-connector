const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateProfileInput(data) {
  let errors = {};
  siteUrls = [
    "website",
    "youtube",
    "twitter",
    "facebook",
    "linkedin",
    "instagram"
  ];

  dataFields = ["handle", "status", "skills"];
  dataFields.forEach(field => {
    data[field] = !isEmpty(data[field]) ? data[field] : "";
    if (Validator.isEmpty(data[field])) {
      errors[field] = `${field} is required`;
    }
  });

  if (!Validator.isLength(data.handle, { min: 2, max: 40 })) {
    errors.handle = "Handle must be between 2 and 40 characters";
  }

  if (Validator.isEmpty(data.handle)) {
    errors.handle = "Handle is required";
  }
  siteUrls.forEach(url => {
    if (!isEmpty(data[url])) {
      if (!Validator.isURL(data[url])) {
        errors[url] = `Badly formatted URL for ${url}`;
      }
    }
  });
  return {
    errors,
    isValid: isEmpty(errors)
  };
};
