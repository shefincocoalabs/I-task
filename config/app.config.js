var commonStorePath = 'http://172.104.61.150/I-task/'
module.exports = {
  gateway: {
    url: "http://localhost:5000"
  },
  otp: {
    expirySeconds: 2 * 60
  },
  users: {
    imageBase: commonStorePath + 'images/profile-images/',
    imageUploadPath: '/var/www/html/I-task/images/profile-images/'
  },
  members: {
    imageBase: commonStorePath + 'images/member-images/',
    imageUploadPath: '/var/www/html/I-task/images/member-images/',
    resultsPerPage: 30,
  },
  tasks: {
    fileBase: commonStorePath + 'files/task-documents/',
    documentsUploadPath: '/var/www/html/I-task/files/task-documents/',
    resultsPerPage: 30,
  },
  projects: {
    fileBase: commonStorePath + 'files/project-documents/',
    documentsUploadPath: '/var/www/html/I-task/files/project-documents/',
    resultsPerPage: 30,
  },
}
