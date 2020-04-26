import 'core-js/stable';
import 'regenerator-runtime/runtime';
import '@styles';

// Separate import for initial fonts so that we can inline them into html.
import '@styles/fonts';

// Import all fonts used in the app and normalize reflow.
import openSansRegularWoff2 from '@fonts/open-sans/OpenSans-Regular.woff2';
import openSansRegularWoff from '@fonts/open-sans/OpenSans-Regular.woff';
import openSansBoldWoff2 from '@fonts/open-sans/OpenSans-Bold.woff2';
import openSansBoldWoff from '@fonts/open-sans/OpenSans-Bold.woff';

const OPEN_SANS = 'Open Sans';
const WEIGHT_BOLD = 700;

const getFontUrlString = (fonts) =>
  fonts.reduce((str, font, idx) => {
    const ext = font.slice(font.lastIndexOf('.') + 1);
    const lastUrl = idx === fonts.length - 1;

    return str + `url(${font})format('${ext}')${lastUrl ? '' : ','}`;
  }, '');

if ('fonts' in document) {
  const regular = new FontFace(
    OPEN_SANS,
    getFontUrlString([openSansRegularWoff2, openSansRegularWoff])
  );
  const bold = new FontFace(
    OPEN_SANS,
    getFontUrlString([openSansBoldWoff2, openSansBoldWoff]),
    { weight: WEIGHT_BOLD }
  );

  Promise.all([regular.load(), bold.load()]).then((fonts) =>
    fonts.forEach((font) => document.fonts.add(font))
  );
}

const getFontFaceString = (props, fontSrcs) => {
  let result = '@font-face{';
  let srcString = 'src:';

  Object.entries(props).forEach(([prop, val]) => (result += `${prop}:${val};`));
  srcString += getFontUrlString(fontSrcs) + ';';
  result += srcString + '}';

  return result;
};

if (!('fonts' in document) && 'head' in document) {
  const style = document.createElement('style');
  const fontFamily = `'${OPEN_SANS}'`;

  style.innerHTML = [
    getFontFaceString({ 'font-family': fontFamily }, [
      openSansRegularWoff2,
      openSansRegularWoff,
    ]),
    getFontFaceString({ 'font-family': fontFamily, weight: WEIGHT_BOLD }, [
      openSansBoldWoff2,
      openSansBoldWoff,
    ]),
  ].join('');

  document.head.appendChild(style);
}
