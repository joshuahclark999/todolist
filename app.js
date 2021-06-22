//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
require('dotenv').config()
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect(process.env.URI || 'mongodb+srv://mongoDBUser:rWw7O7EjunfSN6jU@cluster0.qt0qr.mongodb.net/todolist?retryWrites=true&w=majority',{
  useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false
},(err)=>{
  if(err) console.error(err);
});

const connection = mongoose.connection;

connection.once("open", function () {
	console.log("MongoDB database connection established successfully");
});

const todoSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", todoSchema);

const item1 = new Item({
    name: "Welcome!"
});
const item2 = new Item({
  name: "<-- Click here to delete an item."
});
const item3 = new Item({
  name: "Press + to add a new item."
});

const defaultItems = [item1,item2,item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [todoSchema]
});
const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({},(err,items)=>{
    if(err) return console.error(err);
    if(items.length === 0){
      Item.insertMany(defaultItems,(err)=>{
        if(err) return console.error(err);
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  });

});
app.get("/:newListName",(req,res)=>{
  const listName = _.capitalize(req.params.newListName);

  List.findOne({name: listName},(err,foundList)=>{
    if (!err){
      if(!foundList){
        //Create new list
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+ listName)
      }else{
        //Show the list.
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    };
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if(listName == "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName},(err, foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+ listName);
    })
  }
});


app.post("/delete",(req,res)=>{
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if(listName == "Today"){
    Item.findByIdAndRemove(checkedItem,(err,deletedDoc)=>{
      if(!err){
        res.redirect("/");
      };
     });
  }else {
    List.findOneAndUpdate({name: listName}, {$pull:{items: {_id: checkedItem}}},(err,foundList)=>{
      if(!err){
        res.redirect("/"+ listName);
      }
    })
  }
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started succesfully");
});
