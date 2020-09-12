// imports
const convert = require('xml-js');
const fs = require('fs');

/**
 * Configuration start
 */
const MAX = 100; // how many combinations to generate
const ADJOK = false; // is it ok to have adjacent repeated motives
const motives = {
  A: [2, 3], // Motive A is measures 2 and 3
  B: [4, 5],
  C: [8],
  D: [10, 11],
  E: [16],
  F: [17],
  G: [19],
  H: [22],
  I: [23],
};
// we want motive A to happen twice in the new score,
// motive C to happen 4 times and so on
const distribution = 'AADDFFEEEBGHICCCC';
/**
 * Configuration end
 */

// read the "template" score
const xml = fs.readFileSync('Template.mscx', 'utf8');
const options = {compact: true, ignoreComment: true, spaces: 4};
const source = convert.xml2js(xml, options);

// an array of all measures
const origMeasures = source.museScore.Score.Staff.Measure;

// extract the patterns from the template
const patterns = {};
Object.keys(motives).forEach((letter) => {
  patterns[letter] = [];
  motives[letter].forEach((m) => {
    patterns[letter].push(origMeasures[m - 1]); // measures start from 1, arrays from 0
  });
});

function checkAdjecents(combo) {
  if (ADJOK) {
    return true;
  }
  for (let i = 1; i < combo.length; i++) {
    if (combo[i] === combo[i - 1]) {
      return false;
    }
  }
  return true;
}

// generate MAX random combinations
const combinations = new Set();
let these = distribution.split('');
while (combinations.size < MAX) {
  these.sort(() => 0.5 - Math.random());
  if (checkAdjecents(these)) {
    combinations.add(these.join(''));
  }
}

combinations.forEach((combo) => {
  // first and last measures are always the same
  const last = origMeasures[origMeasures.length - 1];
  const first = origMeasures[0];

  const newMeasures = [first];
  combo.split('').forEach((letter) => {
    patterns[letter].forEach((_, idx) => {
      newMeasures.push(patterns[letter][idx]);
    });
  });
  newMeasures.push(last);

  source.museScore.Score.Staff.Measure = newMeasures;
  source.museScore.Score.Staff.VBox.Text[0].text._text = combo;

  fs.writeFileSync('out/' + combo + '.mscx', convert.js2xml(source, options));
});
