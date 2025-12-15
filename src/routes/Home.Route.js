import express from 'express'
import HomeController from '../controllers/HomeController.js'

const HomeRoute = express.Router()

// HomeRoute.get('/GifCookie', HomeController.giftCookie)
HomeRoute.get('/', HomeController.index)
HomeRoute.get('/flash-sale', HomeController.flashSale)
HomeRoute.get('/gift-page', HomeController.giftPage)

export default HomeRoute
