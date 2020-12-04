const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const fetch = require('node-fetch')
const base64 = require('base-64')

let username = "";
let password = "";
let token = "";
let categories = [];
let tags = [];
let cart = [];
let productId = null;
let productInfo = [];
let productTag = [];
let review = [];

USE_LOCAL_ENDPOINT = false;
// set this flag to true if you want to use a local endpoint
// set this flag to false if you want to use the online endpoint
ENDPOINT_URL = ""
if (USE_LOCAL_ENDPOINT) {
  ENDPOINT_URL = "http://127.0.0.1:5000"
} else {
  ENDPOINT_URL = "https://mysqlcs639.cs.wisc.edu"
}



async function getToken() {
  let request = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + base64.encode(username + ':' + password)
    },
    redirect: 'follow'
  }

  const serverReturn = await fetch(ENDPOINT_URL + '/login', request)
  const serverResponse = await serverReturn.json()
  token = serverResponse.token

  return serverReturn.status;
}

async function getCategory() {
  let request = {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: 'follow'
  }

  let response = await fetch(ENDPOINT_URL + '/' + username + '/categories/', request);
  let result = await response.json();
  categories = result

  return
}

async function getCategoryTag(category) {
  let request = {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: 'follow'
  }

  let response = await fetch(ENDPOINT_URL + '/categories/' + category + '/tags', request);
  let result = await response.json();
  tags = result
  return response.status
}

async function getCart() {
  let request = {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: 'follow'
  }

  let response = await fetch(ENDPOINT_URL + '/application/products/', request);
  let result = await response.json();
  cart = result
  return
}

/* 
getProduct(product, true) to get a product id for a specific product and store the id in productId
getProduct(null, false) to get a list of all products and store it in variable products
*/
async function getProduct(product, specific) {
  let request = {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: 'follow'
  }

  let response = await fetch(ENDPOINT_URL + '/products', request);
  let result = await response.json();
  if (specific == true) {
    for (i = 0; i < result.products.length; i++) {
      if (result.products[i].name == product) {
        productId = result.products[i].id
        return result.products[i].id
      }
    }
  }
  else {
    products = result
    return
  }

}

async function getProductInfo() {
  let request = {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: 'follow'
  }
  // get basic info
  let response = await fetch(ENDPOINT_URL + '/products/' + productId, request);
  let result = await response.json();
  productInfo = result
  // get tags
  let resTag = await fetch(ENDPOINT_URL + '/products/' + productId + '/tags', request);
  let resultTag = await resTag.json();
  productTag = resultTag
  return
}

async function getReview() {
  let request = {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: 'follow'
  }

  let response = await fetch(ENDPOINT_URL + '/products/' + productId + '/reviews', request);
  let result = await response.json();
  review = result
  return
}

