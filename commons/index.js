// redirect pages nếu chưa login
export const redirectPages = (value) => {
  const redirectState = ['/profile'];
  const getRedirect = redirectState.indexOf(value);
  if (getRedirect !== -1) {
    return true;
  }
  return false;
};
