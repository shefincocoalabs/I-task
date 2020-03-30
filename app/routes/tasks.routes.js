module.exports = (app,methods,options) => {
    const tasks = methods.loadController('tasks',options);
    tasks.methods.post('/create',tasks.addTask, {auth:true});
    tasks.methods.get('/list',tasks.listTask, {auth:true});
    tasks.methods.get('/delete/:id',tasks.deleteTask, {auth:true});
    tasks.methods.get('/update/:id',tasks.updateTask, {auth:true});
    
}