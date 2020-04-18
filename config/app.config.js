
var relativeCommonPath = "../I-task-uploads/";
module.exports = {
  gateway: {
    url: "http://localhost:5000"
  },
  otp: {
    expirySeconds: 2 * 60
  },
  members: {
    imageUploadPath: relativeCommonPath + "members/images",
    resultsPerPage: 30,
  },
  tasks: {
    resultsPerPage: 30,
  },
  projects: {
    resultsPerPage: 30,
  },
}
