function sampleController(methods, options) {
  this.sampleUpload = (req, res) => {
   console.log(req.body);
   console.log(req.file);
  };

  this.getMulter = (multer) => {
    let path = 'uploads/';
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path)
      },
      filename: function (req, file, cb) {
        let pathImage = path + file.originalname
        console.log("first")
        let imageName = makeFileNameUnique(pathImage);
        imageName = imageName.replace(path, "");
        console.log(imageName)
        cb(null, imageName)
      }
    })
    var upload = multer({
      storage: storage
    })
    //   upload = upload.array('image');
    upload = upload.single('avatar');
    // multiUpload = upload.arrays('image');
    return upload;
    // return upload.array('image');
  }


}
function makeFileNameUnique(fileAbsPath,orginalPath,index) {
    const fs = require("fs");
    if(!fileAbsPath) return fileAbsPath;
    orginalPath = orginalPath?orginalPath:fileAbsPath;
    if(!fs.existsSync(fileAbsPath)) {
        //console.log("File "+fileAbsPath+" does not exist. No renaming needed");
        return fileAbsPath;
    } else {
        index = index?index:0;
        index++;
        var fileAbsPathParts = orginalPath.split(".");
        var positionToModify = fileAbsPathParts.length-2;
        if(fileAbsPathParts.length == 1) {
            positionToModify = 0;
        }
        fileAbsPathParts[positionToModify] += "-"+index;
        fileAbsPath = fileAbsPathParts.join(".");
        return makeFileNameUnique(fileAbsPath,orginalPath,index);
    }
}
module.exports = sampleController;
