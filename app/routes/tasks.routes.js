module.exports = (app,methods,options) => {
    const tasks = methods.loadController('tasks',options);
    tasks.methods.post('/create',tasks.addTask, {auth:true});
    tasks.methods.get('/list',tasks.listTask, {auth:true});
    tasks.methods.get('/list-unassigned',tasks.listUnassignedTasks, {auth:true});
    tasks.methods.get('/detail/:id',tasks.detailTask, {auth:true});
    tasks.methods.post('/submit-report/:id',tasks.submitTaskReport, {auth:true});
    tasks.methods.delete('/delete/:id',tasks.deleteTask, {auth:true});
    tasks.methods.patch('/update/:id',tasks.updateTask, {auth:true});
    tasks.methods.patch('/transfer/:id',tasks.transferTask, {auth:true});
    
}