/**
 * Dependencies
 */

var config = require('config');
var debug = require('debug')(config.name() + ':404-page');
var view = require('view');

/**
 * Expose `View`
 */

var View = module.exports = view(require('./template.html'));
