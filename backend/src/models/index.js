// Single import point for all Mongoose models.

module.exports = {
  User:                require('./user.model'),
  StudentGroup:        require('./studentGroup.model'),
  PasswordResetToken:  require('./passwordResetToken.model'),
  Complaint:           require('./complaint.model'),
  ComplaintComment:    require('./complaintComment.model'),
  Leave:               require('./leave.model'),
};
