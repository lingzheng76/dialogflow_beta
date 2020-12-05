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
let productCategory = "";
let errormessage = "Sorry, something went wrong. Please check and try again later.";

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

  let response = await fetch(ENDPOINT_URL + '/categories', request);
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
        productCategory = result.products[i].category
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

  async function welcome() {
    await postUserMessage(agent.query)
    message = 'Welcome to WiscShop! How can I assist?'
    agent.add(message)
    await postAgentMessage(message)
  }

  async function login() {
    // You need to set this from `username` entity that you declare in DialogFlow
    username = agent.parameters.username
    // You need to set this from password entity that you declare in DialogFlow
    password = agent.parameters.password
    // clear up history messages upon successful log in

    if (await getToken() == 200) {
      let request = {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        redirect: 'follow'
      }
      let response = await fetch(ENDPOINT_URL + '/application/messages/', request);
      message = 'log in success! How can I assist you today?'
      agent.add(message)
      postAgentMessage(message)
    }
    else {
      message = 'log in failed. Please try to log in again'
      agent.add(message)
      postAgentMessage(message)
    }
  }

  async function endConversation(){
    await postUserMessage(agent.query)
    message = "Thank you for visiting WiscShop. Please come back in the future!"
    agent.add(message)
    await postAgentMessage(message)
    let request = {
      method: 'DELETE',
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      redirect: 'follow'
    }
    let response = await fetch(ENDPOINT_URL + '/application/messages/', request);
    username = ""
    password = ""
    token = ""
  }

  // test for checking if the user is logged in
  async function checklogin() {
    if (await getToken() == 200) {
      agent.add('log in success')
    }
    else {
      agent.add('log in failed')
    }
  }

  async function queryCategory() {
    await postUserMessage(agent.query)
    await getCategory()
    // make all categories into a string
    categoryName = ""
    for (i = 0; i < categories.categories.length; i++) {
      categoryName += categories.categories[i] + ", "
    }
    message = 'Sure. The product categories we have are ' + categoryName + "what else would you like to know?"
    agent.add(message)
    postAgentMessage(message)
  }

  async function queryTag() {
    await postUserMessage(agent.query)
    category = agent.parameters.category
    if (await getCategoryTag(category) == 200) {
      tagName = ""
      for (i = 0; i < tags.tags.length; i++) {
        tagName += tags.tags[i] + ", "
      }
      message = 'No problem. The tags under category ' + category + ' are ' + tagName + "anything else I can help you with today?"
      agent.add(message)
      postAgentMessage(message)
    }
    else {
      message = 'Sorry, the category you inquired is not availabel.'
      agent.add(message)
      postAgentMessage(message)
    }

  }

  async function queryCart() {
    await postUserMessage(agent.query)
    await getCart()
    if (cart.products.length == 0) {
      message = "Your cart is empty now."
      agent.add(message)
      postAgentMessage(message)
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
      message = "You now have " + cartItem + "you have " + hats + " hats , " + sweatshirts + " sweatshirts, " + plushes + " plushes, " + leggings + " leggings, " + tees + " tees, " + bottoms + " bottoms. Your total cost is $" + totalCost + ". Please feel free to review the cart and then check out."
      agent.add(message)
      postAgentMessage(message)
    }
  }

  async function queryProduct() {
    await postUserMessage(agent.query)
    product = agent.parameters.Product
    if (await getProduct(product, true) != null) {
      await getProductInfo();
      tagName = ""
      for (i = 0; i < productTag.tags.length; i++) {
        tagName += productTag.tags[i] + " "
      }
      message = "Sure. The price of " + product + " is $" + productInfo.price + ". The description says, " + productInfo.description + " It is under the category of " + productInfo.category + "." + "Tags are: " + tagName + ". Please let me know if you would like to know the reviews and the rating of this product."
      agent.add(message)
      postAgentMessage(message)
    }
    else {
      message = "Sorry, the product you asked is not available. Please try again."
      agent.add(message)
      postAgentMessage(message)
    }
  }

  async function queryReview() {
    await postUserMessage(agent.query)
    await getReview()
    if (review.reviews.length == 0) {
      message = "Unfortunately, this product currently has no review."
      agent.add(message)
      postAgentMessage(message)
    }
    else {
      reviewText = ""
      rating = 0
      for (i = 0; i < review.reviews.length; i++) {
        reviewText += review.reviews[i].text + " "
        rating += review.reviews[i].stars
      }
      rating = rating / review.reviews.length
      message = "The reviews of this product said, " + reviewText + ". The average rating of this product is " + rating + ' stars.'
      agent.add(message)
      postAgentMessage(message)
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
    await postUserMessage(agent.query)
    tag = agent.parameters.tag
    await filterByTag(tag)
    message = "Ok! Here are the products that have the tag " + tag
    agent.add(message)
    postAgentMessage(message)
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
        message = "Sounds good! " + quantity + " " + product + " has been successfully added. Please feel free go to your cart to review and check out."
        agent.add(message)
        postAgentMessage(message)
      }
      else {
        message = "Sorry, add product failed. Please try to log in or try again later"
        agent.add(message)
        postAgentMessage(message)
      }
    }
    else {
      // product not exist
      message = "Sorry, the product you want to add to cart is currently not available. Please try to add another product."
      agent.add(message)
      postAgentMessage(message)
    }
  }

  async function actionAddCart() {
    await postUserMessage(agent.query)
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
        message = "No problem. " + product + " has been successfully deleted. Please feel free to make change to the rest of your cart."
        agent.add(message)
        postAgentMessage(message)
      }
      else {
        agent.add(errormessage)
        postAgentMessage(errormessage)
      }
    }
    else {
      // product not exist
      message = "Sorry, the product you want to add to cart is currently not available."
      agent.add(message)
      postAgentMessage(message)
    }
  }

  async function actionDeleteCart() {
    await postUserMessage(agent.query)
    product = agent.parameters.Product
    await deleteProduct(product)
  }

  async function actionClearCart() {
    await postUserMessage(agent.query)
    let request = {
      method: 'DELETE',
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      redirect: 'follow'
    }
    let response = await fetch(ENDPOINT_URL + '/application/products', request);
    message = "No problem. Your cart is empty now."
    agent.add(message)
    postAgentMessage(message)
  }

  async function actionReview() {
    await postUserMessage(agent.query)
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
    if (response.status == 200) {
      message = "Sure! Here is your cart. Please let me know at any time if you would like to confirm your cart to check out."
      agent.add(message)
      postAgentMessage(message)
    }
    else {
      agent.add(errormessage)
      postAgentMessage(errormessage);
    }
  }

  async function checkout() {
    await postUserMessage(agent.query)
    let request = {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        "back": false,
        "dialogflowUpdated": true,
        "page": "/" + username + "/cart-confirmed",
      }),
      redirect: 'follow'
    }
    let response = await fetch(ENDPOINT_URL + '/application', request);
    if (response.status == 200) {
      message = "Thanks for confirming your cart! Please feel free to visit WiscShop again at any time!"
      agent.add(message)
      postAgentMessage(message)
    }
    else {
      agent.add(errormessage)
      postAgentMessage(errormessage);
    }
  }

  function route(route) {
    switch (route) {
      case "sign in":
        route = "signIn";
        break;
      case "sign up":
        route = "signUp";
      case "welcome":
        route = username;
        break;
      case "cart":
        route = username + "/cart";
        break;
      case "cart review":
        route = username + "/cart-review";
        break;
      case "cart confirm" || "purchase":
        route = username + "/cart-confirmed";
        break;

      default:
        break;
    }

    let request = {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        "back": false,
        "dialogflowUpdated": true,
        "page": "/" + route,
      }),
      redirect: 'follow'
    }
    return request
  }

  async function navigate() {
    await postUserMessage(agent.query)
    page = agent.parameters.page
    category = agent.parameters.category
    product = agent.parameters.Product
    // page route
    if (page != "") {
      let response = await fetch(ENDPOINT_URL + '/application', route(page));
      if (response.status == 200) {
        message = "On it. Here is the " + page + " page."
        agent.add(message)
        postAgentMessage(message);
      }
      else {
        agent.add(errormessage)
        postAgentMessage(errormessage);
      }
    }
    // category route
    else if (category != "") {
      categoryRoute = username + "/" + category
      let response = await fetch(ENDPOINT_URL + '/application', route(categoryRoute));
      if (response.status == 200) {
        message = "On it. Here is the " + category + " page."
        agent.add(message)
        postAgentMessage(message);
      }
      else {
        agent.add(errormessage)
        postAgentMessage(errormessage);
      }
    }
    // product route
    else if (product != "") {
      // get product category
      await getProduct(product, true)
      productRoute = username + "/" + productCategory + "/products/" + productId
      let response = await fetch(ENDPOINT_URL + '/application', route(productRoute));
      if (response.status == 200) {
        message = "On it. Here is the " + product + " page."
        agent.add(message)
        postAgentMessage(message);
      }
      else {
        agent.add(errormessage)
        postAgentMessage(errormessage);
      }
    }
    else {
      agent.add(errormessage)
      postAgentMessage(errormessage);
    }
  }

  async function postUserMessage(text) {
    let request = {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        "date": new Date(),
        "isUser": true,
        "text": text,
      }),
      redirect: 'follow'
    }
    let response = await fetch(ENDPOINT_URL + '/application/messages', request);
    return
  }

  async function postAgentMessage(text) {
    let request = {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        "date": new Date(),
        "isUser": false,
        "text": text,
      }),
      redirect: 'follow'
    }
    let response = await fetch(ENDPOINT_URL + '/application/messages', request);
    return
  }

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
  intentMap.set('Action_Cart_Review - Check Out', checkout)
  intentMap.set('Navigation', navigate)
  intentMap.set('Action_Cart_Clear', actionClearCart)
  intentMap.set('End_Conversation', endConversation)
  agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 8080)
