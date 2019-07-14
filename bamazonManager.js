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
    menuOptions();
})

function menuOptions() {
    inquirer.prompt([
        {
            type: "list",
            message: "What would you like to do?",
            choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product", "Quit"],
            name: "choice"
        }
    ]).then(function(response) {
        switch(response.choice){
            case "View Products for Sale":
                viewProducts(false, "");
                break;
            case "View Low Inventory":
                viewProducts(false, " WHERE stock_quantity<5");
                break;
            case "Add to Inventory":
                viewProducts(true, "");
                break;
            case "Add New Product":
                addProduct();
                break;
            default:
                connection.end();
                break;
        }
    })
}

function addProduct() {
    inquirer.prompt([
        {
            type: "input",
            message: "What is the name of this product?",
            name: "productName"
        },
        {
            type: "input",
            message: "What department is this product in?",
            name: "departmentName"
        },
        {
            type: "input",
            message: "What is the price of this item?",
            name: "price"
        },
        {
            type: "number",
            message: "How much of this item is in inventory?",
            name: "quantity"
        }
    ]).then(function(response) {
        connection.query("INSERT INTO products(product_name, department_name, price, stock_quantity) VALUES (?, ?, ?, ?)",
        [response.productName, response.departmentName, response.price, response.quantity],
        function(err, res) {
            if(err) throw err;
            console.log(res.affectedRows + " item added!\n");
            menuOptions();
        })
    })
}

function viewProducts(addMore, addOn) {
    connection.query("SELECT * FROM products" + addOn, function(err, res) {
        if(err) throw err;
        console.log("Products:\n");
        var idLimit = res.length;
        for(var i = 0;i < res.length;i++){
            console.log(`ID: ${res[i].item_id}, Name: ${res[i].product_name}, Department: ${res[i].department_name}, Price: ${res[i].price}, Quantity: ${res[i].stock_quantity}`);
            console.log("----------------------------------------------------------------------");
        }
        if(!addMore){
            menuOptions();
        } else {
            inquirer.prompt([
                {
                    type: "number",
                    message: "Which product inventory would you like to add to? (Please indicate the product via its ID)",
                    name: "product_id"
                },
                {
                    type: "number",
                    message: "How much of this product would you like to add?",
                    name: "quantity"
                }
            ]).then(function(response) {
                var desiredID = parseInt(response.product_id);
                if((desiredID > idLimit) || (desiredID < 1)){
                    console.log("That ID is not available!");
                    menuOptions();
                } else {
                    var desiredQuantity = parseInt(response.quantity);
                    connection.query("SELECT * FROM products WHERE item_id=?", [desiredID], function(err, res){
                        if(err) throw err;
                        var newQuantity = parseInt(res[0].stock_quantity) + desiredQuantity;
                        connection.query("UPDATE products SET stock_quantity=? WHERE item_id=?", [newQuantity, desiredID], function(err, res){
                            console.log("Inventory updated!");
                            menuOptions();
                        });
                    });
                    }
                })
        }
    })
}