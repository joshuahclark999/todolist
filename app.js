//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://mongoDBUser:rWw7O7EjunfSN6jU@cluster0.qt0qr.mongodb.net/todolist?retryWrites=true&w=majority",{
  useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false
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
        console.log("Success");
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
    Item.findByIdAndRemove(checkedItem,(err)=>{
      if(!err){
        console.log("Successfully deleted");
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

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
