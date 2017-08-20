var concat = require('gulp-concat');
var es = require('event-stream');
var gutil = require('gulp-util');
var path = require('path');

function cacheTranslations(options) {
  return es.map(function(file, callback) {
    var language;
    if (options.language) {
      language = options.langauge;
    } else {
      var matchPrefix, matchLocale;
      var expression = /^([a-zA-Z0-9]*?)-?([a-z]{2}(?:[_|-][A-Z]{2})?)\.json$/;
      var match = expression.exec(file.path.split(path.sep).pop());

      matchPrefix = match[1];
      matchLocale = match[2];

      language = matchLocale;
      var supportedPrefixes = options.prefixes;
      if (supportedPrefixes && matchPrefix && supportedPrefixes.includes(matchPrefix)) {
        language = `${matchPrefix}-${language}`
      }
    }

    file.contents = new Buffer(gutil.template('$translateProvider.translations("<%= language %>", <%= contents %>);\n', {
      contents: file.contents,
      file: file,
      language: language
    }));
    callback(null, file);
  });
}

function wrapTranslations(options) {
  return es.map(function(file, callback) {
    file.contents = new Buffer(gutil.template('angular.module("<%= module %>"<%= standalone %>).config(["$translateProvider", function($translateProvider) {\n<%= contents %>}]);\n', {
      contents: file.contents,
      file: file,
      module: options.module || 'translations',
      standalone: options.standalone === false ? '' : ', []'
    }));
    callback(null, file);
  });
}

function gulpAngularTranslate(filename, options) {
  if (typeof filename === 'string') {
    options = options || {};
  } else {
    options = filename || {};
    filename = options.filename || 'translations.js';
  }
  return es.pipeline(
    cacheTranslations(options),
    concat(filename),
    wrapTranslations(options)
  );
};

module.exports = gulpAngularTranslate;
