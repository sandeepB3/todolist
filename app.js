const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const date = require(__dirname + "/date.js");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todolist!"
});

const item2 = new Item ({
  name: "Hit the + to add new tasks"
});

const item3 = new Item ({
  name: "<-- Click this to delete a task"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// let items = ["Study DSA", "Study Web Dev", "Go to the Gym"];
// let work = [];

app.get("/", function(req,res){

  // let day = date.getDate();
  Item.find(function(err, itemList){

    if(itemList.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log("Data Entered");
        }
      });
      res.redirect("/");
    }
    else{
      res.render("list",{listTitle: "Today", newItem: itemList});
    }
  });
});

// app.get("/work", function(req,res){
//   res.render("list",{listTitle: "Work List", newItem: work});
// });

app.get("/:newPage", function(req,res){
  const title = _.capitalize(req.params.newPage);

  List.findOne({name: title}, function(err, existing){
    if(!err){
      if(!existing){
        //Craete a list in the collection
        const list = new List ({
          name: title,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+title);
      }
      else{
        //Show the items of collection if existing
        res.render("list", {listTitle: existing.name, newItem: existing.items});
      }
    }
  });

});

app.post("/",function(req,res){
  console.log(req.body);
  let itemName = req.body.key;
  let listName = req.body.list;

  const newItem = new Item ({
    name: itemName
  });

  if(listName === "Today"){
    newItem.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listName} , function(err, existing){
      existing.items.push(newItem);
      existing.save();
      res.redirect("/"+listName);
    })
  }

});

app.post("/delete", function(req,res){
  let delItem = req.body.del;
  let listName =  req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(delItem, function(err){
      if(!err){
        console.log("Item Deleted");
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: delItem}}}, function(err, foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }


});

app.listen(process.env.PORT || 3000, function(){
  console.log("Server up and running");
});
