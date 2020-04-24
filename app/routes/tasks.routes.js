const auth = require('../middleware/auth.js');
var multer = require('multer');
var crypto = require('crypto');
var mime = require('mime-types');
var config = require('../../config/app.config.js');
var tasksConfig = config.tasks;
var storage = multer.diskStorage({
    destination: tasksConfig.documentsUploadPath,
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            if (err) return cb(err)

            cb(null, raw.toString('hex') + "." + mime.extension(file.mimetype))
        })
    }
});
var fileUpload = multer({ storage: storage });
module.exports = (app) => {
    const tasks = require('../controllers/tasks.controller.js');
    app.post('/tasks/create',auth, fileUpload.fields([{ name: 'documents', maxCount: 5 }]), tasks.addTask);
    app.get('/tasks/list',auth, tasks.listTask);
    app.get('/tasks/list-unassigned',auth, tasks.listUnassignedTasks);
    app.get('/tasks/detail/:id',auth, tasks.detailTask);
    app.post('/tasks/submit-report/:id',auth, tasks.submitTaskReport);
    app.delete('/tasks/delete/:id',auth, tasks.deleteTask);
    app.patch('/tasks/update/:id',auth, tasks.updateTask);
    app.patch('/tasks/transfer/:id',auth, tasks.transferTask);
    app.post('/tasks/add-more',auth,fileUpload.fields([{ name: 'documents', maxCount: 5 }]), tasks.appendFilesArray);
    app.patch('/tasks/remove-doc',auth,tasks.removeDocs)
};
