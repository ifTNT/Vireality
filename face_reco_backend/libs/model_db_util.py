import logging
import pickle
from common.neural_network import create_base_network
import numpy as np
from bson.binary import Binary

def fetch_weight_from_mongodb(db):
    # Selection collection from database
    weight_collection = db['weight']

    bin_weight = weight_collection.find()

    if bin_weight.count(True)==0:
        raise "The weight is not in the MnogoDB. Please traing first."
    bin_weight = bin_weight[0]['model']

    logging.info("Weight loaded from MongoDB succesfully.")

    return pickle.loads(bin_weight)


def copy_weights(target, weights):
    for layer_target, weight in zip(target.layers, weights):
      layer_target.set_weights(weight)
    
    return target

def create_model_from_mongodb(db):
    base_model = create_base_network()

    # Fetch weights from MongoDB
    weights = fetch_weight_from_mongodb(db)

    # Copy weights to base model
    weighted_model = copy_weights(base_model, weights)

    return weighted_model

def add_train_sample_to_mongodb(db, user_id, features):
    # Select the collection from db
    train_collection = db['train']

    # Construct the new training data by flatten the training requests
    new_train_data = [
        {
            'user_id': user_id,
            'feature': feature.tolist()
        } for feature in features
    ]

    # Save to MongoDB
    train_collection.insert_many(new_train_data)

def fetch_train_sample_from_mongodb(db):
    # Select the collection from db
    train_collection = db['train']

    # The value that stored the faceID and the label
    x_faceId = []
    y_label = []

    # Enumerate all of the faces
    for sample in train_collection.find():
        y_label.append(sample['user_id'])
        x_faceId.append(sample['feature'])

    # Convert to numpy array
    x_faceId = np.array(x_faceId)
    y_label = np.array(y_label)

    return (x_faceId, y_label)

def save_weight_to_mongodb(db, weight):
    # Select the collection from db
    weight_collection = db['weight']

    # Serialized weight
    bin_weight = Binary(pickle.dumps(weight))

    # Remove the old weights and insert new weights
    weight_collection.drop()
    weight_collection.insert({'model': bin_weight})

def flush_and_save_emb_to_mongodb(db, new_database):
    # Select the collection from db
    embedding_collection = db['face_id']

    # Remove the old datas.
    # Due to all of the data will be modified when training new model. 
    embedding_collection.drop()

    add_emb_to_mongodb(db, new_database)

def add_emb_to_mongodb(db, new_database):
    # Select the collection from db
    embedding_collection = db['face_id']

    new_documents = [{
            'user_id': user_id,
            'embedding': embedding.tolist()
        } for user_id, embedding in new_database]

    # Save to MongoDB
    embedding_collection.insert_many(new_documents)