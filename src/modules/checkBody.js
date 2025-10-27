function checkBody(body, keys, emailFields = []) {
  let isValid = true;

  for (const field of keys) {
    if (!body[field] || body[field] === "") {
      isValid = false;
    }
  }
  // verification email
  /*const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/i;
  for (const emailField of emailFields) {
    if (body[emailField] && !emailRegex.test(body[emailField])) {
      isValid = false;
    }
  }*/
  return isValid;
}

module.exports = { checkBody };
