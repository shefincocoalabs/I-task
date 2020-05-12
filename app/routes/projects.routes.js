const auth = require('../middleware/auth.js');
var multer = require('multer');
var mime = require('mime-types');
var config = require('../../config/app.config.js');
var projectsConfig = config.projects;

var storage = multer.diskStorage({
    destination: projectsConfig.documentsUploadPath,
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + "." + mime.extension(file.mimetype))
    }
});
var fileUpload = multer({ storage: storage });
module.exports = (app) => {
    const projects = require('../controllers/projects.controller.js');
    app.post('/projects/add',auth,fileUpload.fields([{ name: 'documents', maxCount: 5 }]), projects.addProject);
    app.get('/projects/list',auth, projects.listProject);
    app.get('/projects/detail/:id',auth, projects.getProjectDetail);
    app.post('/projects/archieve/:id',auth, projects.archieveProject);
    app.patch('/projects/edit/:id',auth, projects.editProject);
    app.post('/projects/add-more',auth,fileUpload.fields([{ name: 'documents', maxCount: 5 }]), projects.appendFilesArray);
    app.patch('/projects/remove-doc',auth,projects.removeDocs);
    app.get('/projects/helper',auth,projects.helperApi);
    app.get('/projects/membersProjectData',auth, projects.membersProjectData);
    app.patch('/projects/changeAdmin',auth, projects.changeAdmin);
    app.delete('/projects/delete-task',auth, projects.deleteTask)
};


