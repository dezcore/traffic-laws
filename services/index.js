const helper = require('../helper');
const config = require('../config');

async function getMultiple(page = 1){
  return {"message": "Hello world !"};
}

async function create(programmingLanguage){ 
    return {"message": "Hello world !"};
}

async function update(id, programmingLanguage){
 return {"message": "Hello world !"};
}

async function remove(id){
    return {"message": "Hello world !"};
}

module.exports = {
  getMultiple,
  create,
  update,
  remove
}