export const Platform = {
  OS: 'ios',
  select: (obj: any) => obj.ios || obj.default,
};

export const StyleSheet = {
  create: (styles: any) => styles,
};

export default {
  Platform,
  StyleSheet,
};
