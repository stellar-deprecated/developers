import _ from "lodash";
import path from "path";

/**
 * Ultra-simple math formula formatting (as Metalsmith middleware).
 * A richer version might use Ascii2MathML (runarberg.github.io/ascii2mathml) or
 * MathJax (mathjax.org), but:
 *   - MathML support is not so good (http://caniuse.com/#feat=mathml)
 *   - MathJax can do a nice non-MathML render, but it is a little complex and
 *     it (and AsciiMath) is very oriented towards traditional mathematical
 *     formulae and doesn't some constructs we'd like well (e.g. multiplication
 *     symbols, pretty variable names with spaces).
 * So, do something simpler here which suits our purposes for now.
 *
 * Finds "```math-formula" code blocks in Markdown and converts them to
 * `<div class="math-formula">` with some additional typography cleanup and
 * markup/classes around types of symbols (operators, parens, etc).
 * 
 * Inline blocks are delimited by `$$` and are displayed without modified
 * font sizes and margins so as not to disrupt text flow.
 */
export default function mathFormula(files, metalsmith, done) {
  _.chain(files)
    .filter(isMarkdown)
    .each(file => {
      file.contents = file.contents.toString()
        .replace(
          /\n```math-formula\n((?:.|\n)*?)\n```\n/g,
          (token, content) => `\n${formatFormula(content)}\n`)
        .replace(
          /\$\$(.+?)\$\$/g,
          (token, content) => formatFormula(content, true));
    })
    .value();
  done();
}

function isMarkdown(file, filePath) {
  return /\.(md|markdown|mdown)$/.test(path.extname(filePath));
}

function formatFormula(text, inline = false) {
  const formatted =
    prettyParentheses(
      prettyVariables(
        prettyNumbers(
          prettyExponents(
            prettyOperators(text)))));
  const tagName = inline ? 'code' : 'figure';
  return `<${tagName} class="math-formula">${formatted}</${tagName}>`;
}

function prettyOperators(text) {
  return text
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/\+-/g, '±')
    .replace(/\-/g, '−')
    .replace(/\!=/g, '≠')
    .replace(/<=/g, '≤')
    .replace(/>=/g, '≥')
    .replace(
      /([×÷=≠≤≥]|\s[+−]\s)/g,
      '<span class="math-formula-operator">$1</span>');
}

function prettyVariables(text) {
  return text.replace(/\[(.+?)\]/g, '<var>$1</var>');
}

// NOTE: this won't handle [variables with spaces]; we'd need more rigorous
// parsing than this simple pile of regexes for that.
function prettyExponents(text) {
  return text
    .replace(/\^\(([^)]+)\)/g, '<sup>$1</sup>')
    .replace(/\^(\S+)/g, '<sup>$1</sup>');
}

function prettyParentheses(text) {
  return text
    // NOTE: the parenthesis character in the replacement is a special paren 
    .replace(/\(/g, '<span class="math-formula-paren open">(</span>')
    .replace(/\)/g, '<span class="math-formula-paren close">)</span>');
}

function prettyNumbers(text) {
  return text
    .replace(/\d+(\.\d*)?/g, '<span class="math-formula-number">$&</span>');
}
