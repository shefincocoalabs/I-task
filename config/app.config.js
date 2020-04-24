module.exports = {
  gateway: {
    url: "http://localhost:5000"
  },
  otp: {
    expirySeconds: 2 * 60
  },
  users: {
    imageUploadPath: '/var/www/html/I-task/images/profile-images/'
  },
  members: {
    imageUploadPath: '/var/www/html/I-task/images/member-images/',
    resultsPerPage: 30,
  },
  tasks: {
    documentsUploadPath: '/var/www/html/I-task/files/task-documents/',
    resultsPerPage: 30,
  },
  projects: {
    documentsUploadPath: '/var/www/html/I-task/files/project-documents/',
    resultsPerPage: 30,
  },
}
