module.exports = function (eleventyConfig) {
  // Copy Static Files to /_Site
  eleventyConfig.addPassthroughCopy("./src/static/css");
  eleventyConfig.addPassthroughCopy("./src/_redirects");
  eleventyConfig.addPassthroughCopy("./src/static/img");
  eleventyConfig.addPassthroughCopy({
    "./src/admin/config.yml": "./admin/config.yml"
  });

  eleventyConfig.addCollection("locales", function(collectionApi) {
    // inpired by
    // https://www.webstoemp.com/blog/language-switcher-multilingual-jamstack-sites/
    const translationsByKey = collectionApi.getAll().reduce(
      (transByKey, page)=>{
        const locale = determineLocale(page);
        const key = determineTranslationKey(page);
        transByKey[key] = transByKey[key] || {};
        const translations = transByKey[key];
        translations[locale] = {locale, page};
        return transByKey;
      },{});
    const localesByPath = Object.values(translationsByKey).reduce(
      (locsByPath, ts) => {
        const defaultTranslation = ts[DEFAULT_LOCALE];
        Object.values(ts).forEach(t => {
          const {locale, page} = t;
          const translations = LOCALES
                .filter(loc => loc != locale )
                .map(loc => ts[loc]);
          locsByPath[page.inputPath] =
            {locale, page, defaultTranslation, translations};
        });
        return locsByPath;
      },{});
    return localesByPath;
  });
  
  eleventyConfig.addNunjucksShortcode("creditedImage", function(href, alt, title, credits) {
    var caption = credits ? `copyright ${credits}` : '';
    return `<div><img src="${href}" alt="${alt}" title="${title}" ><div>${caption}</div></div>`;
  });
  
  // Let Eleventy transform HTML files as nunjucks
  // So that we can use .html instead of .njk
  return {
    dir: {
      input: "src",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};

// this must match the cms locales in src/admin/config.yml
const LOCALES = ["en", "fr"]
const LOCALE_REGEX = new RegExp(`\/(${LOCALES.join('|')})\/`);
const DEFAULT_LOCALE = LOCALES[0];

const determineLocale = (page) => {
    const matches = LOCALE_REGEX.exec(page.inputPath);
    return matches && matches[1] ? matches[1] : DEFAULT_LOCALE;
};

const determineTranslationKey = (page) => {
    if(!page.url) { return page.url; }
    const locale = determineLocale(page);
    return page.url.replace(locale+'/', '');
};
