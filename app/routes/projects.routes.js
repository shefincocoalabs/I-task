const auth = require('../middleware/auth.js');
var multer = require('multer');
var crypto = require('crypto');
var mime = require('mime-types');
var config = require('../../config/app.config.js');

var storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            if (err) return cb(err)

            cb(null, raw.toString('hex') + "." + mime.extension(file.mimetype))
        })
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
    app.patch('/projects/remove-doc',auth,projects.removeDocs)
};


