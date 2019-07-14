var inquirer = require("inquirer");
var mysql = require("mysql");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "bamazon"
});

connection.connect(function(err) {
    if(err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    startBamazon();
})

function startBamazon() {
    connection.query("SELECT * FROM products", function(err, res) {
        if(err) throw err;
        console.log("Products:\n");
        var idLimit = res.length;
        for(var i = 0;i < res.length;i++){
            console.log(`ID: ${res[i].item_id}, Name: ${res[i].product_name}, Department: ${res[i].department_name}, Price: ${res[i].price}, Quantity: ${res[i].stock_quantity}`);
            console.log("----------------------------------------------------------------------");
        }
        inquirer.prompt([
            {
                type: "number",
                message: "What product would you like to purchase? (Please indicate the product via the product ID)",
                name: "product_id"
            },
            {
                type: "number",
                message: "How many of this product would you like?",
                name: "quantity"
            }
        ]).then(function(response) {
            var desiredID = parseInt(response.product_id);
            if((desiredID > idLimit) || (desiredID < 1)){
                console.log("That ID is not available!");
                endOrder();
            } else {
            var desiredQuantity = parseInt(response.quantity);
            connection.query("SELECT * FROM products WHERE item_id=?", [desiredID], function(err, res) {
                if(err) throw err;
                if(parseInt(res[0].stock_quantity) < desiredQuantity){
                    console.log("Quantity is not sufficient!");
                    endOrder();
                } else {
                    var totalPrice = res[0].price * desiredQuantity;
                    console.log("Order successful!");
                    var newQuantity = parseInt(res[0].stock_quantity) - desiredQuantity;
                    connection.query("UPDATE products SET stock_quantity=? WHERE item_id=?", [newQuantity, desiredID], function(err, res) {
                        console.log("Your total price was " + totalPrice + "!");
                        endOrder();
                    })
                }
            })
        }
        })
    })
}

function endOrder() {
    inquirer.prompt([
        {
            type: "list",
            message: "Do you wish to buy another item or quit?",
            choices: ["Buy another item", "Quit"],
            name: "choice"
        }
    ]).then(function(response) {
        if(response.choice === "Buy another item"){
            startBamazon();
        } else {
            connection.end();
        }
    })
}