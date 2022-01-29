export {
  HI_NOT_VALID_COLOR_ERR
};

const HI_NOT_VALID_COLOR_ERR = (name: string, color: string) => {
  return `${name}: ${color} is not a valid color name`;
};
