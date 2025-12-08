import express from 'express';
import CollectionsController from '../controllers/CollectionsController.js';

const CollectionRoute = express.Router();

CollectionRoute.get('/', CollectionsController.index);
CollectionRoute.get('/:slug', CollectionsController.show);

export default CollectionRoute;