app.get('/', (req, res) => res.send('online'))
app.post('/', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })

  function welcome() {
    agent.add('Webhook works!')
    console.log(ENDPOINT_URL)
  }

  async function login() {
    // You need to set this from `username` entity that you declare in DialogFlow
    username = agent.parameters.username
    // You need to set this from password entity that you declare in DialogFlow
    password = agent.parameters.password


    if (await getToken() == 200) {
      agent.add('log in success!')
    }
    else {
      agent.add('log in failed. Please try to log in again')
    }
  }

  async function checklogin() {
    if (await getToken() == 200) {
      agent.add('log in success')
    }
    else {
      agent.add('log in failed')
    }
  }

  async function queryCategory() {
    await getCategory()
    // make all categories into a string
    categoryName = ""
    for (i = 0; i < categories.categories.length; i++) {
      categoryName += categories.categories[i] + " "
    }
    agent.add('The product categories we have are ' + categoryName)
  }

  async function queryTag() {
    category = agent.parameters.category
    if (await getCategoryTag(category) == 200) {
      tagName = ""
      for (i = 0; i < tags.tags.length; i++) {
        tagName += tags.tags[i] + " "
      }
      agent.add('The tags under category ' + category + ' are ' + tagName)
    }
    else {
      agent.add('Sorry, the category you inquired is not availabel.')
    }

  }

  async function queryCart() {
    await getCart()
    if (cart.products.length == 0) {
      agent.add("Your cart is empty now.")
    }
    else {
      let cartItem = ""
      let totalCost = 0
      let hats = 0
      let sweatshirts = 0
      let plushes = 0
      let leggings = 0
      let tees = 0
      let bottoms = 0
      for (i = 0; i < cart.products.length; i++) {
        cartItem += cart.products[i].count + ' ' + cart.products[i].name + ', '
        totalCost += cart.products[i].price
        switch (cart.products[i].category) {
          case "hats":
            hats += cart.products[i].count;
            break;
          case "sweatshirts":
            sweatshirts += cart.products[i].count;
            break;
          case "plushes":
            plushes += cart.products[i].count;
            break;
          case "leggings":
            leggings += cart.products[i].count;
            break;
          case "tees":
            tees += cart.products[i].count;
            break;
          case "bottoms":
            bottoms += cart.products[i].count;
            break;
        }
      }
      agent.add("You now have " + cartItem + "you have " + hats + " hats , " + sweatshirts + " sweatshirts, " + plushes + " plushes, " + leggings + " leggings, " + tees + " tees, " + bottoms + " bottoms. Your total cost is $" + totalCost + ".")
    }
  }

  async function queryProduct() {
    product = agent.parameters.Product
    if (await getProduct(product, true) != null) {
      await getProductInfo();
      tagName = ""
      for (i = 0; i < productTag.tags.length; i++) {
        tagName += productTag.tags[i] + " "
      }
      agent.add("The price of " + product + " is $" + productInfo.price + ". The description says " + productInfo.description + " It is under the category of " + productInfo.category + "." + "Tags are: " + tagName)
    }
    else {
      agent.add("The product you asked is not available. Please try again.")
    }
  }

  async function queryReview() {
    await getReview()
    if (review.reviews.length == 0) {
      agent.add("Unfortunately, this product currently has no review.")
    }
    else {
      reviewText = ""
      rating = 0
      for (i = 0; i < review.reviews.length; i++) {
        reviewText += review.reviews[i].text + " "
        rating += review.reviews[i].stars
      }
      rating = rating / review.reviews.length
      agent.add("The reviews of this product said, " + reviewText + ". The average rating of this product is " + rating + ' stars.')
    }
  }

  async function filterByTag(tag) {
    let request = {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      redirect: 'follow'
    }

    let response = await fetch(ENDPOINT_URL + '/application/tags/' + tag, request);
    let result = await response.json();
    return
  }

  async function actionTag() {
    tag = agent.parameters.tag
    await filterByTag(tag)
    agent.add("Here are the products that have the tag " + tag)
  }

  async function addProduct(quantity, product) {
    // get product id
    added = true
    if (await getProduct(product, true) != null) {
      let request = {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        redirect: 'follow'
      }
      for (i = 0; i < quantity; i++) {
        let response = await fetch(ENDPOINT_URL + '/application/products/' + productId, request);
        if (response.status != 200) { added = false }
      }
      if (added) {
        agent.add(quantity + " " + product + " has been successfully added. Please go to your cart to review and check out.")
      }
      else {
        agent.add("Add product failed. Please try to log in or try again later")
      }
    }
    else {
      // product not exist
      agent.add("Sorry, the product you want to add to cart is currently not available. Please try to add another product.")
    }
  }

  async function actionAddCart() {
    quantity = agent.parameters.quantity
    product = agent.parameters.Product
    await addProduct(quantity, product)
  }

  async function deleteProduct(product) {
    // get product id
    deleted = true
    if (await getProduct(product, true) != null) {
      let request = {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        redirect: 'follow'
      }
      let response = await fetch(ENDPOINT_URL + '/application/products/' + productId, request);
      if (response.status != 200) { added = false }
      if (deleted) {
        agent.add(product + " has been successfully deleted. Please feel free to review the rest of your cart.")
      }
      else {
        agent.add("Delete product failed. Please try to log in or try again later")
      }
    }
    else {
      // product not exist
      agent.add("Sorry, the product you want to add to cart is currently not available.")
    }
  }

  async function actionDeleteCart() {
    product = agent.parameters.Product
    await deleteProduct(product)
  }

  async function actionReview(){
    let request = {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
          "back": false,
          "dialogflowUpdated": true,
          "page": "/" + username + "/cart-review",
      }),
      redirect: 'follow'
    }
    let response = await fetch(ENDPOINT_URL + '/application', request);
    console.log(response)
    agent.add("Sure! Here is your cart. Please let me know at any time you would like to check out after reviewing it.")
  }

//GET on application/products

  let intentMap = new Map()
  intentMap.set('Default Welcome Intent', welcome)
  // You will need to declare this `Login` content in DialogFlow to make this work
  intentMap.set('Login', login)
  intentMap.set('checklogin', checklogin)
  intentMap.set('Query_Category', queryCategory)
  intentMap.set('Query_Tag', queryTag)
  intentMap.set('Query_Cart', queryCart)
  intentMap.set('Query_Product', queryProduct)
  intentMap.set('Query_Product - review', queryReview)
  intentMap.set('Action_Tag', actionTag)
  intentMap.set('Action_Cart_Add', actionAddCart)
  intentMap.set('Action_Cart_Delete', actionDeleteCart)
  intentMap.set('Action_Cart_Review', actionReview)
  agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 8080)
