import time
import numpy as np
import os
from datetime import datetime
import copy
os.environ['TF_CPP_MIN_LOG_LEVEL']='2'

import zmq
import logging
from common.network import *
from common import zmq_serdes
from common.protocol.msg import *
from common.protocol.constant import *
import codecs, json 
import random
from pymongo import MongoClient
import pickle
from bson.binary import Binary

## for Model definition/training
from keras.models import Model, load_model
from keras.layers import Input, Flatten, Dense, concatenate,  Dropout, Lambda
from keras.optimizers import Adam

from keras.utils import plot_model
from keras.callbacks import ModelCheckpoint

## required for semi-hard triplet loss:
from tensorflow.python.ops import array_ops
from tensorflow.python.ops import math_ops
from tensorflow.python.framework import dtypes
from tensorflow.python.ops import nn

import tensorflow as tf

def create_base_network(image_input_shape=FEATURE_SHAPE(), embedding_size=64):
    """
    Base network to be shared (eq. to feature extraction).
    """
    input_image = Input(shape=image_input_shape)

    x = Flatten()(input_image)
    x = Dropout(0.1)(x)
    x = Dense(512, activation='sigmoid')(x)
    x = Dropout(0.1)(x)
    x = Dense(embedding_size)(x)
    x = Lambda(lambda x :nn.l2_normalize(x, axis=1, epsilon=1e-10))(x)

    base_network = Model(inputs=input_image, outputs=x)

    return base_network

#   using network
    # testing_embeddings = create_base_network(input_image_shape,
    #                                          embedding_size=embedding_size)
    # # Grabbing the weights from the trained network
    # for layer_target, layer_source in zip(testing_embeddings.layers, model.layers[2].layers):
    #     weights = layer_source.get_weights()
    #     layer_target.set_weights(weights)
    #     del weights

    # x_embeddings = testing_embeddings.predict(np.reshape(img_input, (len(img_input)), 28, 28, 1)))

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

def face_recog_proc(sock, db, model):

    # Type should be RecogMsg
    work = zmq_serdes.recv_zipped_pickle(sock)
    
    logging.info('Received a work from recog-sched (req_id={})'.format(work.req_id))

    # Calculate embeddings from model
    embedding = model.predict(np.array([work.face_id]))
    logging.debug("Embedding calculated")

    # [TODO] ANN and send result to front-end-server

def update_model_proc(sock, db, model):

    # Type of this should be DeployMsg
    notification = zmq_serdes.recv_zipped_pickle(sock)

    logging.info('Received model deploy notification from train-unit (serial={})'.format(notification.serial))

    # Fetch weights from MongoDB
    weights = fetch_weight_from_mongodb(db)

    # Copy weights to base model
    new_model = copy_weights(model, weights)
    
    return new_model

def main():
  LOG_FORMAT = '%(asctime)s [recog-unit]: [%(levelname)s] %(message)s'
  logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)

  logging.info('I am a recog-unit')
  
  # Connection to MongoDB
  db_uri = "mongodb://localhost" 
  try: 
    db_client = MongoClient(db_uri)
    db_database = db_client['vireality_face_recog_backend']
    logging.info("Connected to database")
    db_client.server_info()
  except:
    logging.critical("Connect to database failed. Check if mongoDB alive.")

  # Create model
  embedding_model = create_model_from_mongodb(db_database)

  context = zmq.Context()
  # Socket to receive work
  work_recv = context.socket(zmq.PULL)
  work_recv.connect(get_zmq_uri(RECOG_SCHED_IP(), RECOG_ISSUE_PORT()))
  # Socket to receive new model publication
  model_recv = context.socket(zmq.PULL)
  model_recv.connect(get_zmq_uri(TRAIN_IP(), TRAIN_PUBLISH_PORT()))
  # Socket to send result
  result_sender = context.socket(zmq.PUSH)
  result_sender.connect(get_zmq_uri(FRONT_IP(), FRONT_RECV_PORT()))

  # Register sockets to ZeroMQ event poller
  zmq_poller = zmq.Poller()
  zmq_poller.register(work_recv, zmq.POLLIN)
  zmq_poller.register(model_recv, zmq.POLLIN)

  logging.info('Begin receive works from recog-sched')

  # Polling on both socket.
  # If there are incoming messages, execute coresponsed procedure.
  while True:
    socks = dict(zmq_poller.poll(1000))
    if work_recv in socks and socks[work_recv] == zmq.POLLIN:
        face_recog_proc(
            work_recv,
            db_database,
            embedding_model)
    if model_recv in socks and socks[model_recv] == zmq.POLLIN:
        embedding_model = update_model_proc(
            model_recv,
            db_database,
            embedding_model)

if __name__ == "__main__":
    main()