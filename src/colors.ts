export enum CSS_COLORS {
  DEBUG = "#b0bec5",
  INFO = "#03a9f4",
  WARN = "#ffca28",
  ERROR = "#e53935",
};

class CSS_BUILDER {
  private cssString: string = "";

  static CSS_BOLD = "font-weight: bold;";

  color (color: CSS_COLORS) {
    this.cssString += `color: ${color.toString()};`;
    return this;
  }

  bold () {
    this.cssString += CSS_BUILDER.CSS_BOLD;
    return this;
  }

  build () {
    return this.cssString;
  }
}

const debug_default_css = new CSS_BUILDER().color(CSS_COLORS.DEBUG).build();
const debug_bold_css = new CSS_BUILDER().color(CSS_COLORS.DEBUG).bold().build();
const info_default_css = new CSS_BUILDER().color(CSS_COLORS.INFO).build();
const info_bold_css = new CSS_BUILDER().color(CSS_COLORS.INFO).bold().build();
const warn_default_css = new CSS_BUILDER().color(CSS_COLORS.WARN).build();
const warn_bold_css = new CSS_BUILDER().color(CSS_COLORS.WARN).bold().build();
const error_default_css = new CSS_BUILDER().color(CSS_COLORS.ERROR).build();
const error_bold_css = new CSS_BUILDER().color(CSS_COLORS.ERROR).bold().build();

export const Logger = {
  debug: (first: string, ...params: any[]) => {
    console.log(
      `%c[${new Date().toISOString()}] DEBUG: ` + `%c${first}`,
      debug_bold_css,
      debug_default_css,
      ...params
    );
  },
  info: (first: string, ...params: any[]) => {
    console.log(
      `%c[${new Date().toISOString()}] INFO: ` + `%c${first}`,
      info_bold_css,
      info_default_css,
      ...params
    );
  },
};
