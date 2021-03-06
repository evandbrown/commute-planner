/**
 * Dependencies
 */

var bcrypt = require('bcryptjs');
var config = require('../../config.json')[process.env.NODE_ENV];
var Email = require('../email/model');
var mandrill = require('../mandrill');
var mongoose = require('../mongo');
var uuid = require('node-uuid');

/**
 * Create `schema`
 */

var schema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: String,
  change_password_key: String,
  type: String
});

/**
 * Encrypt the password every time it is modified
 */

schema.pre('save', true, function(next, done) {
  next();
  if (this.isNew && !this.password) this.password = uuid.v4().replace(/-/g,
    '');
  if (this.isModified('password')) {
    var self = this;
    bcrypt.hash(this.password, 10, function(err, hash) {
      if (err) {
        done(err);
      } else {
        self.password = hash;
        done();
      }
    });
  } else {
    done();
  }
});

/**
 * Compare
 */

schema.methods.comparePassword = function(password, callback) {
  bcrypt.compare(password, this.password, callback);
};

/**
 * Reset a user's password
 */

schema.methods.sendChangePasswordRequest = function(callback) {
  this.change_password_key = uuid.v4().replace(/-/g, '');

  var base = config.base_url;
  if (this.type !== 'commuter') base += '/manager';

  var options = {
    change_password_url: base + '/change-password/' + this.change_password_key,
    subject: 'Change Password Requested',
    template: 'change-password-request',
    to: {
      email: this.email
    }
  };

  var self = this;
  this.save(function(err) {
    if (err) return callback(err);
    mandrill.send(options, function(err, result) {
      if (err) {
        callback(err);
      } else {
        Email.create({
          _user: self._id,
          metadata: options,
          result: result
        }, callback);
      }
    });
  });
};

/**
 * Find or create
 *
 * @param {String} email
 * @param {Function} callback
 */

schema.statics.findOrCreate = function(data, callback) {
  var email = (data.email || '').toLowerCase();
  if (!email || email.length < 5) return callback(new Error('Invalid email.'));

  var self = this;
  this.findOne({
    email: email
  }, function(err, user) {
    if (err) {
      callback(err, user);
    } else if (user) {
      callback(null, user, true);
    } else {
      self.create({
        email: email,
        type: data.type
      }, callback);
    }
  });
};

/**
 * Plugins
 */

schema.plugin(require('../plugins/mongoose-trackable'));
schema.plugin(require('../plugins/mongoose-querystring'));

/**
 * Expose `User`
 */

var User = module.exports = mongoose.model('User', schema);
